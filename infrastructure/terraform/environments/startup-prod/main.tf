# Glimpse Startup Production Environment
# Mobile + Server Only (No Web/Admin)
# Cost-optimized & Scalable Infrastructure
# Phase 1: MVP (0-1k users) - $141/month (ECS Fargate)
# Auto-scales to handle 10k+ users with minimal changes

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
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "glimpse-terraform-locks-prod"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project      = "Glimpse"
      Environment  = "production"
      ManagedBy    = "Terraform"
      CostProfile  = "startup-optimized"
      Owner        = "devops-team"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ===================================
# Local Variables
# ===================================

locals {
  project_name = "glimpse"
  environment  = "prod"

  common_tags = {
    Project      = "Glimpse"
    Environment  = "production"
    ManagedBy    = "Terraform"
    CostProfile  = "startup-optimized"
  }

  # Start with 2 AZs, can expand to 3 when needed
  availability_zones = [
    "ap-northeast-2a",
    "ap-northeast-2c"
  ]
}

# ===================================
# VPC & Networking
# ===================================

module "networking" {
  source = "../../modules/networking"

  project_name       = local.project_name
  environment        = local.environment
  aws_region         = var.aws_region
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = local.availability_zones

  # Single NAT Gateway for cost optimization
  # Can add Multi-AZ NAT when traffic increases
  enable_nat_gateway = true
  single_nat_gateway = true # Saves ~$98/month vs 3 NAT Gateways

  # Disable VPC endpoints initially for cost savings
  # Enable when NAT data transfer costs exceed $40/month
  enable_vpc_endpoints = false

  tags = local.common_tags
}

# ===================================
# Application Load Balancer (ECS 앞단)
# ===================================

resource "aws_lb" "main" {
  name               = "${local.project_name}-${local.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.networking.public_subnet_ids

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-${local.environment}-alb"
    }
  )
}

resource "aws_security_group" "alb" {
  name        = "${local.project_name}-${local.environment}-alb"
  description = "Security group for ALB"
  vpc_id      = module.networking.vpc_id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name}-${local.environment}-alb"
    }
  )
}

resource "aws_lb_target_group" "api" {
  name        = "${local.project_name}-api-${local.environment}"
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
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

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

# ===================================
# ECS Fargate Cluster
# ===================================

module "ecs" {
  source = "../../modules/ecs"

  project_name       = local.project_name
  environment        = local.environment
  aws_region         = var.aws_region
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids

  # ALB 설정
  alb_security_group_id = aws_security_group.alb.id
  alb_target_group_arn  = aws_lb_target_group.api.arn

  # RDS/Redis 연결
  rds_security_group_id   = module.rds.security_group_id
  redis_security_group_id = module.elasticache.security_group_id

  # Container 설정
  api_image      = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/glimpse-api:latest"
  container_port = 3001

  # Task 리소스 (Phase 1: 최소 사양)
  task_cpu    = "256"  # 0.25 vCPU
  task_memory = "512"  # 0.5 GB

  # Auto Scaling 설정 (Phase 5: 비용 최적화)
  desired_count = 2   # Phase 5: 3 → 2 태스크로 시작 (추가 $10/월 절감)
  min_capacity  = 1   # Phase 5: 2 → 1 최소값 (Auto Scaling 여유)
  max_capacity  = 20  # 최대 20개 (10k+ 유저 대응)

  cpu_target_value    = 70  # CPU 70% 도달 시 스케일 아웃
  memory_target_value = 80  # Memory 80% 도달 시 스케일 아웃

  # CloudWatch 설정
  log_retention_days        = 7
  enable_container_insights = false  # Phase 1: 비용 절감

  # 환경 변수
  environment_variables = {
    NODE_ENV = "production"
    PORT     = "3001"
  }

  # Secrets Manager 참조
  secret_variables = {
    DATABASE_URL = module.rds.master_password_secret_arn
    REDIS_URL    = module.elasticache.auth_token_secret_arn
    JWT_SECRET   = aws_secretsmanager_secret.jwt_secret.arn
  }

  secrets_arns = [
    module.rds.master_password_secret_arn,
    module.elasticache.auth_token_secret_arn,
    aws_secretsmanager_secret.jwt_secret.arn
  ]

  # S3 버킷 접근 권한
  s3_bucket_names = values(module.s3.bucket_names)

  # CloudWatch 알림
  alarm_sns_topic_arn = module.monitoring.sns_topic_arn

  tags = local.common_tags

  depends_on = [
    module.networking,
    module.rds,
    module.elasticache,
    aws_lb.main
  ]
}

# JWT Secret 생성
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.project_name}-${local.environment}-jwt-secret"
  description             = "JWT secret key for API authentication"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret_key
}

