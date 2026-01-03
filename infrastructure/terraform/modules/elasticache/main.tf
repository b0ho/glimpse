# ===================================
# ElastiCache Redis
# SMS 인증, Rate Limiting, 세션 캐싱
# ===================================

# 서브넷 그룹
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-subnet"
    }
  )
}

# 보안 그룹
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  # ECS에서의 접근 허용
  dynamic "ingress" {
    for_each = var.allowed_security_group_ids
    content {
      description     = "Redis from ECS"
      from_port       = 6379
      to_port         = 6379
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis"
    }
  )
}

# 파라미터 그룹
resource "aws_elasticache_parameter_group" "main" {
  family = var.parameter_group_family
  name   = "${var.project_name}-${var.environment}-redis-params"

  # 메모리 정책: 만료된 키 우선 삭제
  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  # 알림 활성화
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex" # 키 만료 이벤트
  }

  tags = var.tags
}

# Auth 토큰 (비밀번호)
resource "random_password" "redis_auth" {
  length           = 32
  special          = false # ElastiCache는 특수문자 제한
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${var.project_name}-${var.environment}-redis-auth-token"
  description             = "ElastiCache Redis auth token"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    endpoint   = aws_elasticache_replication_group.main.primary_endpoint_address
    port       = 6379
  })
}

# Replication Group (클러스터)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-${var.environment}"
  description          = "Redis for ${var.project_name} ${var.environment}"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # 고가용성 설정
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  # 암호화
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.transit_encryption_enabled ? random_password.redis_auth.result : null

  # 스냅샷 설정
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window

  # 유지보수 설정
  maintenance_window = var.maintenance_window

  # 자동 마이너 버전 업그레이드
  auto_minor_version_upgrade = true

  # 알림 설정
  notification_topic_arn = var.notification_topic_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis"
    }
  )

  lifecycle {
    ignore_changes = [auth_token]
  }
}

# CloudWatch 알람
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis CPU utilization is high"

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-001"
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis memory usage is high"

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-001"
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "evictions" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Redis evictions are occurring"

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-001"
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "connection_errors" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-connection-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Maximum"
  threshold           = 100 # t4g.micro 기준
  alarm_description   = "Redis connections are high"

  dimensions = {
    CacheClusterId = "${var.project_name}-${var.environment}-001"
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

