# ===================================
# Static Hosting (S3 + CloudFront)
# Vercel 대체 - Web/Admin 정적 사이트 호스팅
# ===================================

# ===================================
# S3 Bucket (정적 파일 저장)
# ===================================

resource "aws_s3_bucket" "static" {
  bucket = "${var.project_name}-${var.site_name}-${var.environment}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.site_name}-${var.environment}"
      Type = "static-hosting"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ===================================
# CloudFront Origin Access Control
# ===================================

resource "aws_cloudfront_origin_access_control" "static" {
  name                              = "${var.project_name}-${var.site_name}-${var.environment}-oac"
  description                       = "OAC for ${var.site_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy (CloudFront만 접근 허용)
resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.static.arn
          }
        }
      }
    ]
  })
}

# ===================================
# CloudFront Distribution
# ===================================

resource "aws_cloudfront_distribution" "static" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = var.default_root_object
  comment             = "${var.project_name} ${var.site_name} (${var.environment})"
  price_class         = var.price_class
  aliases             = var.custom_domain != null ? [var.custom_domain] : []

  # Origin (S3)
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.static.id
  }

  # Default Cache Behavior
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.static.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Managed Cache Policy: CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # Managed Origin Request Policy: CORS-S3Origin
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"

    # Function associations (SPA 라우팅용)
    dynamic "function_association" {
      for_each = var.enable_spa_routing ? [1] : []
      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.spa_routing[0].arn
      }
    }
  }

  # 정적 자산 캐시 (assets/, static/, _next/)
  dynamic "ordered_cache_behavior" {
    for_each = var.static_paths
    content {
      path_pattern           = ordered_cache_behavior.value
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      target_origin_id       = "S3-${aws_s3_bucket.static.id}"
      viewer_protocol_policy = "redirect-to-https"
      compress               = true

      # 1년 캐시
      min_ttl     = 0
      default_ttl = 31536000
      max_ttl     = 31536000

      forwarded_values {
        query_string = false
        cookies {
          forward = "none"
        }
      }
    }
  }

  # 커스텀 에러 페이지 (SPA용)
  dynamic "custom_error_response" {
    for_each = var.enable_spa_routing ? [403, 404] : []
    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 10
    }
  }

  # 지역 제한
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  # SSL 인증서
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != null ? "TLSv1.2_2021" : null
  }

  # 로깅 (선택적)
  dynamic "logging_config" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket          = var.access_logs_bucket
      include_cookies = false
      prefix          = "${var.site_name}/"
    }
  }

  tags = var.tags

  depends_on = [aws_s3_bucket.static]
}

# ===================================
# CloudFront Function (SPA 라우팅)
# ===================================

resource "aws_cloudfront_function" "spa_routing" {
  count = var.enable_spa_routing ? 1 : 0

  name    = "${var.project_name}-${var.site_name}-${var.environment}-spa-routing"
  runtime = "cloudfront-js-2.0"
  comment = "SPA routing for ${var.site_name}"

  code = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      
      // 파일 확장자가 있으면 그대로 반환
      if (uri.includes('.')) {
        return request;
      }
      
      // API 경로는 그대로
      if (uri.startsWith('/api/')) {
        return request;
      }
      
      // 그 외는 index.html로 라우팅
      request.uri = '/index.html';
      return request;
    }
  EOF

  publish = true
}

# ===================================
# Route 53 DNS Record (선택적)
# ===================================

resource "aws_route53_record" "static" {
  count = var.custom_domain != null && var.route53_zone_id != null ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.custom_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.static.domain_name
    zone_id                = aws_cloudfront_distribution.static.hosted_zone_id
    evaluate_target_health = false
  }
}

# IPv6 Record
resource "aws_route53_record" "static_ipv6" {
  count = var.custom_domain != null && var.route53_zone_id != null ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.custom_domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.static.domain_name
    zone_id                = aws_cloudfront_distribution.static.hosted_zone_id
    evaluate_target_health = false
  }
}

