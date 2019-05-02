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

## Securing environment variables

In some cases you may not want to store certain environment variables in plain text in `package.json`, e.g. when specifying credentials. For these cases you can create another file called `wolkenkit-secrets.json` next to your `package.json` file where you can store the sensitive data. Do not commit this file into your version control system. This way the sensitive data remain secret.

Basically, `wolkenkit-secrets.json` is a normal JSON file in which you can store arbitrary key-value pairs, which can even be nested:

```json
{
  "password": "secret",
  "roles": {
    "isAdministrator": true
  }
}
```

Inside of the `package.json` file you can then reference the appropriate keys using the `secret://` protocol. Provide the key you want to use as path. For nested keys use the `.` character as separator. Please note that you are allowed to mix normal and secret values at will:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "environmentVariables": {
        "username": "jane.doe@example.com",
        "password": "secret://password",
        "isAdministrator": "secret://roles.isAdministrator"
      }
    }
  }  
}
```

## Accessing environment variables

No matter how you defined the environment variables – to access them inside the application, use the `process.env` object:

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
