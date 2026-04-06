variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone / DNS / Edit permission scoped to flanberg.org"
  type        = string
  sensitive   = true
}
