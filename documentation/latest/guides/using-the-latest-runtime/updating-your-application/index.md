# Updating your application

To configure an application to use the `latest` runtime, open the application's `package.json` file and set the `wolkenkit/runtime/version` property to `latest`, similar to what you would do with a stable version.

Theoretically, you can now run the application by calling the CLI as described under [installing the latest CLI](../installing-the-latest-cli/). However, depending on the changes contained in the `latest` runtime, the application may require additional adjustments.

:::hint-warning
> **Use at your own risk**
>
> Please note that the latest runtime is not guaranteed to work reliably at all times. This means that unexpected things may happen that could affect the stability and even the runability of your application. Use at your own risk.
:::
