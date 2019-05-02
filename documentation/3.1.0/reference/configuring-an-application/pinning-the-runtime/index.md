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
