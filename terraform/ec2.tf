# data "aws_ami" "ubuntu_ami" {
#   most_recent = true

#   filter {
#     name   = "name"
#     values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
#   }

#   filter {
#     name   = "virtualization-type"
#     values = ["hvm"]
#   }

#   owners = ["099720109477"]

# }

data "aws_ami" "amazon_linux_ami" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["137112412989"] # This is the official AWS account ID for Amazon Linux
}


#Ec2 Instance
resource "aws_instance" "test_env_ec2" {
  count                       = var.counter
  ami                         = data.aws_ami.amazon_linux_ami.id
  instance_type               = var.instance_type
  key_name                    = var.key_pair_name
  security_groups             = ["${aws_security_group.security.id}"]
  associate_public_ip_address = true
  subnet_id                   = aws_subnet.subnet.id

  tags = {
    Name = var.instance_tag[count.index]
  }
}
