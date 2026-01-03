# ===================================
# Cognito Module Variables
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

variable "user_pool_name" {
  description = "Cognito User Pool 이름"
  type        = string
}

# ===================================
# SMS 설정
# ===================================

variable "sms_authentication_message" {
  description = "SMS 인증 메시지 템플릿"
  type        = string
  default     = "Glimpse 인증 코드: {####}"
}

variable "sms_verification_message" {
  description = "SMS 검증 메시지 템플릿"
  type        = string
  default     = "Glimpse 인증 코드는 {####}입니다"
}

# ===================================
# 비밀번호 정책
# ===================================

variable "password_minimum_length" {
  description = "최소 비밀번호 길이"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "소문자 필수 여부"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "숫자 필수 여부"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "특수문자 필수 여부"
  type        = bool
  default     = false
}

variable "password_require_uppercase" {
  description = "대문자 필수 여부"
  type        = bool
  default     = false
}

# ===================================
# MFA 설정
# ===================================

variable "mfa_configuration" {
  description = "MFA 설정 (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OPTIONAL"
}

# ===================================
# 계정 복구
# ===================================

variable "account_recovery_mechanisms" {
  description = "계정 복구 메커니즘"
  type = list(object({
    name     = string
    priority = number
  }))
  default = [
    {
      name     = "verified_phone_number"
      priority = 1
    }
  ]
}

# ===================================
# 앱 클라이언트
# ===================================

variable "app_clients" {
  description = "앱 클라이언트 설정"
  type = list(object({
    name                   = string
    generate_secret        = bool
    refresh_token_validity = number
    callback_urls          = list(string)
    logout_urls            = list(string)
  }))
  default = []
}

# ===================================
# Lambda Triggers
# ===================================

variable "enable_lambda_triggers" {
  description = "Lambda 트리거 활성화 여부"
  type        = bool
  default     = false
}

variable "pre_signup_lambda_zip" {
  description = "Pre Sign-up Lambda ZIP 파일 경로"
  type        = string
  default     = ""
}

variable "post_confirmation_lambda_zip" {
  description = "Post Confirmation Lambda ZIP 파일 경로"
  type        = string
  default     = ""
}

variable "api_endpoint" {
  description = "백엔드 API 엔드포인트"
  type        = string
  default     = ""
}

# ===================================
# Identity Pool
# ===================================

variable "enable_identity_pool" {
  description = "Identity Pool 활성화 여부"
  type        = bool
  default     = false
}

# ===================================
# 태그
# ===================================

variable "tags" {
  description = "리소스 태그"
  type        = map(string)
  default     = {}
}

