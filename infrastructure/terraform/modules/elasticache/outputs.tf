# ===================================
# ElastiCache Module Outputs
# ===================================

output "replication_group_id" {
  description = "Replication Group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "Replication Group ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "redis_endpoint" {
  description = "Redis Primary 엔드포인트"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "redis_reader_endpoint" {
  description = "Redis Reader 엔드포인트"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis 포트"
  value       = 6379
}

output "security_group_id" {
  description = "Redis 보안 그룹 ID"
  value       = aws_security_group.redis.id
}

output "auth_token_secret_arn" {
  description = "Auth 토큰 Secrets Manager ARN"
  value       = aws_secretsmanager_secret.redis_auth.arn
}

output "auth_token_secret_name" {
  description = "Auth 토큰 Secrets Manager 이름"
  value       = aws_secretsmanager_secret.redis_auth.name
}

output "connection_string" {
  description = "Redis 연결 문자열 (TLS)"
  value       = var.transit_encryption_enabled ? "rediss://:AUTH_TOKEN@${aws_elasticache_replication_group.main.primary_endpoint_address}:6379" : "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
  sensitive   = true
}

