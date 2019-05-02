# Updating an application

To update an application to the current version of wolkenkit follow the steps given below.

## package.json, using local.wolkenkit.io

**Previous version (3.1.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "3.1.0"
  },
  "environments": {
    "default": {
      "api": {
        "address": {
          "host": "local.wolkenkit.io",
          "port": 3000          
        }
      }
    },
  },
  "...": "..."
}
```

**Current version (<%= current.version %>)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "<%= current.version %>"
  },
  "environments": {
    "default": {
      "api": {
        "port": 3000
      }
    }
  },
  "...": "..."
}
```

For details on how to configure the port, see [setting the port](../../../reference/configuring-an-application/setting-the-port).

## package.json, using a custom host

**Previous version (3.1.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "3.1.0"
  },
  "environments": {
    "default": {
      "api": {
        "address": {
          "host": "example.com",
          "port": 3000          
        },
        "certificate": "/server/keys/example.com"
      }
    },
  },
  "...": "..."
}
```

**Current version (<%= current.version %>)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "<%= current.version %>"
  },
  "environments": {
    "default": {
      "api": {
        "host": {
          "name": "example.com",
          "certificate": "/server/keys/example.com"
        },
        "port": 3000
      }
    }
  },
  "...": "..."
}
```

For details on how to configure a custom host, see [using a custom host](../../../reference/configuring-an-application/using-a-custom-host).

## package.json, using an identity provider

**Previous version (3.1.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "3.1.0"
  },
  "environments": {
    "default": {
      "identityProvider": {
        "name": "identityprovider.example.com",
        "certificate": "/server/keys/identityprovider.example.com"
      }
    },
  },
  "...": "..."
}
```

**Current version (<%= current.version %>)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "<%= current.version %>"
  },
  "environments": {
    "default": {
      "identityProviders": [
        {
          "issuer": "identityprovider.example.com",
          "certificate": "/server/keys/identityprovider.example.com"
        }
      ]
    }
  },
  "...": "..."
}
```

For details on how to configure the identity provider, see [enabling authentication](../../../reference/configuring-an-application/enabling-authentication).
