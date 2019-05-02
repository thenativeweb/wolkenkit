# Updating an application

To update an application to the current version of wolkenkit follow the steps given below.

## Danger of data loss

wolkenkit 2.0.0 contains a bug that led to ignoring the `--shared-key` flag of the CLI.

:::hint-warning
> **Potential data loss**
>
> If you used the `--shared-key` flag, you need to backup your data before updating your application to wolkenkit <%= current.version %>, otherwise you will lose your application's data! If you did not specify this flag, you are not affected and you can safely ignore this section.
:::

Most important, don't restart your application unless you have exported your data as a backup. wolkenkit 2.0.0 unfortunately ignored the `--shared-key` flag, which means that your data is not [stored permanently](../../../reference/using-the-cli/storing-data-permanently/). Hence, if you restart your application, your data will be lost.

To backup your data, you first have to [update the CLI](../../../getting-started/updating-wolkenkit/updating-the-cli/) to version <%= current.versions.cli %>. If you have installed the CLI globally, run the following command:

```shell
$ npm install -g wolkenkit@<%= current.versions.cli %>
```

If you have installed the CLI into the local context of your application, use the following command:

```shell
$ npm install wolkenkit@<%= current.versions.cli %> --save-dev
```

Next, you need to export your application's data. For that, run the `wolkenkit export` command and provide a directory that you want to export your application's data into. This directory must either be empty or non-existent; if it doesn't exist, it will be created automatically::

```shell
$ wolkenkit export --to <directory>
```

Please note that this only exports the events from the event store. Any files you uploaded to the file storage need to be exported manually.

Stop your application using the `wolkenkit stop` command:

```shell
$ wolkenkit stop
```

Now, update your application's code according to this guide. Once you are ready to start your application again, use the `wolkenkit start` command, and provide the desired shared key:

```shell
$ wolkenkit start --shared-key <shared-key>
```

Make sure that your application is not yet used, as the event store must be empty for re-importing your previously exported data. To import the data, use the `wolkenkit import` command and provide the directory that contains the previously exported data:

```shell
$ wolkenkit import --from <directory>
```

To finalize the import, run the `wolkenkit reload` command on your application:

```shell
$ wolkenkit reload
```

Once your application is up and running again, it can be used as normal. For details on the new `export` and `import` commands, see [exporting and importing data](../../../reference/using-the-cli/exporting-and-importing-data/).

## package.json

**Previous version (2.0.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "2.0.0"
  },
  "environments": {
    "default": {
      "api": {
        "...": "..."
      }
    }
  },
  "...": "..."
}
```

**Current version (<%= current.version %>)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "<%= current.version %>"
  },
  "environments": {
    "default": {
      "api": {
        "...": "..."
      },
      "fileStorage": {
        "allowAccessFrom": "*"
      }
    }
  },
  "...": "..."
}
```

## Client

The client SDK now requires using a polyfill if you are targeting Internet Explorer 11. Therefore, use the [@babel/polyfill](../../../reference/building-a-client/connecting-to-an-application/#installing-the-sdk) module.

## File storage

Up to wolkenkit 2.0.0, you had to access the file storage service manually by sending appropriate HTTP requests. In wolkenkit <%= current.version %> the HTTP API changed. To get an overview, see [using the HTTP API](../../../reference/storing-large-files/accessing-file-storage/#using-the-http-api). There is now also a client SDK for accessing the file storage service in a convenient way, which is described in detail at [using the depot SDK](../../../reference/storing-large-files/accessing-file-storage/#using-the-depot-sdk).

Besides adjusting your code please note that you also have to configure file storage. In its simplest form this is done by adding the following section to your application's `package.json` file:

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

For details on how to use the SDK see [storing large files](../../../reference/storing-large-files/accessing-file-storage/). For further information on configuring the file storage service, see [configuring file storage](../../../reference/configuring-an-application/configuring-file-storage/).
