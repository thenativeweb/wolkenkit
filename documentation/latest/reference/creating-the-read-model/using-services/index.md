# Using services

To use services, add `services` as third parameter to your event handler.

E.g., if you want to use services from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event, services) {
    // ...
  }
};
```

Since you do not usually need all services at the same time, it will make sense to request only the services you need. To do this, use destructuring to specify the services you need, e.g.:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event, { app }) {
    // ...
  }
};
```

## Reading other lists

Sometimes you need to read another list, e.g. to decide what to update. For that use the `app` service, access the list, and call the `read` or `readOne` function.

E.g., if you want to read another invoice from the `accounting.invoice.issued` event handler, use the following code:

```javascript
const projections = {
  async 'accounting.invoice.issued' (invoices, event, { app }) {
    const otherInvoice = await app.lists.invoices.readOne({
      where: { id: '664745ac-808a-4c16-8420-f43d9deeee04' }
    });

    // ...
  }
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log messages from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event, { logger }) {
    logger.info('Handling an issued invoice...');

    // ...
  }
};
```
