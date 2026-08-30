locals {
  forward_from_domain       = split("@", var.forward_from)[1]
  forward_from_identity_arn = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${local.forward_from_domain}"
}

module "lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "ses-inbound-forwarder"
  handler       = "index.handler"
  runtime       = "nodejs24.x"
  architectures = ["arm64"]
  timeout       = 30

  source_path = [
    {
      path = "${path.module}/lambda"
      commands = [
        "pnpm install --frozen-lockfile",
        "pnpm run build",
        ":zip dist",
      ]
      patterns = ["dist/index.mjs"]
    }
  ]

  environment_variables = {
    EMAIL_BUCKET = aws_s3_bucket.emails.id
    FORWARD_FROM = var.forward_from
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.emails.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendRawEmail"]
        Resource = local.forward_from_identity_arn
      }
    ]
  })

  create_current_version_allowed_triggers = false

  allowed_triggers = {
    ses = {
      principal      = "ses.amazonaws.com"
      source_account = data.aws_caller_identity.current.account_id
    }
  }
}