# Glimpse Startup Production Environment Variables

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-northeast-2"
}

variable "alarm_email_addresses" {
  description = "Email addresses for CloudWatch alarms"
  type        = list(string)
  default     = ["devops@glimpse.io"]
}

variable "jwt_secret_key" {
  description = "JWT secret key for API authentication"
  type        = string
  sensitive   = true
}
