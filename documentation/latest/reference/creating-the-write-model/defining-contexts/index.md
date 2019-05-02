# Defining contexts

To define a context, create a directory with the name of the context within the `server/writeModel` directory:

```shell
$ cd <app>
$ mkdir server/writeModel/<context>
```

:::hint-tip
> **Shared code**
>
> The `server/writeModel` directory must only contain contexts and aggregates. If you want to add a directory or a file that is shared across multiple aggregates, put it into the `server/shared` folder.
:::

E.g., if you want to define a context called `accounting`, use the following directory structure:

```
<app>
  server
    flows
    readModel
    shared
    writeModel
      accounting
```

:::hint-tip
> **Reserved context name**
>
> Do not name a context `lists`, since this is a reserved name.
:::
