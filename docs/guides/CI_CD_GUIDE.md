# Glimpse CI/CD 파이프라인 가이드

## 🔄 CI/CD 개요

Glimpse는 GitHub Actions를 사용하여 자동화된 CI/CD 파이프라인을 구축합니다. 모든 코드 변경사항은 자동으로 테스트되고, 검증된 후 배포됩니다.

### 파이프라인 목표
- **자동화**: 수동 작업 최소화
- **신속성**: 코드 푸시부터 배포까지 30분 이내
- **안정성**: 철저한 테스트와 단계적 배포
- **투명성**: 모든 단계의 진행 상황 가시화

## 🏗 파이프라인 구조

```mermaid
graph LR
    A[코드 푸시] --> B[린트 & 타입 체크]
    B --> C[단위 테스트]
    C --> D[통합 테스트]
    D --> E[빌드]
    E --> F{브랜치?}
    F -->|develop| G[스테이징 배포]
    F -->|main| H[프로덕션 배포]
    G --> I[E2E 테스트]
    H --> J[헬스 체크]
```

## 📁 GitHub Actions 설정

### 디렉토리 구조
```
.github/
├── workflows/
│   ├── ci.yml              # 메인 CI 파이프라인
│   ├── cd-staging.yml      # 스테이징 배포
│   ├── cd-production.yml   # 프로덕션 배포
│   ├── security.yml        # 보안 스캔
│   └── cron-jobs.yml       # 정기 작업
├── actions/
│   ├── setup-node/         # Node.js 설정 액션
│   └── deploy/             # 배포 액션
└── PULL_REQUEST_TEMPLATE.md
```

## 🚀 메인 CI 파이프라인

### `.github/workflows/ci.yml`
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  POSTGRES_VERSION: '14'

