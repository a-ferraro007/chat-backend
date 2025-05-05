#-----------------
# General Variables
#-----------------
variable "availability_zone" {
  description = "Availability Zone for the Subnet"
  type        = string
  default     = "us-east-2a"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

#------------------
# Key Pair Variables
#------------------
variable "key_pair_name" {
  description = "Key Pair for ssh access to instance"
  type        = string
  default     = "my-ec2-key-pair"
}

variable "file_name" {
  description = "Name of the key pair file"
  type        = string
  default     = "my-ec2-key.pem"
}

#------------------
# Instance Variables
#------------------
variable "instance_type" {
  description = "Instance Type"
  type        = string
  default     = "t3.small"
}

variable "instance_tag" {
  description = "Tag(s) for Instance(s)"
  type        = list(string)
  default     = ["test-instance", "test-instance-2"]
}

variable "ec2_instance_name" {
  type        = string
  description = "The name to give the instance."
  default     = "test-ec2"
}

variable "counter" {
  description = "Number of instances to launch"
  type        = number
  default     = 2
}

#----------------
# Subnet Variables
#----------------
variable "cidr_block" {
  description = "CIDR Block"
  type        = string
  default     = "10.0.1.0/24"
}
