# ===================================
# Monitoring Module Outputs
# ===================================

output "sns_topic_arn" {
  description = "SNS 토픽 ARN"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "SNS 토픽 이름"
  value       = aws_sns_topic.alerts.name
}

output "dashboard_name" {
  description = "CloudWatch 대시보드 이름"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "CloudWatch 대시보드 ARN"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_group_names" {
  description = "생성된 로그 그룹 이름"
  value       = [for lg in aws_cloudwatch_log_group.logs : lg.name]
}

output "log_group_arns" {
  description = "생성된 로그 그룹 ARN"
  value       = [for lg in aws_cloudwatch_log_group.logs : lg.arn]
}