# ===================================
# RDS Aurora PostgreSQL
# ===================================

module "rds" {
  source = "../../modules/rds"

  project_name        = local.project_name
  environment         = local.environment
  vpc_id              = module.networking.vpc_id
  database_subnet_ids = module.networking.database_subnet_ids

  # Allow access from ECS tasks
  allowed_security_group_ids = [module.ecs.security_group_id]

  # Phase 1: Ultra cost-optimized, can scale up later
  engine_version = "15.4"
  instance_class = "db.t4g.micro" # 2 vCPU, 1GB RAM → $13/month (50% savings)
  instance_count = 1               # Single instance → Add reader when traffic grows

  database_name   = "glimpse_prod"
  master_username = "glimpse_admin"

  # Backup strategy: Automated daily backups
  backup_retention_period = 7  # Can increase to 30 days when needed
  preferred_backup_window = "03:00-04:00"

  # Maintenance window
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Phase 1: Disable for cost, enable when revenue allows
  performance_insights_enabled = false

  # Security: Enable encryption (minimal cost impact)
  storage_encrypted = true

  tags = local.common_tags

  depends_on = [module.networking]
}

# ===================================
# ElastiCache Redis
# ===================================

module "elasticache" {
  source = "../../modules/elasticache"

  project_name = local.project_name
  environment  = local.environment
  vpc_id       = module.networking.vpc_id
  subnet_ids   = module.networking.private_subnet_ids

  # Allow access from ECS tasks
  allowed_security_group_ids = [module.ecs.security_group_id]

  # Phase 1: Small but sufficient for caching
  engine_version         = "7.1"
  node_type              = "cache.t4g.micro" # 2 vCPU, 0.5GB RAM → $12/month
  num_cache_nodes        = 1                  # Single node → Add replica when needed
  parameter_group_family = "redis7"

  # Phase 1: Single node, enable failover when traffic grows
  automatic_failover_enabled = false
  multi_az_enabled           = false

  # Snapshot for disaster recovery
  snapshot_retention_limit = 1
  snapshot_window          = "03:00-05:00"

  # Security: Enable encryption (minimal performance impact)
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = local.common_tags

  depends_on = [module.networking]
}

# ===================================
# S3 Buckets
# ===================================

module "s3" {
  source = "../../modules/s3"

  project_name = local.project_name
  environment  = local.environment

  buckets = {
    # User uploaded files (프로필 사진, 채팅 파일 등)
    files = {
      versioning = false # Enable when needed
      cors_rules = [
        {
          allowed_origins = ["*"] # Mobile app can access
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
            storage_class = "INTELLIGENT_TIERING" # Auto-optimize costs
          }
        },
        {
          id              = "archive-old-files"
          enabled         = true
          transition = {
            days          = 90
            storage_class = "GLACIER_INSTANT_RETRIEVAL" # 68% cheaper
          }
        }
      ]
    }

    # Mobile app builds (APK, IPA for distribution)
    mobile-builds = {
      versioning = false
      lifecycle_rules = [
        {
          id              = "delete-old-builds"
          enabled         = true
          expiration_days = 90 # Keep last 3 months
        }
      ]
    }

    # Database backups - Aggressive cost optimization
    backups = {
      versioning = false
      lifecycle_rules = [
        {
          id      = "move-to-glacier"
          enabled = true
          transition = {
            days          = 7
            storage_class = "GLACIER" # 90% cheaper after 7 days
          }
        },
        {
          id              = "delete-old-backups"
          enabled         = true
          expiration_days = 90 # 3 months retention
        }
      ]
    }
  }

  tags = local.common_tags
}

# ===================================
# CloudFront CDN
# ===================================

module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name = local.project_name
  environment  = local.environment

  # S3 bucket for files (profiles, chat, groups)
  s3_bucket_name                  = "${local.project_name}-${local.environment}-files"
  s3_bucket_regional_domain_name  = "${local.project_name}-${local.environment}-files.s3.${var.aws_region}.amazonaws.com"
  s3_bucket_arn                   = "arn:aws:s3:::${local.project_name}-${local.environment}-files"

  # Price class: PriceClass_200 (Asia, NA, EU - excludes South America, Australia)
  price_class = "PriceClass_200"

  # Cache TTL
  default_cache_ttl = 3600  # 1 hour
  max_cache_ttl     = 86400 # 1 day

  # Geo restriction: Korea only for startup phase
  geo_restriction_type     = "whitelist"
  geo_restriction_locations = ["KR"]

  # No custom domain for now (use CloudFront default domain)
  custom_domain       = null
  acm_certificate_arn = null

  depends_on = [module.s3]
}

