# Naming an application

To name a wolkenkit application, open the application's `package.json` file and set the `wolkenkit/application` property to the name that you want to use.

:::hint-warning
> **Alphanumeric only**
>
> An application name must only consist of alphanumeric characters. Additionally, it is recommended to only use lowercase characters.
:::

E.g., to set the name to `financialservices`, use the following code:

```json
"wolkenkit": {
  "application": "financialservices"
}
```

:::hint-warning
> **Renaming means data loss**
>
> Never change the name of an application once you are storing data persistently, otherwise you will lose data!
:::
