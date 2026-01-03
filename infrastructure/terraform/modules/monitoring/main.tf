# ===================================
# Monitoring & Alerting
# CloudWatch + SNS 기반
# ===================================

# SNS 토픽 (알림용)
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = var.tags
}

# 이메일 구독
resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.alarm_email_addresses)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "logs" {
  for_each = toset(var.log_groups)

  name              = each.value
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# ===================================
# ECS 알람
# ===================================

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  count = var.enable_ecs_cpu_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.ecs_cpu_threshold
  alarm_description   = "ECS CPU utilization exceeds ${var.ecs_cpu_threshold}%"

  dimensions = {
    ClusterName = "${var.project_name}-${var.environment}"
    ServiceName = "${var.project_name}-api-${var.environment}"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  count = var.enable_ecs_memory_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.ecs_memory_threshold
  alarm_description   = "ECS memory utilization exceeds ${var.ecs_memory_threshold}%"

  dimensions = {
    ClusterName = "${var.project_name}-${var.environment}"
    ServiceName = "${var.project_name}-api-${var.environment}"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# ===================================
# RDS 알람
# ===================================

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.enable_rds_cpu_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization exceeds ${var.rds_cpu_threshold}%"

  dimensions = {
    DBClusterIdentifier = "${var.project_name}-${var.environment}"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# ===================================
# ALB 알람
# ===================================

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = var.enable_alb_5xx_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alb_5xx_threshold
  alarm_description   = "ALB 5xx errors exceed ${var.alb_5xx_threshold}"

  dimensions = {
    LoadBalancer = "${var.project_name}-${var.environment}-alb"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_4xx" {
  count = var.enable_alb_4xx_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "HTTPCode_Target_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alb_4xx_threshold
  alarm_description   = "ALB 4xx errors exceed ${var.alb_4xx_threshold}"

  dimensions = {
    LoadBalancer = "${var.project_name}-${var.environment}-alb"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  count = var.enable_alb_latency_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.alb_latency_threshold
  alarm_description   = "ALB p95 latency exceeds ${var.alb_latency_threshold}s"

  dimensions = {
    LoadBalancer = "${var.project_name}-${var.environment}-alb"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = var.tags
}

# ===================================
# API Gateway 알람
# ===================================

resource "aws_cloudwatch_metric_alarm" "api_gw_5xx" {
  count = var.enable_api_gw_5xx_alarm ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-apigw-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = var.api_gw_5xx_threshold
  alarm_description   = "API Gateway 5xx errors exceed ${var.api_gw_5xx_threshold}"

  dimensions = {
    ApiId = var.api_gateway_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = var.tags
}

# ===================================
# CloudWatch Dashboard
# ===================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # ECS 메트릭
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU & Memory"
          region = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", "${var.project_name}-${var.environment}", "ServiceName", "${var.project_name}-api-${var.environment}"],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          period = 300
          stat   = "Average"
        }
      },
      # RDS 메트릭
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "RDS Performance"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", "${var.project_name}-${var.environment}"],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
        }
      },
      # ALB 메트릭
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ALB Requests & Errors"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${var.project_name}-${var.environment}-alb"],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          period = 300
          stat   = "Sum"
        }
      },
      # Redis 메트릭
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Redis Performance"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "EngineCPUUtilization", "CacheClusterId", "${var.project_name}-${var.environment}-001"],
            [".", "DatabaseMemoryUsagePercentage", ".", "."],
            [".", "CurrConnections", ".", "."]
          ]
          period = 300
          stat   = "Average"
        }
      },
      # 응답 시간
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          title  = "API Response Time (p95)"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${var.project_name}-${var.environment}-alb", { stat = "p95" }],
            ["...", { stat = "p50" }],
            ["...", { stat = "Average" }]
          ]
          period = 300
        }
      }
    ]
  })
}

# ===================================
# 로그 메트릭 필터
# ===================================

resource "aws_cloudwatch_log_metric_filter" "error_logs" {
  for_each = toset(var.log_groups)

  name           = "${replace(each.value, "/", "-")}-errors"
  log_group_name = each.value
  pattern        = "?ERROR ?Error ?error ?Exception"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }

  depends_on = [aws_cloudwatch_log_group.logs]
}

resource "aws_cloudwatch_metric_alarm" "error_logs" {
  count = length(var.log_groups) > 0 ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-error-logs"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Sum"
  threshold           = var.error_log_threshold
  alarm_description   = "Application errors exceed ${var.error_log_threshold}"

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  treat_missing_data = "notBreaching"

  tags = var.tags
}

