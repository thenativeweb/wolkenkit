# Allowing client domains

To improve security the API only allows access from well-known domains. This means that you need to configure where to allow access from. Usually, you will want to limit access to a single domain.

For that, open the application's `package.json` file and set the `wolkenkit/environments/default/api/allowAccessFrom` property to the domain name you want to use including the protocol.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to allow access from `http://example.com`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "allowAccessFrom": "https://example.com"
      }
    }      
  }
}
```

## Using multiple protocols

If you want to support `https` and `http`, or multiple subdomains, insteaf of a single domain provide an array of multiple domains.

E.g., to allow access from `https://example.com` and `http://example.com`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "allowAccessFrom": [
          "https://example.com",
          "http://example.com"
        ]
      }
    }
  }
}
```

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

Alternatively, you may use a regular expression that matches multiple domains.

:::hint-warning
> **Escape backslashes**
>
> Since the `package.json` file contains JSON, you need to escape backslashes by typing them twice.
:::

E.g., to allow access from `https://example.com` and `http://example.com` using a regular expression, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "allowAccessFrom": "/^https?:\\/\\/example\\.com$/"
      }
    }
  }
}
```

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

## Allowing access from everywhere

For development purposes, it may be desired to allow access to the API from everywhere. For that, use `*` as domain name:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "allowAccessFrom": "*"
      }
    }
  }
}
```

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::
