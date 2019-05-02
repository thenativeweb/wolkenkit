# Pinning the runtime

To run your application in a deterministic way, pin the version of the wolkenkit runtime. For that, open the application's `package.json` file and set the `wolkenkit/runtime/version` property to the version that you want to use.

E.g., to pin the runtime to version <%= current.version %>, use the following code:

```json
"wolkenkit": {
  "runtime": {
    "version": "<%= current.version %>"
  }  
}
```

:::hint-warning
> **Be careful with latest**
>
> You can pin your application to the `latest` runtime, e.g. if you want to evaluate new features that have not yet been officially released. If you do so, please note that unexpected things may happen, and be sure to read [using the latest runtime](../../../guides/using-the-latest-runtime/overview/).
:::
