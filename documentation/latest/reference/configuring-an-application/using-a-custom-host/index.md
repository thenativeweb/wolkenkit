# Using a custom host

If you want to use a custom host for the API, you also have to provide a custom certificate that matches the related host name. To enable that, you have to configure the host name and the certificate in the application's `package.json` file, and you also have to copy the certificate and its private key to your application.

## Copying the certificate and the private key

First, create a `server/keys` directory. To keep things clear, create a dedicated sub-directory for each domain. Then, copy the certificate and the private key into this directory. Use the `.pem` file format and name the files `certificate.pem` and `privateKey.pem` respectively.

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

## Registering the host name and the certificate

Next, open the application's `package.json` file, navigate to `wolkenkit/environments/default/api/host` and set the `name` and the `certificate` properties to the name of the host and to the path of the directory that contains the private key and the certificate itself. Use an absolute path and consider the application directory as root.

:::hint-warning
> **Choose the right environment**
>
> If you use an environment different than `default`, make sure that you use the name of the appropriate environment.
:::

E.g., to use the host `example.com` with a matching certificate in the directory `server/keys/example.com`, use the following code:

```json
"wolkenkit": {
  "environments": {
    "default": {
      "api": {
        "host": {
          "name": "example.com",
          "certificate": "/server/keys/example.com"
        }
      }
    }    
  }
}
```
