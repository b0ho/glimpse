# ===================================
# RDS Aurora PostgreSQL
# 비용 최적화 + 확장 가능 구성
# ===================================

# DB 서브넷 그룹
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = var.database_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-subnet"
    }
  )
}

# 보안 그룹
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds"
  description = "Security group for RDS Aurora"
  vpc_id      = var.vpc_id

  # ECS에서의 접근 허용
  dynamic "ingress" {
    for_each = var.allowed_security_group_ids
    content {
      description     = "PostgreSQL from ECS"
      from_port       = 5432
      to_port         = 5432
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
      Name = "${var.project_name}-${var.environment}-rds"
    }
  )
}

# 파라미터 그룹
resource "aws_rds_cluster_parameter_group" "main" {
  family = "aurora-postgresql15"
  name   = "${var.project_name}-${var.environment}-cluster-params"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # 1초 이상 쿼리 로깅
  }

  parameter {
    name  = "timezone"
    value = "Asia/Seoul"
  }

  tags = var.tags
}

resource "aws_db_parameter_group" "main" {
  family = "aurora-postgresql15"
  name   = "${var.project_name}-${var.environment}-instance-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = var.tags
}

# 마스터 비밀번호 (Secrets Manager)
resource "random_password" "master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "master_password" {
  name                    = "${var.project_name}-${var.environment}-rds-master-password"
  description             = "RDS Aurora master password"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "master_password" {
  secret_id = aws_secretsmanager_secret.master_password.id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master.result
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = var.database_name
  })
}

# Aurora 클러스터
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.environment}"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version
  
  database_name   = var.database_name
  master_username = var.master_username
  master_password = random_password.master.result

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  # 백업 설정
  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window
  
  # 암호화
  storage_encrypted = var.storage_encrypted
  kms_key_id        = var.kms_key_id

  # 스냅샷 설정
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot" : null
  copy_tags_to_snapshot     = true

  # 삭제 보호
  deletion_protection = var.environment == "prod"

  # IAM 인증 활성화
  iam_database_authentication_enabled = true

  # CloudWatch 로그 내보내기
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Serverless v2 설정 (Phase 2+에서 활성화 가능)
  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.enable_serverless_v2 ? [1] : []
    content {
      min_capacity = var.serverless_min_capacity
      max_capacity = var.serverless_max_capacity
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-cluster"
    }
  )

  lifecycle {
    ignore_changes = [master_password]
  }
}

# Aurora 인스턴스
resource "aws_rds_cluster_instance" "main" {
  count = var.instance_count

  identifier         = "${var.project_name}-${var.environment}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.main.id
  
  instance_class = var.enable_serverless_v2 ? "db.serverless" : var.instance_class
  engine         = aws_rds_cluster.main.engine
  engine_version = aws_rds_cluster.main.engine_version

  db_parameter_group_name = aws_db_parameter_group.main.name

  # 성능 모니터링
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? 7 : null

  # 자동 마이너 버전 업그레이드
  auto_minor_version_upgrade = true

  # 퍼블릭 접근 비활성화
  publicly_accessible = false

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-instance-${count.index + 1}"
    }
  )
}

# CloudWatch 알람
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is high"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "freeable_memory_low" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100000000 # 100MB
  alarm_description   = "RDS freeable memory is low"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  count = var.create_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 50 # t4g.micro 기준
  alarm_description   = "RDS database connections are high"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.main.id
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = var.tags
}

