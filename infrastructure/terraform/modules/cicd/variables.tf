# ===================================
# CI/CD Module Variables
# ===================================

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "aws_account_id" {
  description = "AWS 계정 ID"
  type        = string
}

# ===================================
# GitHub 설정
# ===================================

variable "github_repository" {
  description = "GitHub 저장소 (owner/repo 형식)"
  type        = string
}

variable "github_branch" {
  description = "빌드할 브랜치"
  type        = string
  default     = "main"
}

# ===================================
# ECS 설정
# ===================================

variable "ecs_cluster_name" {
  description = "ECS 클러스터 이름"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS 서비스 이름"
  type        = string
}

# ===================================
# Secrets 설정
# ===================================

variable "secrets_arns" {
  description = "CodeBuild에서 접근할 Secrets Manager ARNs"
  type        = list(string)
  default     = []
}

# ===================================
# 알림 설정
# ===================================

variable "notification_sns_topic_arn" {
  description = "파이프라인 알림 SNS 토픽 ARN"
  type        = string
  default     = null
}

# ===================================
# 태그
# ===================================

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}

