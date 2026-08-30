variable "aws_region" {
  type        = string
  description = "AWS region where all resources are deployed."

  validation {
    condition     = can(regex("^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "aws_region must be a valid AWS region (e.g. eu-west-3, us-east-1)."
  }
}

variable "inbound_domains" {
  type        = list(string)
  description = "Domains for which SES receives inbound email. Each domain requires an MX record pointing to the SES inbound endpoint."

  validation {
    condition     = alltrue([for d in var.inbound_domains : can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", d))])
    error_message = "Each inbound_domains entry must be a valid lowercase domain (e.g. example.com)."
  }
}

variable "forward_from" {
  type        = string
  description = "SES-verified email address used as the From address when the Lambda forwards emails (e.g. noreply@example.com)."

  validation {
    condition     = can(regex("^[^@]+@[^@]+\\.[^@]+$", var.forward_from))
    error_message = "forward_from must be a valid email address."
  }
}

variable "default_tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to all AWS resources via the provider default_tags."
}