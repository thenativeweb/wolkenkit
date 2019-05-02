# Storing data permanently

If you do not explicitly [set a shared key](../protecting-an-application/), any data that have been created by your application will be destroyed once you run `wolkenkit stop`. This is great for development, but not for production. In production, you will want to store data permanently.

To enable permanent data storage, [set a shared key](../protecting-an-application/) when running `wolkenkit start`. Now all of your application's data will be permanently stored and hence survive a restart of your application:

```shell
$ wolkenkit start --shared-key <secret>
```

## Restarting an application

When you restart an application the CLI takes care of preserving the shared key between restarts. Hence you can simply run:

```shell
$ wolkenkit restart
```

This is *not* true when stopping and then starting your application. In this case you explicitly need to provide the very same shared key again, otherwise you won't be able to access your previously stored data:

```shell
$ wolkenkit stop
$ wolkenkit start --shared-key <secret>
```

## Destroying stored data

In case you need to destroy your stored data, provide the `--dangerously-destroy-data` flag to the `start`, `stop`, or `restart` command:

```shell
$ wolkenkit stop --dangerously-destroy-data
```
