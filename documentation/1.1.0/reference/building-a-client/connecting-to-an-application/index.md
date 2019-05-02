# Connecting to an application

To connect to an application, you need to use the wolkenkit SDK. As it is a universal module, it works in the browser as well as in Node.js.

The wolkenkit SDK has been tested against Chrome <%= current.versions.chrome %>+, Firefox <%= current.versions.firefox %>+, Safari <%= current.versions.safari %>+, Opera <%= current.versions.opera %>+, Microsoft Edge <%= current.versions.edge %>+, Internet Explorer <%= current.versions.ie %>, and Node.js <%= current.versions.node %>+. Other platforms may work as well, they have just not been tested.

:::hint-warning
> **Polyfill old browsers**
>
> Please note that for Internet Explorer 11, you need to add the polyfill by the [core-js](https://github.com/zloirock/core-js) project to make things work:
>
> ```html
> <script
>   src="https://raw.githack.com/zloirock/core-js/v2.4.1/client/shim.min.js"
>   type="text/javascript">
> </script>
> ```
:::

## Installing the SDK

Depending on how you build your client application there are different ways how to install the wolkenkit SDK.

### Using the script file

If your client application uses classic `<script>` tags, download the [wolkenkit-client.browser.min.js](https://github.com/thenativeweb/wolkenkit-client-js/blob/<%= current.versions.clientSdkJs %>/dist/wolkenkit-client.browser.min.js) file and copy it into the directory of your client application. Then, add a reference to it inside of the client application's `index.html` file:

```html
<script
  src="wolkenkit-client.browser.min.js"
  type="text/javascript">
</script>
```

This provides a global `wolkenkit` variable that allows you to access the SDK.

### Using the npm module

If you are using a module bundler such as webpack, or you are building a client application using Node.js, install the wolkenkit SDK into your client application using npm:

```shell
$ npm install wolkenkit-client@<%= current.versions.clientSdkJs %>
```

Then you can require the `wolkenkit-client` module:

```javascript
const wolkenkit = require('wolkenkit-client');
```

## Connecting to an application

To connect to a wolkenkit application call the `wolkenkit.connect` function and provide the hostname of the server you want to connect to. As a result the function returns a promise:

```javascript
wolkenkit.connect({ host: 'local.wolkenkit.io' }).
  then(app => /* ... */).
  catch(err => /* ... */);
```

### Setting the port

By default, the port `443` is being used. To change this, provide the `port` property as well:

```javascript
wolkenkit.connect({ host: 'local.wolkenkit.io', port: 3000 }).
  then(app => /* ... */).
  catch(err => /* ... */);
```

### Setting the protocol

There are two protocols that the wolkenkit SDK can use to connect to the wolkenkit application:

- `wss` (default in the browser)
- `https` (default on Node.js)

```javascript
wolkenkit.connect({ host: 'local.wolkenkit.io', protocol: 'wss' }).
  then(app => /* ... */).
  catch(err => /* ... */);
```

:::hint-warning
> **Browsers are not yet ready for streaming**
>
> While the `wss` protocol makes use of web sockets, the `https` protocol uses streaming HTTP. Unfortunately, not all current browsers support streaming HTTP in a reasonable fashion. Hence, you may safely use `wss` on Node.js, but consider `https` to be experimental in the browser.
:::
