locals {
  domain = "flanberg.org"
}

data "cloudflare_zone" "flanberg_org" {
  name = local.domain
}

# GitHub Pages IPv4
resource "cloudflare_record" "root_a" {
  for_each = toset([
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153",
  ])

  zone_id = data.cloudflare_zone.flanberg_org.id
  name    = "@"
  type    = "A"
  content = each.value
  proxied = false
}

# GitHub Pages IPv6
resource "cloudflare_record" "root_aaaa" {
  for_each = toset([
    "2606:50c0:8000::153",
    "2606:50c0:8001::153",
    "2606:50c0:8002::153",
    "2606:50c0:8003::153",
  ])

  zone_id = data.cloudflare_zone.flanberg_org.id
  name    = "@"
  type    = "AAAA"
  content = each.value
  proxied = false
}

# www → apex
resource "cloudflare_record" "www" {
  zone_id = data.cloudflare_zone.flanberg_org.id
  name    = "www"
  type    = "CNAME"
  content = local.domain
  proxied = false
}
