# Connecting to an application

To connect to an application, you need to use the wolkenkit SDK. As it is a universal module, it works in the browser as well as in Node.js.

The wolkenkit SDK has been tested against Chrome <%= current.versions.chrome %>+, Firefox <%= current.versions.firefox %>+, Safari <%= current.versions.safari %>+, Microsoft Edge <%= current.versions.edge %>+, Internet Explorer <%= current.versions.ie %>, and Node.js <%= current.versions.node %>+. Other platforms may work as well, they have just not been tested.

## Installing the SDK

To install the wolkenkit SDK, use npm:

```shell
$ npm install wolkenkit-client@<%= current.versions.clientSdkJs %>
```

:::hint-warning
> **Polyfill old browsers**
>
> Please note that for Internet Explorer 11, you additionally need to install the module [@babel/polyfill](https://babeljs.io/docs/en/babel-polyfill) to make things work. For details on how to integrate this polyfill into your application, see its [documentation](https://babeljs.io/docs/en/babel-polyfill#usage-in-node-browserify-webpack).
:::

## Using the SDK

To use the SDK, call the require function to load the `wolkenkit-client` module:

```javascript
const wolkenkit = require('wolkenkit-client');
```

### In the browser

While Node.js supports the `require` function out of the box, you have to use a bundler such as [webpack](https://webpack.js.org/) if you want to use the wolkenkit SDK inside an application that runs in the browser. For a simple example of how to set this up see the [wolkenkit-client-template-spa-vanilla-js](https://github.com/thenativeweb/wolkenkit-client-template-spa-vanilla-js) repository.

## Connecting to an application

To connect to a wolkenkit application call the `wolkenkit.connect` function and provide the hostname of the server you want to connect to. Since this is an asynchronous function, you have to call it using the `await` keyword:

```javascript
const app = await wolkenkit.connect({ host: 'local.wolkenkit.io' });
```

### Setting the port

By default, the port `443` is being used. To change this, provide the `port` property as well:

```javascript
const app = await wolkenkit.connect({ host: 'local.wolkenkit.io', port: 3000 });
```

### Setting the protocol

There are two protocols that the wolkenkit SDK can use to connect to the wolkenkit application:

- `wss` (default in the browser)
- `https` (default on Node.js)

```javascript
const app = await wolkenkit.connect({ host: 'local.wolkenkit.io', protocol: 'wss' });
```

:::hint-warning
> **Browsers are not yet ready for streaming**
>
> While the `wss` protocol makes use of web sockets, the `https` protocol uses streaming HTTP. Unfortunately, not all current browsers support streaming HTTP in a reasonable fashion. Hence, you may safely use `wss` on Node.js, but consider `https` to be experimental in the browser.
:::
