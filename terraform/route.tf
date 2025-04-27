resource "aws_route_table" "route_table_ec2_env" {
  vpc_id = aws_vpc.ec2_env.id


  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ec2_env_gw.id
  }
}

resource "aws_route_table_association" "subnet_association" {
  subnet_id      = aws_subnet.subnet.id
  route_table_id = aws_route_table.route_table_ec2_env.id
}
