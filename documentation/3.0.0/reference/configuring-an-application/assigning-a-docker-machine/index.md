# Assigning a Docker Machine

To bind an application to a specific Docker Machine, open the application's `package.json` file and set the `wolkenkit/environments/default/docker/machine` property to the name of the Docker Machine that you want to use.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to bind an application to a Docker Machine named `dev`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "docker": {
        "machine": "dev"
      }
    }
  }
}
```

:::hint-warning
> **Only works with docker-machine**
>
> You must have docker-machine installed for this feature to work.
:::
