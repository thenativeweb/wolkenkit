# Using services

To use services, add `services` as second parameter to your event handler.

E.g., if you want to use services from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const reactions = {
  'accounting.invoice.issued' (event, services) {
    // ...
  }
};
```

Since you do not usually need all services at the same time, it will make sense to request only the services you need. To do this, use destructuring to specify the services you need, e.g.:

```javascript
const reactions = {
  'accounting.invoice.issued' (event, { app }) {
    // ...
  }
};
```

## Sending commands

Sometimes you may need to send commands to the application from an event handler. For that use the `app` service, access the context and the aggregate, and call the command function.

:::hint-warning
> **No callbacks here**
>
> In contrast to [sending commands when building a client](../../building-a-client/sending-commands/) you can not use the `failed`, `delivered`, `await`, and `timeout` functions here.
:::

E.g., if you want to send a `check` command from the `accounting.invoice.issued` event handler to the invoice that caused the event, use the following code:

```javascript
const reactions = {
  'accounting.invoice.issued' (event, { app }) {
    app.accounting.invoice(event.aggregate.id).check();
  }
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log messages from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const reactions = {
  'accounting.invoice.issued' (event, { logger }) {
    logger.info('Handling an issued invoice...');

    // ...
  }
};
```
