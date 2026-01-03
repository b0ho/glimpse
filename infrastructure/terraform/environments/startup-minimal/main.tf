# ============================================================================
# Glimpse Startup Minimal Environment
# 최소 비용 프로덕션 환경 (0-500 사용자)
# 
# 예상 비용: ~$50-60/월
# ============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "glimpse-terraform-state-prod"
    key            = "minimal/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      Project     = "Glimpse"
      Environment = "production"
      ManagedBy   = "Terraform"
      CostProfile = "minimal"
    }
  }
}

locals {
  project_name = "glimpse"
  environment  = "prod"

  common_tags = {
    Project     = "Glimpse"
    Environment = "production"
    CostProfile = "minimal"
  }
}

# ============================================================================
# VPC (단순화)
# ============================================================================

module "networking" {
  source = "../../modules/networking"

  project_name       = local.project_name
  environment        = local.environment
  aws_region         = "ap-northeast-2"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["ap-northeast-2a", "ap-northeast-2c"]

  # ⚡ NAT Instance 사용 (NAT Gateway 대신) - $27/월 절감
  enable_nat_gateway = false
  enable_nat_instance = true
  nat_instance_type   = "t4g.nano"  # $3-5/월

  enable_vpc_endpoints = false

  tags = local.common_tags
}

# ============================================================================
# ALB (필수 - HTTPS 종단점)
# 비용: ~$16/월
# ============================================================================

resource "aws_security_group" "alb" {
  name        = "${local.project_name}-${local.environment}-alb"
  description = "ALB security group"
  vpc_id      = module.networking.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_lb" "main" {
  name               = "${local.project_name}-${local.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.networking.public_subnet_ids

  tags = local.common_tags
}

resource "aws_lb_target_group" "api" {
  name        = "${local.project_name}-api"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = module.networking.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ============================================================================
# ECS Fargate (최소 구성)
# 비용: ~$15/월 (1 task)
# ============================================================================

module "ecs" {
  source = "../../modules/ecs"

  project_name       = local.project_name
  environment        = local.environment
  aws_region         = "ap-northeast-2"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids

  alb_security_group_id = aws_security_group.alb.id
  alb_target_group_arn  = aws_lb_target_group.api.arn

  # RDS/Redis 연결 (Redis 없음)
  rds_security_group_id   = module.rds.security_group_id
  redis_security_group_id = null  # Redis 미사용

  api_image      = "${data.aws_caller_identity.current.account_id}.dkr.ecr.ap-northeast-2.amazonaws.com/glimpse-api:latest"
  container_port = 3001

  # ⚡ 최소 사양
  task_cpu    = "256"   # 0.25 vCPU
  task_memory = "512"   # 0.5 GB

  # ⚡ 단일 태스크로 시작
  desired_count = 1
  min_capacity  = 1
  max_capacity  = 4  # 필요시 확장

  cpu_target_value    = 70
  memory_target_value = 80

  log_retention_days        = 3  # 로그 보관 최소화
  enable_container_insights = false

  environment_variables = {
    NODE_ENV         = "production"
    PORT             = "3001"
    SMS_DEV_MODE     = "false"
    REDIS_ENABLED    = "false"  # Redis 비활성화
  }

  secret_variables = {
    DATABASE_URL = module.rds.master_password_secret_arn
    JWT_SECRET   = aws_secretsmanager_secret.jwt_secret.arn
  }

  secrets_arns = [
    module.rds.master_password_secret_arn,
    aws_secretsmanager_secret.jwt_secret.arn
  ]

  tags = local.common_tags

  depends_on = [module.networking, module.rds]
}

data "aws_caller_identity" "current" {}

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.project_name}-${local.environment}-jwt-secret"
  recovery_window_in_days = 0  # 즉시 삭제 가능 (비용 절감)

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret_key
}

# ============================================================================
# RDS PostgreSQL (Aurora 대신 단일 인스턴스)
# 비용: ~$13/월
# ============================================================================

module "rds" {
  source = "../../modules/rds"

  project_name        = local.project_name
  environment         = local.environment
  vpc_id              = module.networking.vpc_id
  database_subnet_ids = module.networking.database_subnet_ids

  allowed_security_group_ids = []  # ECS 배포 후 설정

  engine_version = "15.4"
  instance_class = "db.t4g.micro"
  instance_count = 1

  database_name   = "glimpse_prod"
  master_username = "glimpse_admin"

  backup_retention_period = 3  # 최소 백업 (비용 절감)
  performance_insights_enabled = false

  storage_encrypted = true

  tags = local.common_tags

  depends_on = [module.networking]
}

# ============================================================================
# S3 (파일 저장소)
# 비용: ~$1/월
# ============================================================================

module "s3" {
  source = "../../modules/s3"

  project_name = local.project_name
  environment  = local.environment

  buckets = {
    files = {
      versioning = false
      cors_rules = [
        {
          allowed_origins = ["*"]
          allowed_methods = ["GET", "PUT", "POST", "DELETE"]
          allowed_headers = ["*"]
        }
      ]
      lifecycle_rules = [
        {
          id      = "intelligent-tiering"
          enabled = true
          transition = {
            days          = 30
            storage_class = "INTELLIGENT_TIERING"
          }
        }
      ]
    }
  }

  tags = local.common_tags
}

# ============================================================================
# CloudFront (선택적 - 초기에는 비활성화 가능)
# 비용: ~$0-5/월 (트래픽에 따라)
# ============================================================================

# 초기에는 CloudFront 없이 S3 직접 접근 또는 비활성화
# 트래픽이 늘어나면 활성화

# ============================================================================
# 제외된 서비스 (비용 절감)
# ============================================================================

# ❌ ElastiCache Redis - 인메모리로 대체 (~$12/월 절감)
# ❌ API Gateway - ALB 직접 사용 (~$3/월 절감)
# ❌ NAT Gateway - NAT Instance 사용 (~$27/월 절감)
# ❌ CloudWatch Container Insights - 비활성화
# ❌ Performance Insights - 비활성화
# ❌ Multi-AZ - 단일 AZ로 시작

# ============================================================================
# 예상 월 비용 요약
# ============================================================================
# 
# NAT Instance (t4g.nano):     $5
# ALB:                         $16
# ECS Fargate (1 task):        $15
# RDS (db.t4g.micro):          $13
# S3:                          $1
# Secrets Manager:             $1
# CloudWatch Logs:             $2
# ECR:                         $1
# ----------------------------
# 합계:                        ~$54/월
#
# 절감: $120 → $54 (55% 절감, $66/월 절약)
# ============================================================================

# ============================================================================
# Outputs
# ============================================================================

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "rds_endpoint" {
  value     = module.rds.cluster_endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = module.s3.bucket_names["files"]
}

output "monthly_cost_estimate" {
  value = "~$54/month"
}

