resource "aws_vpc" "wolkenkit_cli_test" {
  cidr_block           = "172.31.0.0/16"

  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "default" {
  vpc_id = "${aws_vpc.wolkenkit_cli_test.id}"
}

resource "aws_subnet" "default" {
  vpc_id            = "${aws_vpc.wolkenkit_cli_test.id}"
  availability_zone = "eu-central-1a"
  cidr_block        = "${cidrsubnet(aws_vpc.wolkenkit_cli_test.cidr_block, 4, 1)}"
}

resource "aws_route_table" "public_subnet" {
  vpc_id = "${aws_vpc.wolkenkit_cli_test.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.default.id}"
  }
}

resource "aws_route_table_association" "public_subnet" {
  subnet_id      = "${aws_subnet.default.id}"
  route_table_id = "${aws_route_table.public_subnet.id}"
}

resource "aws_security_group" "navigation" {
  vpc_id = "${aws_vpc.wolkenkit_cli_test.id}"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [ "0.0.0.0/0" ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [ "0.0.0.0/0" ]
  }
}
