# Controlling the lifecycle

To control the lifecycle of an application use the wolkenkit CLI.

## Starting an application

To start an application run the `start` command from within the application directory:

```shell
$ wolkenkit start
```

If you want to change the port the application binds to, provide the `--port` flag and a port number. This flag takes precedence over the value that is registered in the `package.json` file:

```shell
$ wolkenkit start --port 4000
```

Either way, the CLI downloads and installs the required runtime automatically for you, the first time you start an application may take a few minutes. Every subsequent start will be way faster.

## Restarting an application

From time to time you may need to restart an application, e.g. if you have made changes to its code. To do so run the `reload` command. This command takes care of preserving your data, even if you do not [store your data permanently](../storing-data-permanently/):

```shell
$ wolkenkit reload
```

If you want to restart the entire application, including its infrastructure services, run the `restart` command:

```shell
$ wolkenkit restart
```

:::hint-warning
> **Possible loss of data**
>
> Restarting an application leads to data loss, if you haven't enabled to [store your data permanently](../storing-data-permanently/).
:::

## Stopping an application

To stop an application, run the `stop` command:

```shell
$ wolkenkit stop
```

## Verifying the application status

To verify whether an application is set up correctly, run the `health` command:

```shell
$ wolkenkit health
```

To verify whether an application is running, run the `status` command:

```shell
$ wolkenkit status
```
