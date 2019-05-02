# Protecting an application

If you run a wolkenkit application this also includes running multiple infrastructure services, such as databases and message queues. To avoid running these services without password protection, the CLI creates a random key and prints it to the terminal when starting an application.

Sometimes you may want to set the key manually. For that, use the `--shared-key` flag when starting the application:

```shell
$ wolkenkit start --shared-key <secret>
```

:::hint-warning
> **Beware of environment variables**
>
> If you use a shared key with special characters, it might contain the `$` sign. Since this character is used by the command line to access environment variables, unexpected things could happen. To avoid this, enclose the shared key in single quotes.
:::

## Storing the shared key

For security reasons, you can't store the shared key in the application's `package.json` file. Anyway, if you don't want to provide it every single time you start the application, set the environment variable `WOLKENKIT_SHARED_KEY` to the key that you want to use:

```shell
$ export WOLKENKIT_SHARED_KEY=<secret>
```

:::hint-warning
> **Parameters over environment variables**
>
> If you provide the `--shared-key` parameter albeit the `WOLKENKIT_SHARED_KEY` variable is set, the command-line parameter takes higher precedence.
:::
