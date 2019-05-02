# Accessing file storage

wolkenkit contains a service for storing large files. It is designed to allow you to store documents such as PDFs, images and videos so that your commands remain small. This file storage is called *depot*.

To access file storage, you must use different urls depending on whether the access is from the client or from within the wolkenkit application. From the outside you use `https://local.wolkenkit.io:3001` (the exact port depends on your configuration, but it is always `1` higher than the port of the API), from the application you use `http://depot`.

In addition to the ability to store and retrieve files, file storage also provides the ability to authenticate and authorize users. By default, each user is allowed to store files, but you can change who can initially add files by [configuring file storage](../../configuring-an-application/configuring-file-storage/). All further actions can be configured individually by [configuring authorization](../configuring-authorization/) per file.

## Selecting an access mechanism

Basically, there are two different ways to access file storage. For easy access, there is the depot SDK, which is available as a universal module, and therefore works in the browser as well as in Node.js. Alternatively, it is possible to access file storage directly via an HTTP API.

The depot SDK has been tested against Chrome <%= current.versions.chrome %>+ and Node.js <%= current.versions.node %>+. Other platforms may work as well, they have just not been tested.

## Installing the SDK

To install the depot SDK, use npm:

```shell
$ npm install wolkenkit-depot-client@<%= current.versions.depotClientSdkJs %>
```

## Using the depot SDK

To use the SDK, call the require function to load the `wolkenkit-depot-client` module:

```javascript
const DepotClient = require('wolkenkit-depot-client');
```

### In the browser

While Node.js supports the `require` function out of the box, you have to use a bundler such as [webpack](https://webpack.js.org/) if you want to use the depot SDK inside an application that runs in the browser.

## Creating a client

To use file storage, create a new instance of the `DepotClient` class and specify the hostname of the service you want to use:

```javascript
const depotClient = new DepotClient({
  host: 'local.wolkenkit.io'
});
```

### Setting the port

By default, port `443` is used. To change this, set the `port` property to the desired value:

```javascript
const depotClient = new DepotClient({
  host: 'local.wolkenkit.io',
  port: 3001
});
```

### Setting the token

By default, the depot SDK does not use authentication. To authenticate yourself for access as a specific user, specify the JWT token of this user using the `token` property:

```javascript
const depotClient = new DepotClient({
  host: 'local.wolkenkit.io',
  token: '...'
});
```

### Setting the protocol

The depot SDK supports access via `https` and via `http`, whereby `https` is used by default. To change this, set the protocol property to the desired value:

```javascript
const depotClient = new DepotClient({
  host: 'local.wolkenkit.io',
  protocol: 'http'
});
```

:::hint-warning
> **Secure access**
>
> Access via `http` is insecure, so you should always use `https`. The only exception is the internal access from a wolkenkit application, which always takes place via a secure virtual network. Here you have to use `http`, otherwise you will get certificate errors.
:::

## Using the HTTP API

As already mentioned, the depot SDK is nothing but an abstraction layer over a HTTP API. This means that you can also access this API directly if required. The base endpoint for this is `/api/v1`.

To call routes that change data, use `POST` requests. To retrieve data, use `GET` requests. The data to be stored or retrieved is transferred in the request or response body, all metadata is stored in headers. The specific routes and their parameters are described on the respective pages.

To authenticate requests, use the `authorize` header and set the token with the `Bearer` scheme:

```
authorization: Bearer <token>
```
