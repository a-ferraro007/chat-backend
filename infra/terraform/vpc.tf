resource "aws_vpc" "ec2_env" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "Websocket_Env_VPC"
  }
}
