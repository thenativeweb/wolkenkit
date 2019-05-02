# Using environments

If you need to run your application in multiple environments such as staging and production, you can register different configurations for each environment. For that, open the application's `package.json` file and clone the `wolkenkit/environments/default` section. Then, adjust its settings.

E.g., when in addition to the `default` environment you want to have a `production` environment, too, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "port": 3000,
        "allowAccessFrom": "*"
      }
    },
    "production": {
      "api": {
        "host": {
          "name": "example.com",
          "certificate": "/server/keys/example.com"
        },
        "port": 443,
        "allowAccessFrom": "*"
      }
    }
  }  
}
```
