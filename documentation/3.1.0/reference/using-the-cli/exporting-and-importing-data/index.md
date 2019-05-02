# Exporting and importing data

From time to time you may want to export your application's data, e.g. for backup purposes, or to import data into a new application. For these scenarios, the wolkenkit CLI offers the `export` and `import` commands.

## Exporting data

To export data you need to run `wolkenkit export` and provide a directory that you want to export your application's data into. This directory must either be empty or non-existent; if it doesn't exist, it will be created automatically:

```shell
$ wolkenkit export --to <directory>
```

This creates a directory `<directory>/event-store` for the events that have been stored by your application's write model. When the export has finished, you will find one or more files named `events-<number>.json` in this directory (where `number` is a 16-digit number padded with `0`s). Each file contains an array of up to 65536 events.

## Importing data

To import data you need to run `wolkenkit import` and provide a directory that contains the previously exported data you want to import. Please note that the event store of your application must be empty for this to work:

```shell
$ wolkenkit import --from <directory>
```

:::hint-warning
> **Use the right directory**
>
> For the import you have to specify the directory that you specified using the `--to` flag of the export command, *not* the sub-directory `<directory>/event-store` that was created for the events.
:::

Once the import has finished, you need to reload your application by running the following command:

```shell
$ wolkenkit reload
```
