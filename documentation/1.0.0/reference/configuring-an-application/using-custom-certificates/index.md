# Using custom certificates

If you want to use a custom certificate for the API, create a `server/keys` directory. To keep things clear, create a dedicated sub-directory for each domain.

Then, copy the private key and the certificate into this directory. Use the `.pem` file format and name the files `privateKey.pem` and `certificate.pem` respectively.

E.g., to use a custom certificate for the domain `example.com`, use the following directory structure:

```
<app>
  server
    flows
    keys
      example.com
        certificate.pem
        privateKey.pem
    readModel
    shared
    writeModel
```

## Registering the certificate

To register the certificate, open the application's `package.json` file and set the `wolkenkit/environments/default/api/certificate` property to the directory that contains the private key and the certificate. Use an absolute path and consider the application directory as root.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to use the directory `server/keys/example.com` that contains a custom certificate, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "certificate": "/server/keys/example.com"
      }
    }    
  }
}
```
