# ============================================================================
# Terraform Variables Definition
# ============================================================================

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "jwt_secret_key" {
  description = "JWT 시크릿 키"
  type        = string
  sensitive   = true
}

variable "alarm_email_addresses" {
  description = "알림 이메일 주소 목록"
  type        = list(string)
  default     = []
}

