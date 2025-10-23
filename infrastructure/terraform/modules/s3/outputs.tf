# S3 Module Outputs

output "bucket_names" {
  description = "Map of bucket keys to bucket names"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.bucket
  }
}

output "bucket_arns" {
  description = "Map of bucket keys to bucket ARNs"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.arn
  }
}

output "bucket_regional_domain_names" {
  description = "Map of bucket keys to regional domain names"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.bucket_regional_domain_name
  }
}

output "bucket_ids" {
  description = "Map of bucket keys to bucket IDs"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.id
  }
}

# Specific output for files bucket (for CloudFront)
output "files_bucket_name" {
  description = "Files bucket name"
  value       = try(aws_s3_bucket.buckets["files"].bucket, null)
}

output "files_bucket_arn" {
  description = "Files bucket ARN"
  value       = try(aws_s3_bucket.buckets["files"].arn, null)
}

output "files_bucket_regional_domain_name" {
  description = "Files bucket regional domain name"
  value       = try(aws_s3_bucket.buckets["files"].bucket_regional_domain_name, null)
}
