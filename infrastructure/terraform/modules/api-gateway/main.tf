# API Gateway Module for Glimpse
# REST API + WebSocket API with EKS/ALB integration

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ===================================
# REST API Gateway (HTTP API)
# ===================================

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-http-api-${var.environment}"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway for Glimpse ${var.environment}"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    allow_headers = [
      "Content-Type",
      "Authorization",
      "X-Amz-Date",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "X-Amz-User-Agent"
    ]
    expose_headers = ["X-Request-Id", "X-Response-Time"]
    max_age        = 3600
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-http-api-${var.environment}"
    }
  )
}

# API Gateway Stage (with auto-deploy)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }

  tags = var.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# VPC Link to connect API Gateway to ALB in private subnet
resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "${var.project_name}-vpc-link-${var.environment}"
  security_group_ids = [aws_security_group.vpc_link.id]
  subnet_ids         = var.private_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpc-link-${var.environment}"
    }
  )
}

# Security Group for VPC Link
resource "aws_security_group" "vpc_link" {
  name        = "${var.project_name}-vpc-link-sg-${var.environment}"
  description = "Security group for API Gateway VPC Link"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpc-link-sg"
    }
  )
}

# Allow API Gateway to access ALB
resource "aws_security_group_rule" "vpc_link_to_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = var.alb_security_group_id
  source_security_group_id = aws_security_group.vpc_link.id
  description              = "Allow API Gateway VPC Link to ALB"
}

# HTTP Integration to ALB
resource "aws_apigatewayv2_integration" "alb" {
  api_id             = aws_apigatewayv2_api.http.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = var.alb_listener_arn

  connection_type = "VPC_LINK"
  connection_id   = aws_apigatewayv2_vpc_link.main.id

  request_parameters = {
    "overwrite:path" = "$request.path"
  }

  timeout_milliseconds = 29000 # 29 seconds (API Gateway max is 30s)
}

# Default Route (catch-all)
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

# Specific Routes (optional, for better control)
resource "aws_apigatewayv2_route" "api_v1" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /api/v1/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"

  authorization_type = var.enable_cognito_auth ? "JWT" : "NONE"
  authorizer_id      = var.enable_cognito_auth ? aws_apigatewayv2_authorizer.cognito[0].id : null
}

# Cognito Authorizer (optional)
resource "aws_apigatewayv2_authorizer" "cognito" {
  count = var.enable_cognito_auth ? 1 : 0

  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-cognito-authorizer"

  jwt_configuration {
    audience = var.cognito_user_pool_client_ids
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# ===================================
# WebSocket API Gateway
# ===================================

resource "aws_apigatewayv2_api" "websocket" {
  name                       = "${var.project_name}-websocket-api-${var.environment}"
  protocol_type              = "WEBSOCKET"
  description                = "WebSocket API Gateway for Glimpse ${var.environment}"
  route_selection_expression = "$request.body.action"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-websocket-api-${var.environment}"
    }
  )
}

# WebSocket Stage
resource "aws_apigatewayv2_stage" "websocket" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.websocket.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      connectionId     = "$context.connectionId"
      errorMessage     = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.websocket_throttling_burst_limit
    throttling_rate_limit  = var.websocket_throttling_rate_limit
  }

  tags = var.tags
}

# CloudWatch Log Group for WebSocket
resource "aws_cloudwatch_log_group" "websocket" {
  name              = "/aws/apigateway/websocket-${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# WebSocket Integration to ALB
resource "aws_apigatewayv2_integration" "websocket_alb" {
  api_id             = aws_apigatewayv2_api.websocket.id
  integration_type   = "HTTP_PROXY"
  integration_method = "POST"
  integration_uri    = var.alb_listener_arn

  connection_type = "VPC_LINK"
  connection_id   = aws_apigatewayv2_vpc_link.main.id

  timeout_milliseconds = 29000
}

# WebSocket Routes
resource "aws_apigatewayv2_route" "connect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_alb.id}"

  authorization_type = var.enable_cognito_auth ? "JWT" : "NONE"
  authorizer_id      = var.enable_cognito_auth ? aws_apigatewayv2_authorizer.websocket_cognito[0].id : null
}

resource "aws_apigatewayv2_route" "disconnect" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_alb.id}"
}

resource "aws_apigatewayv2_route" "default_ws" {
  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.websocket_alb.id}"
}

# WebSocket Cognito Authorizer
resource "aws_apigatewayv2_authorizer" "websocket_cognito" {
  count = var.enable_cognito_auth ? 1 : 0

  api_id           = aws_apigatewayv2_api.websocket.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-websocket-cognito-authorizer"

  jwt_configuration {
    audience = var.cognito_user_pool_client_ids
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# ===================================
# Custom Domain Names (Optional)
# ===================================

resource "aws_apigatewayv2_domain_name" "http" {
  count = var.custom_domain_name != null ? 1 : 0

  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api_mapping" "http" {
  count = var.custom_domain_name != null ? 1 : 0

  api_id      = aws_apigatewayv2_api.http.id
  domain_name = aws_apigatewayv2_domain_name.http[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_apigatewayv2_domain_name" "websocket" {
  count = var.websocket_custom_domain_name != null ? 1 : 0

  domain_name = var.websocket_custom_domain_name

  domain_name_configuration {
    certificate_arn = var.acm_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

resource "aws_apigatewayv2_api_mapping" "websocket" {
  count = var.websocket_custom_domain_name != null ? 1 : 0

  api_id      = aws_apigatewayv2_api.websocket.id
  domain_name = aws_apigatewayv2_domain_name.websocket[0].id
  stage       = aws_apigatewayv2_stage.websocket.id
}

# ===================================
# WAF Association (Optional)
# ===================================

resource "aws_wafv2_web_acl_association" "http" {
  count = var.waf_web_acl_arn != null ? 1 : 0

  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = var.waf_web_acl_arn
}
