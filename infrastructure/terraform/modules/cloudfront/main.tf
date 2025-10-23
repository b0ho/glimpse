# CloudFront Distribution for S3 File Storage
# Provides CDN caching for profile images, chat images, and group thumbnails

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.project_name}-${var.environment}-s3-oac"
  description                       = "OAC for S3 bucket access"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "s3" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}-${var.environment} CDN for file storage"
  price_class         = var.price_class
  default_root_object = ""

  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = "S3-${var.s3_bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = var.default_cache_ttl
    max_ttl                = var.max_cache_ttl
    compress               = true
  }

  # Cache behavior for profile images (high reuse)
  ordered_cache_behavior {
    path_pattern     = "/profiles/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400  # 1 day
    default_ttl            = 604800 # 7 days
    max_ttl                = 2592000 # 30 days
    compress               = true
  }

  # Cache behavior for group thumbnails (very high reuse)
  ordered_cache_behavior {
    path_pattern     = "/groups/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400   # 1 day
    default_ttl            = 1209600 # 14 days
    max_ttl                = 2592000 # 30 days
    compress               = true
  }

  # Cache behavior for chat images (low reuse, shorter TTL)
  ordered_cache_behavior {
    path_pattern     = "/chat/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 3600  # 1 hour
    default_ttl            = 86400 # 1 day
    max_ttl                = 604800 # 7 days
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.custom_domain == null
    acm_certificate_arn           = var.acm_certificate_arn
    ssl_support_method            = var.acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version      = var.acm_certificate_arn != null ? "TLSv1.2_2021" : null
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cdn"
  }
}

# S3 Bucket Policy for CloudFront OAC
data "aws_iam_policy_document" "s3_cloudfront" {
  statement {
    sid = "AllowCloudFrontOAC"
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${var.s3_bucket_arn}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3.arn]
    }
  }
}
