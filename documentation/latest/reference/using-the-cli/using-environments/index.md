# Using environments

By default, all commands use the `default` environment that is specified in the  application's `package.json` file. If you have defined more than one environment you may choose which one to use by providing the `--env` flag.

E.g., if you want to start an application using the `production` environment, run the following command:

```shell
$ wolkenkit start --env production
```

## Storing the environment

Alternatively, you may specify the environment variable `WOLKENKIT_ENV`. This way you don't need to specify `--env` whenever you run a command:

```shell
$ export WOLKENKIT_ENV=production
```

:::hint-warning
> **Parameters over environment variables**
>
> If you provide the `--env` parameter albeit the `WOLKENKIT_ENV` variable is set, the command-line parameter takes higher precedence.
:::
