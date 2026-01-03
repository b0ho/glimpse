# ===================================
# Static Hosting Module Variables
# ===================================

variable "project_name" {
  description = "프로젝트 이름"
  type        = string
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
}

variable "site_name" {
  description = "사이트 이름 (web, admin 등)"
  type        = string
}

# ===================================
# S3 설정
# ===================================

variable "enable_versioning" {
  description = "S3 버전 관리 활성화"
  type        = bool
  default     = false
}

# ===================================
# CloudFront 설정
# ===================================

variable "default_root_object" {
  description = "기본 루트 객체"
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "CloudFront 가격 클래스"
  type        = string
  default     = "PriceClass_200" # Asia, NA, EU
}

variable "enable_spa_routing" {
  description = "SPA 라우팅 활성화"
  type        = bool
  default     = true
}

variable "static_paths" {
  description = "정적 자산 경로 패턴 (장기 캐시)"
  type        = list(string)
  default     = ["assets/*", "static/*", "_next/*", "*.js", "*.css", "*.png", "*.jpg", "*.svg", "*.ico"]
}

# ===================================
# 도메인 설정
# ===================================

variable "custom_domain" {
  description = "커스텀 도메인 (예: www.glimpse.io)"
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ACM SSL 인증서 ARN (us-east-1 리전)"
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Route 53 호스팅 영역 ID"
  type        = string
  default     = null
}

# ===================================
# 지역 제한
# ===================================

variable "geo_restriction_type" {
  description = "지역 제한 타입 (none, whitelist, blacklist)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "제한 지역 목록"
  type        = list(string)
  default     = []
}

# ===================================
# 로깅 설정
# ===================================

variable "enable_access_logs" {
  description = "액세스 로그 활성화"
  type        = bool
  default     = false
}

variable "access_logs_bucket" {
  description = "액세스 로그 S3 버킷"
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

