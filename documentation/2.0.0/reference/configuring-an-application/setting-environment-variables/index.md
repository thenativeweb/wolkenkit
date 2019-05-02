# Setting environment variables

From time to time, you may want to configure an application at runtime, e.g. to provide credentials depending on the environment. Therefore you can use environment variables. Open the application's `package.json` file and use the `wolkenkit/environments/default/environmentVariables` section.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to set environment variables, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "environmentVariables": {
        "username": "jane.doe@example.com",
        "password": "secret",
        "isAdministrator": true
      }
    }
  }  
}
```

## Accessing environment variables

To access the previously set environment variables inside the application, use the `process.env` object:

```javascript
process.env.WOLKENKIT_USERNAME
// => 'jane.doe@example.com'

process.env.WOLKENKIT_PASSWORD
// => 'secret'

process.env.WOLKENKIT_IS_ADMINISTRATOR
// => true
```

:::hint-warning
> **Watch the names**
>
> Note that the environment variables' names get transformed, as they are capitalized and prefixed with `WOLKENKIT_`. Any camel casing is replaced by the `_` character. This way `isAdministrator` becomes `WOLKENKIT_IS_ADMINISTRATOR`.
:::
