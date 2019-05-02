# Updating an application

To update an application to the current version of wolkenkit follow the steps given below.

## package.json

**Previous version (3.0.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "3.0.0"
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
  "...": "..."
}
```

## Enabling persistence

If you have been using the `--shared-key` flag in the past to enable persistence, you now also need to provide the `--persist flag`. This means that starting your application with enabled persistence now requires the following command:

```shell
$ wolkenkit start --shared-key <shared-key> --persist
```

For details, see [protecting an application](../../../../latest/reference/using-the-cli/protecting-an-application/) and [storing data permanently](../../../../latest/reference/using-the-cli/storing-data-permanently/).