jobs:
  # 1. 코드 품질 검사
  code-quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # SonarCloud 분석을 위한 전체 히스토리
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
        
      - name: Run Prettier check
        run: npm run format:check
      
      - name: TypeScript type check
        run: npm run typecheck
      
      - name: Check for circular dependencies
        run: npx madge --circular --extensions ts,tsx ./src

  # 2. 단위 테스트
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: code-quality
    
    strategy:
      matrix:
        workspace: [server, mobile, shared]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests for ${{ matrix.workspace }}
        run: npm run test:unit --workspace=${{ matrix.workspace }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          flags: ${{ matrix.workspace }}
          files: ./${{ matrix.workspace }}/coverage/lcov.info

  # 3. 통합 테스트
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:${{ env.POSTGRES_VERSION }}
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: glimpse_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          cd server
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/glimpse_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/glimpse_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key
          ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

  # 4. 빌드
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    
    strategy:
      matrix:
        include:
          - workspace: server
            dockerfile: ./server/Dockerfile
          - workspace: mobile
            platform: [ios, android]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      # 서버 빌드
      - name: Build server
        if: matrix.workspace == 'server'
        run: |
          npm run build --workspace=shared
          npm run build --workspace=server
      
      # 모바일 빌드 (EAS)
      - name: Setup Expo
        if: matrix.workspace == 'mobile'
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build mobile app
        if: matrix.workspace == 'mobile'
        run: |
          cd mobile
          eas build --platform ${{ matrix.platform }} --non-interactive --no-wait
      
      # Docker 이미지 빌드 (서버)
      - name: Set up Docker Buildx
        if: matrix.workspace == 'server'
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        if: matrix.workspace == 'server'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Docker image
        if: matrix.workspace == 'server'
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            glimpse/server:latest
            glimpse/server:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 5. 보안 스캔
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: build
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: |
          npm audit --audit-level=moderate
          cd server && npm audit --audit-level=moderate
          cd ../mobile && npm audit --audit-level=moderate

  # 6. E2E 테스트 (PR only)
  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Start test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          npm run wait-for-services
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## 🚢 스테이징 배포

### `.github/workflows/cd-staging.yml`
```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: deploy/staging/task-definition.json
          service: glimpse-staging
          cluster: glimpse-staging-cluster
          wait-for-service-stability: true
      
      - name: Run database migrations
        run: |
          aws ecs run-task \
            --cluster glimpse-staging-cluster \
            --task-definition glimpse-migrate-staging \
            --network-configuration "awsvpcConfiguration={subnets=[${{ secrets.STAGING_SUBNET_IDS }}],securityGroups=[${{ secrets.STAGING_SECURITY_GROUP_ID }}]}"
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🎯 프로덕션 배포

### `.github/workflows/cd-production.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  # 1. 배포 승인
  approval:
    name: Deployment Approval
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Request approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: tech-lead,product-manager
          minimum-approvals: 1
          issue-title: "Production deployment approval needed"

  # 2. 블루-그린 배포
  deploy:
    name: Blue-Green Deployment
    runs-on: ubuntu-latest
    needs: approval
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.PROD_AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.PROD_AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      # Blue-Green 배포 스크립트
      - name: Execute Blue-Green deployment
        run: |
          ./scripts/deploy-blue-green.sh production ${{ github.event.inputs.version || github.sha }}
      
      # 헬스 체크
      - name: Health check
        run: |
          for i in {1..30}; do
            if curl -f https://api.glimpse.app/health; then
              echo "Health check passed"
              exit 0
            fi
            echo "Waiting for service to be healthy..."
            sleep 10
          done
          echo "Health check failed"
          exit 1
      
      # 스모크 테스트
      - name: Run smoke tests
        run: |
          npm run test:smoke -- --env=production
      
      # 트래픽 전환
      - name: Switch traffic to new version
        run: |
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.PROD_ALB_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ env.NEW_TARGET_GROUP_ARN }}
      
      # 이전 버전 정리
      - name: Cleanup old version
        run: |
          sleep 300  # 5분 대기
          ./scripts/cleanup-old-deployment.sh

  # 3. 배포 후 작업
  post-deploy:
    name: Post Deployment
    runs-on: ubuntu-latest
    needs: deploy
    
    steps:
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          body: |
            ## Changes
            ${{ github.event.head_commit.message }}
            
            ## Deployment Info
            - Environment: Production
            - Commit: ${{ github.sha }}
            - Deployed by: ${{ github.actor }}
      
      - name: Update deployment status
        uses: chrnorm/deployment-status@v2
        with:
          token: ${{ github.TOKEN }}
          environment: production
          state: success
          deployment-id: ${{ steps.deployment.outputs.deployment_id }}
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: "🚀 Production deployment completed successfully!",
              attachments: [{
                color: 'good',
                fields: [
                  { title: 'Version', value: '${{ github.sha }}', short: true },
                  { title: 'Deployed by', value: '${{ github.actor }}', short: true },
                  { title: 'Environment', value: 'Production', short: true }
                ]
              }]
            }
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔒 보안 스캔 워크플로우

### `.github/workflows/security.yml`
```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * *'  # 매일 자정
  workflow_dispatch:

jobs:
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --all-projects --severity-threshold=high
      
      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Glimpse'
          path: '.'
          format: 'HTML'
          args: >
            --enableRetired
            --enableExperimental
      
      - name: Upload dependency check results
        uses: actions/upload-artifact@v3
        with:
          name: dependency-check-report
          path: reports/

  code-scan:
    name: Code Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

  container-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Run Trivy on production images
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'glimpse/server:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

## ⏰ 정기 작업

### `.github/workflows/cron-jobs.yml`
```yaml
name: Scheduled Jobs

on:
  schedule:
    - cron: '0 2 * * *'    # 매일 새벽 2시
    - cron: '0 */6 * * *'  # 6시간마다
    - cron: '0 0 * * 0'    # 매주 일요일 자정

