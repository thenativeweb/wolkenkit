# Using command services

To use services, add `services` as third parameter to your command or middleware function.

E.g., if you want to use services from within the `issue` command, use the following code:

```javascript
const commands = {
  issue (invoice, command, services, mark) {
    // ...
    mark.asDone();
  }
};
```

## Reading other aggregates

Sometimes you need to read another aggregate, e.g. to base your decision upon its state. For that use the `app` service, access the desired context and aggregate, and call the `read` function.

E.g., if you want to read another invoice from the `issue` command, use the following code:

```javascript
const commands = {
  issue (invoice, command, services, mark) {
    const app = services.get('app');

    const otherInvoiceId = // ...

    app.accounting.invoice(otherInvoiceId).read((err, otherInvoice) => {
      // ...
      mark.asDone();
    });
  }
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log message from within the `issue` command, use the following code:

```javascript
const commands = {
  issue (invoice, command, services, mark) {
    const logger = services.get('logger');

    logger.info('Issuing an invoice...');

    // ...
    mark.asDone();
  }
};
```
