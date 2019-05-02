# Using command services

To use services, add `services` as third parameter to your command or middleware function.

E.g., if you want to use services from within the `issue` command, use the following code:

```javascript
const commands = {
  issue (invoice, command, services) {
    // ...
  }
};
```

Since you do not usually need all services at the same time, it will make sense to request only the services you need. To do this, use destructuring to specify the services you need, e.g.:

```javascript
const commands = {
  issue (invoice, command, { app }) {
    // ...
  }
};
```

## Reading other aggregates

Sometimes you need to read another aggregate, e.g. to base your decision upon its state. For that use the `app` service, access the desired context and aggregate, and call the `read` function.

E.g., if you want to read another invoice from the `issue` command, use the following code:

```javascript
const commands = {
  async issue (invoice, command, { app }) {
    const otherInvoice = await app.accounting.invoice(otherInvoiceId).read();

    // ...
  }
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log message from within the `issue` command, use the following code:

```javascript
const commands = {
  issue (invoice, command, { logger }) {
    logger.info('Issuing an invoice...');

    // ...
  }
};
```
