# Updating an application

To update an application to the current version of wolkenkit follow the steps given below.

## package.json

**Previous version (0.11.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "0.11.0"
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
  "...": "..."
}
```

## Configuring an application

In previous versions you needed to explicitly include the configuration of a wolkenkit application that you want to connect to. This step is not needed any more. Loading the wolkenkit SDK is all you need to do.

If you are using a module bundler such as webpack you may omit the `<script>` tags entirely and instead [rely on npm](../../../reference/building-a-client/connecting-to-an-application/#using-the-npm-module).

For details see [connecting to an application](../../../reference/building-a-client/connecting-to-an-application/#installing-the-sdk).

**Previous version (0.11.0)**

```html
<script
  src="wolkenkit-client-0.19.0.min.js"
  type="text/javascript">
</script>
<script
  src="https://local.wolkenkit.io:3000/v1/configure.js"
  type="text/javascript">
</script>
```

**Current version, using a script file (<%= current.version %>)**

```html
<script
  src="wolkenkit-client.browser.min.js"
  type="text/javascript">
</script>
```

**Current version, using npm (<%= current.version %>)**

```javascript
const wolkenkit = require('wolkenkit-client');
```

## Connecting to an application

Connecting to an application changed from a callback- to a promise-based interface.

For details see [connecting to an application](../../../reference/building-a-client/connecting-to-an-application/#connecting-to-an-application-2).

**Previous version (0.11.0)**

```javascript
wolkenkit.connect('local.wolkenkit.io', { port: 3000 }, (err, app) => {
  // ...
});
```

**Current version (<%= current.version %>)**

```javascript
wolkenkit.connect({ host: 'local.wolkenkit.io', port: 3000 }).
  then(app => /* ... */).
  catch(err => /* ... */);
```

## Authenticating users

Authentication is now done using a generic OpenID Connect strategy that replaces the previous Auth0 specific plugin. This strategy is now part of the wolkenkit SDK directly, so there is no need to load plugins any more.

For details see [using authentication](../../../reference/building-a-client/using-authentication/).

### Configuring authentication

**Previous version (0.11.0)**

```html
<script
  src="wolkenkit-plugin-auth0-0.3.1.min.js"
  type="text/javascript">
</script>
```

```javascript
app.use('auth', wolkenkit.plugins.auth0({
  clientId: '...',
  account: '...'
}));
```

**Current version (<%= current.version %>)**

```javascript
wolkenkit.connect({
  host: 'local.wolkenkit.io',
  authentication: new wolkenkit.authentication.OpenIdConnect({
    identityProviderUrl: 'https://...',
    clientId: '...',
    scope: 'profile',
    strictMode: false
  })
}).
  then(app => /* ... */).
  catch(err => /* ... */);
```

### Managing the authentication lifecycle

**Previous version (0.11.0)**

```javascript
this.theWall.on('auth::authentication-required', () => {
  // ...
});
```

**Current version (<%= current.version %>)**

You do not need to handle unauthenticated requests manually any more. The wolkenkit SDK will take care of authenticating the user itself.
