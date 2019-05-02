# Using authentication

If your wolkenkit application is [using authentication](../../configuring-an-application/enabling-authentication/), you must configure your client application accordingly. For that, provide the `authentication` property with an authentication strategy when [connecting to an application](../connecting-to-an-application).

## Using OpenID Connect

Currently, OpenID Connect is the only supported authentication strategy for web clients. Using this authentication strategy, you can integrate your application with various identity services such as [Auth0](https://auth0.com/).

:::hint-warning
> **Browsers only**
>
> Please note that the OpenID Connect authentication strategy is only available in the browser.
:::

To use OpenID Connect, create an instance of the `wolkenkit.authentication.OpenIdConnect` strategy and provide it using the `authentication` property:

```javascript
wolkenkit.connect({
  host: 'local.wolkenkit.io',
  authentication: new wolkenkit.authentication.OpenIdConnect({
    identityProviderUrl: 'https://...',
    clientId: '...'
  })
}).
  then(app => /* ... */).
  catch(err => /* ... */);
```

:::hint-warning
> **Hash-based routing**
>
> If you are using a hash-based router this will conflict with the OpenID Connect protocol. To avoid this make sure to call `wolkenkit.connect` before starting your router.
:::

### Configuring OpenID Connect

If you need to set the redirect URL dynamically, additionally provide a `redirectUrl` property. Please note that this only works if the given redirect URL is configured at your OpenID Connect identity provider.

Using the `scope` property you can get additional profile information on the user:

```javascript
wolkenkit.connect({
  host: 'local.wolkenkit.io',
  authentication: new wolkenkit.authentication.OpenIdConnect({
    identityProviderUrl: 'https://...',
    clientId: '...',
    scope: 'profile'
  })
}).
  then(app => /* ... */).
  catch(err => /* ... */);
```

:::hint-warning
> **Strict mode**
>
> Some identity providers do not follow the OpenID Connect protocol strictly. In order to still being able to support them you may need to set the `strictMode` property to `false`:
>
> ```javascript
> wolkenkit.connect({
>   host: 'local.wolkenkit.io',
>   authentication: new wolkenkit.authentication.OpenIdConnect({
>     identityProviderUrl: 'https://...',
>     clientId: '...',
>     strictMode: false
>   })
> }).
>   then(app => /* ... */).
>   catch(err => /* ... */);
> ```
:::

## Using Local

The Local authentication strategy is currently the only supported authentication strategy for services written in Node.js. Using this authentication strategy, you can issue your own tokens.

:::hint-warning
> **Node.js only**
>
> Please note that the Local authentication strategy is only available in Node.js and primarily meant for testing purposes.
:::

To use Local, create an instance of the `wolkenkit.authentication.Local` strategy and provide it using the `authentication` property. Additionally you must provide an identity provider name and a certificate as well as a private key in `.pem` format:

```javascript
wolkenkit.connect({
  host: 'local.wolkenkit.io',
  authentication: new wolkenkit.authentication.Local({
    identityProviderName: 'https://...',
    certificate: '...',
    privateKey: '...'
  })
}).
  then(app => /* ... */).
  catch(err => /* ... */);
```

## Managing the authentication lifecycle

No matter which authentication strategy you use, the application provides an `auth` property that allows you to manage the authentication lifecycle.

:::hint-tip
> **Protected by default**
>
> Whenever you try to use a wolkenkit application that requires authentication with an unauthenticated user, the wolkenkit SDK automatically takes care of logging in the user.
:::

To find out whether there is a currently logged in user, call the `app.auth.isLoggedIn` function:

```javascript
if (app.auth.isLoggedIn()) {
  // ...
}
```

To login a user manually, call the `app.auth.login` function. How this works in detail depends on the configured authentication strategy. If you are using OpenID Connect, all you need to do is call the function:

```javascript
app.auth.login();
```

:::hint-warning
> **Redirects ahead**
>
> Depending on the authentication strategy calling the `login` and `logout` functions may result in redirects, so ensure to store your application state appropriately if needed.
:::

If you are using the Local authentication strategy, you need to provide the `sub` claim as parameter:

```javascript
app.auth.login('Jane Doe');
```

Additionally, you may specify custom claims that shall be included in the token:

```javascript
app.auth.login('Jane Doe', {
  'https://.../roles': [ 'administrator' ]
});
```

To logout a user, call the `app.auth.logout` function:

```javascript
app.auth.logout();
```

## Accessing the user profile

To get the user profile call the `app.auth.getProfile` function. The profile is then returned as an object that contains claims about the user. If there is no logged in user, the function returns `undefined`:

```javascript
const profile = app.auth.getProfile();
```

Typically, you will find information such as first name, last name, or email in the profile, but its specific content depends on the authentication strategy and the identity provider being used. If in doubt, have a look at the profile object that is being returned.

### Accessing the low-level token

In rare cases you may need to access the raw low-level [JWT token](https://jwt.io/) that is used by the wolkenkit SDK internally to authenticate the user against the wolkenkit application. To retrieve the token call the `app.auth.getToken` function:

```javascript
const token = app.auth.getToken();
```

:::hint-warning
> **Security considerations**
>
> If you access the token, it is being returned in its raw form, i.e. you need to decode it on your own. This may lead to severe security issues, so only do this if you know exactly what you are doing.
:::
