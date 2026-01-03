# ===================================
# Static Hosting Module Outputs
# ===================================

output "s3_bucket_name" {
  description = "S3 버킷 이름"
  value       = aws_s3_bucket.static.id
}

output "s3_bucket_arn" {
  description = "S3 버킷 ARN"
  value       = aws_s3_bucket.static.arn
}

output "s3_bucket_regional_domain_name" {
  description = "S3 버킷 리전 도메인"
  value       = aws_s3_bucket.static.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront 배포 ID"
  value       = aws_cloudfront_distribution.static.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront 배포 ARN"
  value       = aws_cloudfront_distribution.static.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront 도메인 이름"
  value       = aws_cloudfront_distribution.static.domain_name
}

output "website_url" {
  description = "웹사이트 URL"
  value       = var.custom_domain != null ? "https://${var.custom_domain}" : "https://${aws_cloudfront_distribution.static.domain_name}"
}

# 배포 명령어 출력
output "deploy_commands" {
  description = "배포 명령어"
  value = {
    build_and_sync = "aws s3 sync ./dist s3://${aws_s3_bucket.static.id} --delete"
    invalidate     = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.static.id} --paths '/*'"
  }
}

