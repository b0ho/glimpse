# ===================================
# AWS Cognito User Pool
# Clerk 대체 - 전화번호 기반 인증
# ===================================

resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # 사용자명 설정 - 전화번호 기반
  username_attributes      = ["phone_number"]
  auto_verified_attributes = ["phone_number"]

  # 사용자 초대 설정
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # 비밀번호 정책
  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = var.password_require_lowercase
    require_numbers                  = var.password_require_numbers
    require_symbols                  = var.password_require_symbols
    require_uppercase                = var.password_require_uppercase
    temporary_password_validity_days = 7
  }

  # MFA 설정
  mfa_configuration = var.mfa_configuration

  software_token_mfa_configuration {
    enabled = false
  }

  # SMS 설정
  sms_authentication_message = var.sms_authentication_message
  sms_verification_message   = var.sms_verification_message

  sms_configuration {
    external_id    = "${var.project_name}-${var.environment}-sms"
    sns_caller_arn = aws_iam_role.cognito_sms.arn
    sns_region     = var.aws_region
  }

  # 계정 복구 설정
  account_recovery_setting {
    dynamic "recovery_mechanism" {
      for_each = var.account_recovery_mechanisms
      content {
        name     = recovery_mechanism.value.name
        priority = recovery_mechanism.value.priority
      }
    }
  }

  # 사용자 속성 스키마
  schema {
    name                     = "phone_number"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 10
      max_length = 20
    }
  }

  schema {
    name                     = "nickname"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 2
      max_length = 20
    }
  }

  schema {
    name                     = "gender"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 10
    }
  }

  schema {
    name                     = "birthdate"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 10
      max_length = 10
    }
  }

  # 이메일 설정 (선택적)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # 사용자 풀 추가 설정
  user_pool_add_ons {
    advanced_security_mode = "OFF" # Phase 1: 비용 절감, 필요시 ENFORCED로 변경
  }

  # 디바이스 추적
  device_configuration {
    challenge_required_on_new_device      = false
    device_only_remembered_on_user_prompt = true
  }

  # 검증 메시지 템플릿
  verification_message_template {
    default_email_option  = "CONFIRM_WITH_CODE"
    sms_message           = var.sms_verification_message
  }

  tags = merge(
    var.tags,
    {
      Name = var.user_pool_name
    }
  )
}

# ===================================
# Cognito User Pool Domain
# ===================================

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ===================================
# Cognito User Pool Clients
# ===================================

resource "aws_cognito_user_pool_client" "clients" {
  for_each = { for idx, client in var.app_clients : client.name => client }

  name         = each.value.name
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = each.value.generate_secret

  # 토큰 유효 기간
  refresh_token_validity        = each.value.refresh_token_validity
  access_token_validity         = 1  # 1시간
  id_token_validity             = 1  # 1시간

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # 명시적 인증 흐름
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # OAuth 설정 (모바일 앱용)
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["phone", "openid", "profile"]

  callback_urls = each.value.callback_urls
  logout_urls   = each.value.logout_urls

  # 속성 읽기/쓰기 권한
  read_attributes = [
    "phone_number",
    "phone_number_verified",
    "custom:nickname",
    "custom:gender",
    "custom:birthdate"
  ]

  write_attributes = [
    "phone_number",
    "custom:nickname",
    "custom:gender",
    "custom:birthdate"
  ]

  # PKCE 강제 (모바일 보안)
  prevent_user_existence_errors = "ENABLED"

  # 토큰 취소 활성화
  enable_token_revocation = true
}

# ===================================
# IAM Role for Cognito SMS
# ===================================

resource "aws_iam_role" "cognito_sms" {
  name = "${var.project_name}-${var.environment}-cognito-sms-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cognito-idp.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "${var.project_name}-${var.environment}-sms"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cognito_sms" {
  name = "${var.project_name}-${var.environment}-cognito-sms-policy"
  role = aws_iam_role.cognito_sms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# ===================================
# Lambda Triggers (Optional)
# ===================================

# Pre Sign-up Lambda (사용자 가입 전 검증)
resource "aws_lambda_function" "pre_signup" {
  count = var.enable_lambda_triggers ? 1 : 0

  filename         = var.pre_signup_lambda_zip
  function_name    = "${var.project_name}-${var.environment}-cognito-pre-signup"
  role             = aws_iam_role.lambda_cognito[0].arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 10

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = var.tags
}

# Post Confirmation Lambda (가입 완료 후 처리)
resource "aws_lambda_function" "post_confirmation" {
  count = var.enable_lambda_triggers ? 1 : 0

  filename         = var.post_confirmation_lambda_zip
  function_name    = "${var.project_name}-${var.environment}-cognito-post-confirmation"
  role             = aws_iam_role.lambda_cognito[0].arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      API_ENDPOINT = var.api_endpoint
    }
  }

  tags = var.tags
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_cognito" {
  count = var.enable_lambda_triggers ? 1 : 0

  name = "${var.project_name}-${var.environment}-lambda-cognito-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  count = var.enable_lambda_triggers ? 1 : 0

  role       = aws_iam_role.lambda_cognito[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Permissions for Cognito
resource "aws_lambda_permission" "pre_signup" {
  count = var.enable_lambda_triggers ? 1 : 0

  statement_id  = "AllowCognitoPreSignup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup[0].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "post_confirmation" {
  count = var.enable_lambda_triggers ? 1 : 0

  statement_id  = "AllowCognitoPostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation[0].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# ===================================
# Identity Pool (선택적 - AWS 리소스 직접 접근용)
# ===================================

resource "aws_cognito_identity_pool" "main" {
  count = var.enable_identity_pool ? 1 : 0

  identity_pool_name               = "${var.project_name}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.clients["mobile-app"].id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = true
  }

  tags = var.tags
}

# Identity Pool Roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  count = var.enable_identity_pool ? 1 : 0

  identity_pool_id = aws_cognito_identity_pool.main[0].id

  roles = {
    "authenticated" = aws_iam_role.cognito_authenticated[0].arn
  }
}

resource "aws_iam_role" "cognito_authenticated" {
  count = var.enable_identity_pool ? 1 : 0

  name = "${var.project_name}-${var.environment}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main[0].id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# S3 접근 정책 (프로필 이미지 업로드용)
resource "aws_iam_role_policy" "cognito_authenticated_s3" {
  count = var.enable_identity_pool ? 1 : 0

  name = "${var.project_name}-${var.environment}-cognito-s3-access"
  role = aws_iam_role.cognito_authenticated[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-files-${var.environment}/users/$${cognito-identity.amazonaws.com:sub}/*"
        ]
      }
    ]
  })
}

