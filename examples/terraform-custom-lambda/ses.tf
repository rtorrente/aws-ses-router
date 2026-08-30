resource "aws_ses_receipt_rule_set" "inbound" {
  rule_set_name = "ses-inbound"
}

resource "aws_ses_active_receipt_rule_set" "inbound" {
  rule_set_name = aws_ses_receipt_rule_set.inbound.rule_set_name
}

resource "aws_ses_receipt_rule" "store_and_forward" {
  name          = "inbound-store-and-forward"
  rule_set_name = aws_ses_receipt_rule_set.inbound.rule_set_name
  recipients    = var.inbound_domains
  enabled       = true
  scan_enabled  = true

  s3_action {
    bucket_name       = aws_s3_bucket.emails.id
    object_key_prefix = "emails/"
    position          = 1
  }

  lambda_action {
    function_arn    = module.lambda.lambda_function_arn
    invocation_type = "Event"
    position        = 2
  }

  depends_on = [aws_s3_bucket_policy.emails, module.lambda]
}