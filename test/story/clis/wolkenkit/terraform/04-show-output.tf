output "ip" {
  value = [ "${aws_instance.wolkenkit_cli_test.*.public_ip}" ]
}
