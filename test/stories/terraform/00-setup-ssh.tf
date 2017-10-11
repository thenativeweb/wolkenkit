variable "public_key_path" {
  default = "~/.ssh/id_rsa.pub"
}

variable "private_key_path" {
  default = "~/.ssh/id_rsa"
}

resource "aws_key_pair" "wolkenkit_cli_test" {
  public_key = "${file(var.public_key_path)}"
}
