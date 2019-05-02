# Configuring authorization

In any decent application you do not want everybody to run any command or receive any event. Hence use authorization to configure what is granted to whom.

When a user creates an aggregate instance, this user becomes the aggregate's owner. By default, only the owner is allowed to run commands and receive events for a given aggregate instance. To grant this to other users as well, configure authorization for commands and events.

For that, add the command to the `initialState.isAuthorized.commands` property, or add the event to the `initialState.isAuthorized.events` property, and set their authorization options.

To grant access to any authenticated user set the `forAuthenticated` flag to `true`, to grant access to anyone set the `forPublic` flag to `true`. Not providing a flag is equivalent to setting it to `false` explicitly.

E.g., to grant running `issue` commands to authenticated users, and grant retrieving `issued` events to anyone, use the following code:

```javascript
const initialState = {
  isAuthorized: {
    commands: {
      issue: { forAuthenticated: true, forPublic: false }
    },
    events: {
      issued: { forAuthenticated: true, forPublic: true }
    }
  }
};
```

## Granting access from a command

Sometimes you need to grant or revoke access to commands and events at runtime. For that, use the `authorize` function of the aggregate instance within a command. This function requires you to provide the commands and events as well as the access rights that you want to change. To grant access set the appropriate value to `true`, to revoke access set it to `false`.

E.g., if you want to grant access to the `issue` command to anyone, and revoke access from the `issued` event for anyone, use the following code:

```javascript
invoice.authorize({
  commands: {
    issue: { forPublic: true }
  },
  events: {
    issued: { forPublic: false }
  }
});
```

## Transferring ownership from a command

To transfer ownership of a aggregate instance, use the `transferOwnership` function of the aggregate instance within a command. This function requires you to provide the id of the new owner using the `to` property.

E.g., to transfer ownership of an invoice to the user with the id `9d0ad83b-865c-4684-b420-41f630118f1b`, use the following code:

```javascript
invoice.transferOwnership({
  to: '9d0ad83b-865c-4684-b420-41f630118f1b'
});
```

:::hint-warning
> **Only known users**
>
> If you provide an id of a non-existent user, the ownership will be transferred anyway. You will not be able to return to the previous state.
:::
