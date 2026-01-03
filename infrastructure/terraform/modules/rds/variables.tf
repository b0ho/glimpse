# ===================================
# RDS Module Variables
# ===================================

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "database_subnet_ids" {
  description = "데이터베이스 서브넷 IDs"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "접근 허용할 보안 그룹 IDs"
  type        = list(string)
  default     = []
}

# ===================================
# 데이터베이스 설정
# ===================================

variable "database_name" {
  description = "데이터베이스 이름"
  type        = string
  default     = "glimpse"
}

variable "master_username" {
  description = "마스터 사용자명"
  type        = string
  default     = "glimpse_admin"
}

variable "engine_version" {
  description = "Aurora PostgreSQL 엔진 버전"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "인스턴스 클래스"
  type        = string
  default     = "db.t4g.micro"
}

variable "instance_count" {
  description = "인스턴스 수"
  type        = number
  default     = 1
}

# ===================================
# Serverless v2 설정
# ===================================

variable "enable_serverless_v2" {
  description = "Aurora Serverless v2 활성화"
  type        = bool
  default     = false
}

variable "serverless_min_capacity" {
  description = "Serverless v2 최소 ACU"
  type        = number
  default     = 0.5
}

variable "serverless_max_capacity" {
  description = "Serverless v2 최대 ACU"
  type        = number
  default     = 4
}

# ===================================
# 백업 설정
# ===================================

variable "backup_retention_period" {
  description = "백업 보관 기간 (일)"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "백업 시간대 (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "유지보수 시간대 (UTC)"
  type        = string
  default     = "mon:04:00-mon:05:00"
}

# ===================================
# 보안 설정
# ===================================

variable "storage_encrypted" {
  description = "스토리지 암호화"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS 키 ID (null이면 AWS 관리형 키 사용)"
  type        = string
  default     = null
}

# ===================================
# 성능 모니터링
# ===================================

variable "performance_insights_enabled" {
  description = "Performance Insights 활성화"
  type        = bool
  default     = false
}

# ===================================
# CloudWatch 알람
# ===================================

variable "create_cloudwatch_alarms" {
  description = "CloudWatch 알람 생성 여부"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arns" {
  description = "알람 SNS 토픽 ARNs"
  type        = list(string)
  default     = []
}

# ===================================
# 태그
# ===================================

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}

