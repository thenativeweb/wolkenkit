# Starting from scratch

If you need to control every aspect of an application, you may want to start from scratch. Otherwise, you may be fine by simply [using a template](../using-a-template/).

## Creating the directory structure

First, you need to create the basic directory structure. Use a dedicated root directory and create the following sub-directories:

```
<app>
  server
    flows
    readModel
    writeModel
```

Optionally, you may add a `server/shared` directory to store code that is being used across the various directories:

```
<app>
  server
    flows
    readModel
    shared
    writeModel
```

:::hint-tip
> **Additional files**
>
> Additionally, you are free to add arbitrary directories to the root directory itself, e.g. for private files, documentation, or anything else. Everything outside the `server` directory will be ignored by wolkenkit.
:::

## Creating the configuration

Inside of the application's root directory you need to add a `package.json` file that contains the configuration. For more details, see [configuring an application](../../configuring-an-application/naming-an-application/).

As default, use the following template:

```json
{
  "name": "<app>",
  "version": "<version>",
  "wolkenkit": {
    "application": "<app>",
    "runtime": {
      "version": "<%= current.version %>"
    },
    "environments": {
      "default": {
        "api": {
          "address": {
            "host": "local.wolkenkit.io",
            "port": 3000
          },
          "allowAccessFrom": "*"
        },
        "fileStorage": {
          "allowAccessFrom": "*"
        }
      }
    }
  }
}
```

:::hint-warning
> **Alphanumeric only**
>
>  The application name must only contain alphanumeric characters. Additionally, it is recommended to only use lowercase characters.
:::
