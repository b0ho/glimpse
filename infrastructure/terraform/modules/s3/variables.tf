# S3 Module Variables

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "buckets" {
  description = "Map of bucket configurations"
  type = map(object({
    versioning = optional(bool, false)
    cors_rules = optional(list(object({
      allowed_headers = list(string)
      allowed_methods = list(string)
      allowed_origins = list(string)
      expose_headers  = optional(list(string), [])
      max_age_seconds = optional(number, 3600)
    })), [])
    lifecycle_rules = optional(list(object({
      id              = string
      enabled         = bool
      expiration_days = optional(number, null)
      transition = optional(object({
        days          = number
        storage_class = string
      }), null)
    })), [])
  }))
}

variable "tags" {
  description = "Common tags for all buckets"
  type        = map(string)
  default     = {}
}
