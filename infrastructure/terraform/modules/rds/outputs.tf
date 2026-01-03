# ===================================
# RDS Module Outputs
# ===================================

output "cluster_id" {
  description = "RDS 클러스터 ID"
  value       = aws_rds_cluster.main.id
}

output "cluster_arn" {
  description = "RDS 클러스터 ARN"
  value       = aws_rds_cluster.main.arn
}

output "cluster_endpoint" {
  description = "RDS 클러스터 엔드포인트 (읽기/쓰기)"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "cluster_reader_endpoint" {
  description = "RDS 클러스터 리더 엔드포인트 (읽기 전용)"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "cluster_port" {
  description = "RDS 클러스터 포트"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "데이터베이스 이름"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "마스터 사용자명"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "master_password_secret_arn" {
  description = "마스터 비밀번호 Secrets Manager ARN"
  value       = aws_secretsmanager_secret.master_password.arn
}

output "master_password_secret_name" {
  description = "마스터 비밀번호 Secrets Manager 이름"
  value       = aws_secretsmanager_secret.master_password.name
}

output "security_group_id" {
  description = "RDS 보안 그룹 ID"
  value       = aws_security_group.rds.id
}

output "instance_identifiers" {
  description = "RDS 인스턴스 식별자들"
  value       = aws_rds_cluster_instance.main[*].identifier
}

output "connection_string" {
  description = "PostgreSQL 연결 문자열"
  value       = "postgresql://${aws_rds_cluster.main.master_username}:PASSWORD@${aws_rds_cluster.main.endpoint}:${aws_rds_cluster.main.port}/${aws_rds_cluster.main.database_name}"
  sensitive   = true
}

