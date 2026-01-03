# ===================================
# CI/CD Module Outputs
# ===================================

output "ecr_repository_url" {
  description = "ECR 리포지토리 URL"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_repository_arn" {
  description = "ECR 리포지토리 ARN"
  value       = aws_ecr_repository.api.arn
}

output "pipeline_name" {
  description = "CodePipeline 이름"
  value       = aws_codepipeline.main.name
}

output "pipeline_arn" {
  description = "CodePipeline ARN"
  value       = aws_codepipeline.main.arn
}

output "codebuild_project_name" {
  description = "CodeBuild 프로젝트 이름"
  value       = aws_codebuild_project.backend.name
}

output "codebuild_project_arn" {
  description = "CodeBuild 프로젝트 ARN"
  value       = aws_codebuild_project.backend.arn
}

output "artifacts_bucket_name" {
  description = "아티팩트 S3 버킷 이름"
  value       = aws_s3_bucket.artifacts.bucket
}

output "github_connection_arn" {
  description = "GitHub CodeStar Connection ARN"
  value       = aws_codestarconnections_connection.github.arn
}

output "github_connection_status" {
  description = "GitHub Connection 상태 (AWS 콘솔에서 승인 필요)"
  value       = aws_codestarconnections_connection.github.connection_status
}

