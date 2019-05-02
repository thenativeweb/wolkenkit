# Installing the latest CLI

To be able to use the `latest` runtime, you must also use the latest development version of the CLI. Otherwise, the runtime and the CLI may not match. To install the latest development version of the CLI, you must clone the [thenativeweb/wolkenkit](https://github.com/thenativeweb/wolkenkit) repository. The following command creates a new directory called `wolkenkit`, and clones the repository into that directory:

```shell
$ git clone git@github.com:thenativeweb/wolkenkit.git
```

Then switch to the newly created directory and install the CLI's dependencies by running the following commands:

```shell
$ cd wolkenkit
$ npm install
```

You can now run the CLI as follows:

```shell
$ node ./src/bin/wolkenkit.js
```

Finally, you also need to [update your application](../updating-your-application).

## Updating the CLI

To update an already installed development version of the CLI, go to the previously created `wolkenkit` directory and execute the following commands:

```shell
$ git pull
$ npm install
```

:::hint-warning
> **Updates don't always work**
>
> From time to time, issues arise when updating the CLI. If either command fails, delete the `wolkenkit` directory and reinstall the CLI from scratch as described above.
:::
