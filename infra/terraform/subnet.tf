resource "aws_subnet" "subnet" {
  cidr_block        = cidrsubnet(aws_vpc.ec2_env.cidr_block, 3, 1)
  vpc_id            = aws_vpc.ec2_env.id
  availability_zone = var.availability_zone
}
