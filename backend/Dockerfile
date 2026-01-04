# ===================================
# Glimpse Backend - Production Dockerfile
# Multi-stage build for optimal image size
# ===================================

# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Gradle wrapper 복사
COPY gradlew .
COPY gradle gradle

# 의존성 먼저 다운로드 (캐싱 최적화)
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# 소스 복사 및 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Production
FROM eclipse-temurin:21-jre-alpine

# 필수 패키지 설치 및 보안: root 사용자 사용 금지
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# 빌드 결과물 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 소유권 변경
RUN chown -R appuser:appgroup /app

# 사용자 전환
USER appuser

# 헬스체크
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:3001/health || exit 1

# 포트 노출
EXPOSE 3001

# JVM 옵션
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 애플리케이션 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prd} app.jar"]

