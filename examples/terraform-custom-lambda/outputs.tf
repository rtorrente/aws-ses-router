output "mx_dns_records" {
  description = "MX records to publish in DNS for each inbound domain to route email to SES."
  value = { for domain in var.inbound_domains : domain => {
    type  = "MX"
    name  = domain
    value = "10 inbound-smtp.${var.aws_region}.amazonaws.com"
  } }
}

output "email_bucket" {
  description = "S3 bucket where inbound emails are stored."
  value       = aws_s3_bucket.emails.id
}

output "lambda_arn" {
  description = "ARN of the forwarder Lambda function."
  value       = module.lambda.lambda_function_arn
}