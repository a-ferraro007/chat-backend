resource "aws_security_group" "security" {
  name = "allow-all"

  vpc_id = aws_vpc.ec2_env.id




  ingress {
    ipv6_cidr_blocks = [
      "2a09:8280:1::72:6ef5:0/128",
    ]
    from_port = 9092
    to_port   = 9092
    protocol  = "tcp"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}
