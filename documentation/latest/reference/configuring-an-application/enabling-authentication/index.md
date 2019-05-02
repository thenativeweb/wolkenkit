# Enabling authentication

Every wolkenkit application supports authentication of users. For that it relies on an external identity provider that issues [JSON web tokens](https://jwt.io/).

## Adding the certificate

To enable authentication, you need the certificate of one of more identity providers you want to use. To store the certificate create a `server/keys` directory. To keep things clear, it is recommended to create a dedicated sub-directory for each identity provider.

Then, copy the certificate into the appropriate directory. Use the `.pem` file format and name the file `certificate.pem`.

E.g., to use an identity provider that is hosted at `identity.example.com`, use the following directory structure:

```
<app>
  server
    flows
    keys
      identity.example.com
        certificate.pem
    readModel
    shared
    writeModel
```

## Configuring an identity provider

To configure an identity provider, open the application's `package.json` file, navigate to `wolkenkit/environment/default/identityProviders`, and set the `issuer` property to the `iss` value of the identity provider's issued tokens, and the `certificate` property to the path to the certificate directory.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to configure an identity provider that uses `identity.example.com` as its `iss` value and whose certificate is stored in the `server/keys/identity.example.com` directory, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "identityProviders": [
        {
          "issuer": "identityprovider.example.com",
          "certificate": "/server/keys/identityprovider.example.com"
        }
      ]
    }    
  }
}
```

If you provide more than one identity provider, your wolkenkit application will accept tokens created by any of them.
