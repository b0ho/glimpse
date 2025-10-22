variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC Link"
  type        = list(string)
}

variable "alb_listener_arn" {
  description = "ALB Listener ARN for integration"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB Security Group ID"
  type        = string
}

# CORS Configuration
variable "cors_allow_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

# Throttling
variable "throttling_burst_limit" {
  description = "Throttling burst limit for HTTP API"
  type        = number
  default     = 5000
}

variable "throttling_rate_limit" {
  description = "Throttling rate limit for HTTP API (requests per second)"
  type        = number
  default     = 2000
}

variable "websocket_throttling_burst_limit" {
  description = "Throttling burst limit for WebSocket API"
  type        = number
  default     = 1000
}

variable "websocket_throttling_rate_limit" {
  description = "Throttling rate limit for WebSocket API"
  type        = number
  default     = 500
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Cognito Authentication (Optional)
variable "enable_cognito_auth" {
  description = "Enable Cognito JWT authorization"
  type        = bool
  default     = false
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = null
}

variable "cognito_user_pool_client_ids" {
  description = "Cognito User Pool Client IDs"
  type        = list(string)
  default     = []
}

# Custom Domain (Optional)
variable "custom_domain_name" {
  description = "Custom domain name for HTTP API (e.g., api.glimpse.io)"
  type        = string
  default     = null
}

variable "websocket_custom_domain_name" {
  description = "Custom domain name for WebSocket API (e.g., ws.glimpse.io)"
  type        = string
  default     = null
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = null
}

# WAF (Optional)
variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN to associate with API Gateway"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
