# Viewing log messages

If you want to debug a wolkenkit application, you may want to have a look at the log messages of its various processes.

## Getting a snapshot

To get the log messages of an application use the `wolkenkit logs` command of the CLI. This will get a snapshot of the log messages:

```shell
$ wolkenkit logs
```

## Getting live updates

If you are not only interested in a snapshot, but want to follow the log messages in real-time, you need to additionally provide the `--follow` flag:

```shell
$ wolkenkit logs --follow
```

## Formatting log messages

Either way, the log messages are nothing but stringified JSON objects, so they can be somewhat hard to read. To format them install [flaschenpost](https://github.com/thenativeweb/flaschenpost) by running the following command:

```shell
$ npm install -g flaschenpost
```

Then you can pipe the log messages through flaschenpost and view them as nicely formatted output:

```shell
$ wolkenkit logs | flaschenpost-normalize | flaschenpost-uncork
```
