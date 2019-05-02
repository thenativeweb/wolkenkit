# Attaching a debugger

If your application behaves in an unexpected way, you may want to analyse it using a debugger. For that, you first need to run your application in debug mode, and then attach a debugger to the appropriate process.

## Running an application in debug mode

To run a wolkenkit application in debug mode provide the `--debug` flag on the `wolkenkit start` command:

```shell
$ wolkenkit start --debug
```

:::hint-tip
> **Stay debugging**
>
> If you run `wolkenkit restart` or `wolkenkit reload` while your application is running in debug mode, your application stays in debug mode.
:::

## Debugging an application

When starting, restarting or reloading an application using debug mode, the CLI provides a debug address for each of the application's processes. To debug an application, open Chrome and point it to the appropriate address.

:::hint-warning
> **Highly experimental**
>
> Debugging applications is currently marked as experimental. Your application may freeze or behave in an unexpected way if you attach a debugger.
:::

## Leaving the debug mode

To leave the debug mode you explicitly have to stop your application, and then start it again without the `--debug` flag:

```shell
$ wolkenkit stop
$ wolkenkit start
```

:::hint-warning
> **Only stop ends debugging**
>
> Running `wolkenkit restart` or `wolkenkit reload` is not sufficient to leave debug mode. To actually leave debug mode you explicitly have to stop the application by running `wolkenkit stop`.
:::