jobs:
  daily-cleanup:
    name: Daily Cleanup
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *'
    
    steps:
      - name: Cleanup old deployments
        run: |
          # ECR 이미지 정리 (30일 이상)
          aws ecr describe-images --repository-name glimpse/server \
            --query 'imageDetails[?imagePushedAt < `'$(date -d '30 days ago' --iso-8601)'`].imageDigest' \
            --output text | xargs -I {} aws ecr batch-delete-image \
            --repository-name glimpse/server --image-ids imageDigest={}
      
      - name: Database maintenance
        run: |
          # 오래된 로그 정리
          aws ecs run-task \
            --cluster glimpse-production \
            --task-definition glimpse-db-maintenance

  health-check:
    name: Health Check
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 */6 * * *'
    
    steps:
      - name: Check all environments
        run: |
          for env in production staging; do
            response=$(curl -s -o /dev/null -w "%{http_code}" https://api-${env}.glimpse.app/health)
            if [ $response -ne 200 ]; then
              echo "Health check failed for $env"
              # 알림 전송
            fi
          done

  weekly-report:
    name: Weekly Report
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 0 * * 0'
    
    steps:
      - name: Generate deployment report
        run: |
          # 주간 배포 통계 생성
          ./scripts/generate-weekly-report.sh
```

## 🛠 커스텀 액션

### `.github/actions/setup-node/action.yml`
```yaml
name: 'Setup Node.js Environment'
description: 'Setup Node.js with caching'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'

runs:
  using: 'composite'
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
    
    - name: Cache node_modules
      uses: actions/cache@v3
      with:
        path: |
          node_modules
          */node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-node-
    
    - name: Install dependencies
      shell: bash
      run: |
        npm ci --prefer-offline --no-audit
```

## 📊 CI/CD 메트릭

### 추적 지표
- **빌드 시간**: 평균 15분 이내
- **테스트 커버리지**: 80% 이상 유지
- **배포 성공률**: 99% 이상
- **롤백 시간**: 5분 이내

### 모니터링 대시보드
```yaml
# GitHub Actions 메트릭을 Grafana로 전송
- name: Send metrics
  if: always()
  run: |
    curl -X POST ${{ secrets.METRICS_ENDPOINT }} \
      -H "Content-Type: application/json" \
      -d '{
        "job": "${{ github.job }}",
        "status": "${{ job.status }}",
        "duration": "${{ steps.timer.outputs.duration }}",
        "repository": "${{ github.repository }}",
        "branch": "${{ github.ref }}"
      }'
```

## 🚨 트러블슈팅

### 자주 발생하는 문제

1. **Node modules 캐시 문제**
   ```yaml
   - name: Clear cache
     run: |
       rm -rf node_modules
       npm cache clean --force
   ```

2. **Docker 빌드 실패**
   ```yaml
   - name: Debug Docker build
     run: |
       docker buildx build --progress=plain .
   ```

3. **테스트 타임아웃**
   ```yaml
   timeout-minutes: 30  # 기본값 증가
   ```

## 🎯 브랜치 전략

### Git Flow
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정
- `release/*`: 릴리스 준비

### 브랜치 보호 규칙
```yaml
# main 브랜치 보호
- 직접 푸시 금지
- PR 필수
- 2명 이상 리뷰 승인
- 모든 CI 체크 통과
- 최신 브랜치와 동기화
```

## 📝 PR 템플릿

### `.github/PULL_REQUEST_TEMPLATE.md`
```markdown
## 📋 작업 내용
<!-- 구현한 기능이나 수정사항을 간단히 설명해주세요 -->

## 🔗 관련 이슈
<!-- 관련된 이슈 번호를 링크해주세요 -->
- Closes #

## ✅ 체크리스트
- [ ] 코드 리뷰 요청 전 자체 리뷰 완료
- [ ] 테스트 코드 작성/수정
- [ ] 문서 업데이트 (필요한 경우)
- [ ] 모든 CI 체크 통과
- [ ] 브레이킹 체인지 없음

## 📸 스크린샷
<!-- UI 변경사항이 있다면 스크린샷을 첨부해주세요 -->

## 🧪 테스트 방법
<!-- 리뷰어가 테스트할 수 있는 방법을 설명해주세요 -->
1. 
2. 
3. 
```

## 🔧 로컬 CI 실행

### act를 사용한 로컬 실행
```bash
# act 설치
brew install act

# CI 워크플로우 로컬 실행
act -j code-quality

# 특정 이벤트로 실행
act pull_request

# 시크릿 포함 실행
act -s GITHUB_TOKEN=$GITHUB_TOKEN
```

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [AWS ECS 배포 가이드](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [Docker 베스트 프랙티스](https://docs.docker.com/develop/dev-best-practices/)
- [Blue-Green 배포 전략](https://martinfowler.com/bliki/BlueGreenDeployment.html)