# ===================================
# API Gateway
# ===================================

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name       = local.project_name
  environment        = local.environment
  aws_region         = var.aws_region
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids

  # ALB integration
  alb_listener_arn      = aws_lb_listener.http.arn
  alb_security_group_id = aws_security_group.alb.id

  # CORS for mobile app only (no web/admin)
  cors_allow_origins = [
    "*" # Mobile app + future web if needed
  ]

  # Phase 1: Moderate limits, increase when traffic grows
  throttling_burst_limit = 2000 # Handle sudden spikes
  throttling_rate_limit  = 1000 # 1k requests/second = 2.6M requests/month

  websocket_throttling_burst_limit = 500
  websocket_throttling_rate_limit  = 250

  # Logging
  log_retention_days = 7 # Increase to 30 when needed

  # Phase 1: Enable Cognito for production security
  enable_cognito_auth             = true
  cognito_user_pool_id            = module.cognito.user_pool_id
  cognito_user_pool_client_ids    = module.cognito.user_pool_client_ids

  # Phase 1: Use default API Gateway domains (no ACM certificate needed)
  # Add custom domains when ready: api.glimpse.io, ws.glimpse.io
  custom_domain_name           = null
  websocket_custom_domain_name = null

  tags = local.common_tags

  depends_on = [module.networking, module.ecs, module.cognito, aws_lb.main]
}

# ===================================
# CloudFront Distributions (Phase 2)
# ===================================

# Commented out initially to save costs (~$30/month)
# Enable when traffic justifies CDN costs
# module "cloudfront" {
#   source = "../../modules/cloudfront"
#   # ... configuration
# }

# ===================================
# AWS Cognito
# ===================================

module "cognito" {
  source = "../../modules/cognito"

  project_name = local.project_name
  environment  = local.environment

  # User Pool configuration
  user_pool_name = "${local.project_name}-users-${local.environment}"

  # SMS authentication for Korean users
  sms_authentication_message = "Glimpse 인증 코드: {####}"
  sms_verification_message   = "Glimpse 인증 코드는 {####}입니다"

  # Password policy - User-friendly
  password_minimum_length    = 8
  password_require_lowercase = true
  password_require_numbers   = true
  password_require_symbols   = false
  password_require_uppercase = false

  # MFA optional for better UX
  mfa_configuration = "OPTIONAL"

  # Account recovery via phone
  account_recovery_mechanisms = [
    {
      name     = "verified_phone_number"
      priority = 1
    }
  ]

  # OAuth clients - Mobile only
  app_clients = [
    {
      name                   = "mobile-app"
      generate_secret        = false
      refresh_token_validity = 30
      callback_urls          = ["glimpse://oauth/callback"]
      logout_urls            = ["glimpse://oauth/logout"]
    }
  ]

  tags = local.common_tags
}

# ===================================
# Monitoring & Logging
# ===================================

module "monitoring" {
  source = "../../modules/monitoring"

  project_name = local.project_name
  environment  = local.environment

  # CloudWatch Log Groups
  log_groups = [
    "/ecs/${local.project_name}-${local.environment}"
  ]

  # Phase 1: Critical alarms only, add more as needed
  enable_ecs_cpu_alarm    = true  # Alert when CPU > 80%
  enable_ecs_memory_alarm = true  # Alert when Memory > 80%
  enable_rds_cpu_alarm    = true  # Alert when DB CPU > 80%
  enable_alb_5xx_alarm    = true  # Alert on server errors

  # SNS topic for production alerts
  alarm_email_addresses = var.alarm_email_addresses

  tags = local.common_tags

  depends_on = [module.ecs, module.rds]
}

# ===================================
# Outputs
# ===================================

output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "api_gateway_http_url" {
  description = "API Gateway HTTP endpoint"
  value       = module.api_gateway.http_api_invoke_url
}

output "api_gateway_websocket_url" {
  description = "API Gateway WebSocket endpoint"
  value       = module.api_gateway.websocket_invoke_url
}

output "rds_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_ids" {
  description = "Cognito User Pool Client IDs"
  value       = module.cognito.user_pool_client_ids
  sensitive   = true
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (use this for file URLs)"
  value       = module.cloudfront.cloudfront_domain_name
}
