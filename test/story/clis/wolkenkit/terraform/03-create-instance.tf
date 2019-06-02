variable "aws_instance_count" {
}

resource "aws_instance" "wolkenkit_cli_test" {
  ami                         = "ami-1e339e71"
  instance_type               = "t2.micro"
  count                       = "${var.aws_instance_count}"

  key_name                    = "${aws_key_pair.wolkenkit_cli_test.key_name}"

  associate_public_ip_address = true
  subnet_id                   = "${aws_subnet.default.id}"
  vpc_security_group_ids      = [ "${aws_security_group.navigation.id}" ]

  connection {
    type        = "ssh"
    user        = "ubuntu"
    agent       = true
    private_key = "${file("~/.ssh/id_rsa")}"
  }

  provisioner "local-exec" {
    command = "./setup-local.sh ${self.public_ip}"
  }

  provisioner "remote-exec" {
    inline = [ "mkdir -p /tmp/.docker/" ]
  }

  provisioner "file" {
    source      = "./.docker/${self.public_ip}/ca.pem"
    destination = "/tmp/.docker/ca.pem"
  }
  provisioner "file" {
    source      = "./.docker/${self.public_ip}/cert.pem"
    destination = "/tmp/.docker/cert.pem"
  }
  provisioner "file" {
    source      = "./.docker/${self.public_ip}/key.pem"
    destination = "/tmp/.docker/key.pem"
  }

  provisioner "remote-exec" {
    script = "./setup-remote.sh"
  }

  tags {
    Name = "wolkenkit_cli_test_${count.index}"
  }
}
