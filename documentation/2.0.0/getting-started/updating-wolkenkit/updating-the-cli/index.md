# Updating the CLI

To update the wolkenkit CLI to the latest version run the following command:

```shell
$ npm install -g wolkenkit
```

:::hint-warning
> **Install the CLI locally**
>
> New versions of the CLI may drop support for previously supported wolkenkit runtime versions. To ensure that you have the right version of the CLI for a specific application, install the CLI into the local context of your application:
>
> ```shell
> $ npm install wolkenkit@<%= current.versions.cli %> --save-dev
> ```
>
> When installed locally, you can start the local version using [npx](https://www.npmjs.com/package/npx). This will always favor the local over the global installation.
:::
