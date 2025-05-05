resource "aws_security_group" "security" {
  name = "allow-all"

  vpc_id = aws_vpc.ec2_env.id



  ingress {
    cidr_blocks = ["10.0.0.0/16"]
    from_port   = 9092
    to_port     = 9092
    protocol    = "tcp"
  }

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }
}
