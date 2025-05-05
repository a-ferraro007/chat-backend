resource "aws_internet_gateway" "ec2_env_gw" {
  vpc_id = aws_vpc.ec2_env.id
}
