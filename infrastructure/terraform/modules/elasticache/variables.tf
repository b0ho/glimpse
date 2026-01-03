# ===================================
# ElastiCache Module Variables
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

variable "subnet_ids" {
  description = "서브넷 IDs"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "접근 허용할 보안 그룹 IDs"
  type        = list(string)
  default     = []
}

# ===================================
# Redis 설정
# ===================================

variable "engine_version" {
  description = "Redis 엔진 버전"
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "노드 타입"
  type        = string
  default     = "cache.t4g.micro"
}

variable "num_cache_nodes" {
  description = "캐시 노드 수"
  type        = number
  default     = 1
}

variable "parameter_group_family" {
  description = "파라미터 그룹 패밀리"
  type        = string
  default     = "redis7"
}

# ===================================
# 고가용성 설정
# ===================================

variable "automatic_failover_enabled" {
  description = "자동 장애 조치 활성화"
  type        = bool
  default     = false
}

variable "multi_az_enabled" {
  description = "Multi-AZ 활성화"
  type        = bool
  default     = false
}

# ===================================
# 보안 설정
# ===================================

variable "at_rest_encryption_enabled" {
  description = "저장 데이터 암호화"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "전송 데이터 암호화"
  type        = bool
  default     = true
}

# ===================================
# 스냅샷 설정
# ===================================

variable "snapshot_retention_limit" {
  description = "스냅샷 보관 기간 (일)"
  type        = number
  default     = 1
}

variable "snapshot_window" {
  description = "스냅샷 시간대 (UTC)"
  type        = string
  default     = "03:00-05:00"
}

# ===================================
# 유지보수 설정
# ===================================

variable "maintenance_window" {
  description = "유지보수 시간대 (UTC)"
  type        = string
  default     = "mon:05:00-mon:06:00"
}

# ===================================
# 알림 설정
# ===================================

variable "notification_topic_arn" {
  description = "알림 SNS 토픽 ARN"
  type        = string
  default     = null
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

