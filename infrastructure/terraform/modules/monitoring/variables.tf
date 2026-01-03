# ===================================
# Monitoring Module Variables
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

# ===================================
# 알림 설정
# ===================================

variable "alarm_email_addresses" {
  description = "알림 이메일 주소"
  type        = list(string)
  default     = []
}

# ===================================
# 로그 설정
# ===================================

variable "log_groups" {
  description = "CloudWatch 로그 그룹"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "로그 보관 기간 (일)"
  type        = number
  default     = 7
}

# ===================================
# ECS 알람 설정
# ===================================

variable "enable_ecs_cpu_alarm" {
  description = "ECS CPU 알람 활성화"
  type        = bool
  default     = true
}

variable "enable_ecs_memory_alarm" {
  description = "ECS 메모리 알람 활성화"
  type        = bool
  default     = true
}

variable "ecs_cpu_threshold" {
  description = "ECS CPU 알람 임계값 (%)"
  type        = number
  default     = 80
}

variable "ecs_memory_threshold" {
  description = "ECS 메모리 알람 임계값 (%)"
  type        = number
  default     = 80
}

# ===================================
# RDS 알람 설정
# ===================================

variable "enable_rds_cpu_alarm" {
  description = "RDS CPU 알람 활성화"
  type        = bool
  default     = true
}

variable "rds_cpu_threshold" {
  description = "RDS CPU 알람 임계값 (%)"
  type        = number
  default     = 80
}

# ===================================
# ALB 알람 설정
# ===================================

variable "enable_alb_5xx_alarm" {
  description = "ALB 5xx 알람 활성화"
  type        = bool
  default     = true
}

variable "enable_alb_4xx_alarm" {
  description = "ALB 4xx 알람 활성화"
  type        = bool
  default     = false
}

variable "enable_alb_latency_alarm" {
  description = "ALB 레이턴시 알람 활성화"
  type        = bool
  default     = false
}

variable "alb_5xx_threshold" {
  description = "ALB 5xx 알람 임계값"
  type        = number
  default     = 10
}

variable "alb_4xx_threshold" {
  description = "ALB 4xx 알람 임계값"
  type        = number
  default     = 100
}

variable "alb_latency_threshold" {
  description = "ALB 레이턴시 알람 임계값 (초)"
  type        = number
  default     = 2
}

# ===================================
# API Gateway 알람 설정
# ===================================

variable "enable_api_gw_5xx_alarm" {
  description = "API Gateway 5xx 알람 활성화"
  type        = bool
  default     = false
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
  default     = ""
}

variable "api_gw_5xx_threshold" {
  description = "API Gateway 5xx 알람 임계값"
  type        = number
  default     = 10
}

# ===================================
# 로그 에러 알람 설정
# ===================================

variable "error_log_threshold" {
  description = "에러 로그 알람 임계값"
  type        = number
  default     = 10
}

# ===================================
# 태그
# ===================================

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}

