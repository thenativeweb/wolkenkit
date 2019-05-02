# Configuring file storage

In order to store large files, the file storage service must be configured. To improve security file storage only allows access from well-known domains. This means that you need to configure where to allow access from. Usually, you will want to limit access to a single domain. Additionally, you may want to configure who is initially allowed to store files. By default, this is allowed to authenticated users.

To configure where to allow access from, open the application's `package.json` file, navigate to `wolkenkit/environments/default/fileStorage/allowAccessFrom` property, and set it to the value you want to use. The property follows the same rules and syntax as when [allowing client domains](../allowing-client-domains/).

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

You will typically want to limit access to a few specific domains. For development purposes, it may be desired to allow access to the API from everywhere. For that, use `*` as domain name:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "fileStorage": {
        "allowAccessFrom": "*"
      }
    }
  }  
}
```

## Configuring who is allowed to add files

To configure who is allowed to store files, open the application's `package.json` file, navigate to `wolkenkit/environments/default/fileStorage/isAuthorized`, and provide an object that represents your desired configuration.

E.g., to allow storing files for everyone, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "fileStorage": {
        "allowAccessFrom": "*",
        "isAuthorized": {
          "commands": {
            "addFile": { "forAuthenticated": true, "forPublic": true }
          }
        }
      }
    }
  }  
}
```

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::
