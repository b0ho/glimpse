output "http_api_id" {
  description = "HTTP API Gateway ID"
  value       = aws_apigatewayv2_api.http.id
}

output "http_api_endpoint" {
  description = "HTTP API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "http_api_invoke_url" {
  description = "HTTP API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "websocket_api_id" {
  description = "WebSocket API Gateway ID"
  value       = aws_apigatewayv2_api.websocket.id
}

output "websocket_api_endpoint" {
  description = "WebSocket API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.websocket.api_endpoint
}

output "websocket_invoke_url" {
  description = "WebSocket API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.websocket.invoke_url
}

output "vpc_link_id" {
  description = "VPC Link ID"
  value       = aws_apigatewayv2_vpc_link.main.id
}

output "custom_domain_name" {
  description = "Custom domain name for HTTP API"
  value       = var.custom_domain_name != null ? aws_apigatewayv2_domain_name.http[0].domain_name : null
}

output "websocket_custom_domain_name" {
  description = "Custom domain name for WebSocket API"
  value       = var.websocket_custom_domain_name != null ? aws_apigatewayv2_domain_name.websocket[0].domain_name : null
}
