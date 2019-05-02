# Setting the Node.js environment

It may be necessary to set the `NODE_ENV` environment variable to make your code work as intended. For that, open the application's `package.json` file and set the `wolkenkit/environments/default/node/environment` property to the value that you want to use.

If you do not specify a value, `development` will be used as default for the `NODE_ENV` environment variable.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to set the `NODE_ENV` environment variable to `production`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "node": {
        "environment": "production"
      }
    }
  }  
}
```
