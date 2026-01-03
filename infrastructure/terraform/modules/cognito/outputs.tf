# ===================================
# Cognito Module Outputs
# ===================================

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Cognito User Pool Endpoint"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_client_ids" {
  description = "Cognito User Pool Client IDs"
  value       = { for k, v in aws_cognito_user_pool_client.clients : k => v.id }
  sensitive   = true
}

output "user_pool_client_secrets" {
  description = "Cognito User Pool Client Secrets"
  value       = { for k, v in aws_cognito_user_pool_client.clients : k => v.client_secret }
  sensitive   = true
}

output "identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = var.enable_identity_pool ? aws_cognito_identity_pool.main[0].id : null
}

output "cognito_sms_role_arn" {
  description = "Cognito SMS IAM Role ARN"
  value       = aws_iam_role.cognito_sms.arn
}

output "authenticated_role_arn" {
  description = "Authenticated User IAM Role ARN"
  value       = var.enable_identity_pool ? aws_iam_role.cognito_authenticated[0].arn : null
}

