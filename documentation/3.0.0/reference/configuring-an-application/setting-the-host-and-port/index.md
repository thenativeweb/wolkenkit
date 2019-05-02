# Setting the host and port

A wolkenkit application is bound to a host and a port. To register them, open the application's `package.json` file, navigate to `wolkenkit/environments/default/api/address`, and set the `host` and the `port` properties to the values that you want to use.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to set the host to `local.wolkenkit.io` and the port to `3000`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "address": {
          "host": "local.wolkenkit.io",
          "port": 3000
        }
      }
    }
  }
}
```
