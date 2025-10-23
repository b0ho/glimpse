# S3 Buckets Module
# Creates multiple S3 buckets with customizable settings

resource "aws_s3_bucket" "buckets" {
  for_each = var.buckets

  bucket = "${var.project_name}-${var.environment}-${each.key}"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-${each.key}"
      Type = each.key
    }
  )
}

# Block public access for all buckets
resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versioning configuration
resource "aws_s3_bucket_versioning" "buckets" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "versioning", false) }

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "buckets" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "cors_rules", null) != null }

  bucket = aws_s3_bucket.buckets[each.key].id

  dynamic "cors_rule" {
    for_each = each.value.cors_rules

    content {
      allowed_headers = cors_rule.value.allowed_headers
      allowed_methods = cors_rule.value.allowed_methods
      allowed_origins = cors_rule.value.allowed_origins
      expose_headers  = lookup(cors_rule.value, "expose_headers", [])
      max_age_seconds = lookup(cors_rule.value, "max_age_seconds", 3600)
    }
  }
}

# Lifecycle rules
resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "lifecycle_rules", null) != null }

  bucket = aws_s3_bucket.buckets[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      # Transition
      dynamic "transition" {
        for_each = lookup(rule.value, "transition", null) != null ? [rule.value.transition] : []

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      # Expiration
      dynamic "expiration" {
        for_each = lookup(rule.value, "expiration_days", null) != null ? [1] : []

        content {
          days = rule.value.expiration_days
        }
      }
    }
  }
}
