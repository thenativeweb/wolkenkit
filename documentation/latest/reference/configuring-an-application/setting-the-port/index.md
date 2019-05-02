# Setting the port

A wolkenkit application is bound to a port. To define the port, open the application's `package.json` file, navigate to `wolkenkit/environments/default/api`, and set the `port` property to the value that you want to use.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to set the port to `3000`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "port": 3000
      }
    }
  }
}
```
