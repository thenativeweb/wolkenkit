# Installing the latest runtime

If you had installed the `latest` runtime before, you have to remove it first. This is because `latest` is updated regularly, and the version already installed may not be the same as the current version. To uninstall an existing version, run the following command:

```shell
$ wolkenkit uninstall --version latest
```

After that you can now install the current `latest` runtime. To do so, run the following command:

```shell
$ wolkenkit install --version latest
```

Next, you also need to [install the latest CLI](../installing-the-latest-cli/).

:::hint-warning
> **Updating the latest runtime**
>
> You need to perform these steps each time you want to update your previously installed `latest` runtime to the current one, e.g. if you want to get early access to new features that you need to evaluate.
:::
