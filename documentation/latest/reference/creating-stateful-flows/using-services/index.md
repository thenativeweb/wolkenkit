# Using services

To use services, add `services` as third parameter to your reaction.

E.g., if you want to use services when a flow transitions from the `pristine` state to the `awaiting-payment` state, use the following code:

```javascript
const reactions = {
  pristine: {
    'awaiting-payment' (flow, event, services) {
      // ...
    }
  }  
};
```

Since you do not usually need all services at the same time, it will make sense to request only the services you need. To do this, use destructuring to specify the services you need, e.g.:

```javascript
const reactions = {
  pristine: {
    'awaiting-payment' (flow, event, { app }) {
      // ...
    }
  }  
};
```

## Sending commands

Sometimes you may need to send commands to the application from a reaction. For that use the `app` service, access the context and the aggregate, and call the command function.

:::hint-warning
> **No callbacks here**
>
> In contrast to [sending commands when building a client](../../building-a-client/sending-commands/) you can not use the `failed`, `delivered`, `await`, and `timeout` functions here.
:::

E.g., if you want to send an `awaitPayment` command to the invoice that caused a transition from the `pristine` state to the `awaiting-payment` state, use the following code:

```javascript
const reactions = {
  pristine: {
    'awaiting-payment' (flow, event, { app }) {
      app.accounting.invoice(event.aggregate.id).awaitPayment();
    }
  }  
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log messages when a flow transitions from the `pristine` state to the `awaiting-payment` state, use the following code:

```javascript
const reactions = {
  pristine: {
    'awaiting-payment' (flow, event, { logger }) {
      logger.info('Transitioning from pristine to awaiting payment...');
      // ...
    }
  }  
};
```
