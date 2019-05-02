# Using services

To use services, add `services` as third parameter to your event handler.

E.g., if you want to use services from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const when = {
  'accounting.invoice.issued' (invoices, event, services, mark) {
    // ...
    mark.asDone();
  }
};
```

## Reading other lists

Sometimes you need to read another list, e.g. to decide what to update. For that use the `app` service, access the list, and call the `read` or `readOne` function.

E.g., if you want to read another invoice from the `accounting.invoice.issued` event handler, use the following code:

```javascript
const when = {
  'accounting.invoice.issued' (invoices, event, services, mark) {
    const app = services.get('app');

    app.lists.invoices.readOne({
      where: { id: '664745ac-808a-4c16-8420-f43d9deeee04' }
    }).
      failed(err => {
        // ...
      }).
      finished(otherInvoice => {
        // ...
        mark.asDone();
      });
  }
};
```

## Writing log output

To write JSON-formatted log output use the `logger` service. Internally this service uses [flaschenpost](https://github.com/thenativeweb/flaschenpost). For details on how to use flaschenpost see its [documentation](https://github.com/thenativeweb/flaschenpost).

E.g., to log messages from within the `accounting.invoice.issued` event handler, use the following code:

```javascript
const when = {
  'accounting.invoice.issued' (invoices, event, services, mark) {
    const logger = services.get('logger');

    logger.info('Handling an issued invoice...');

    // ...
    mark.asDone();
  }
};
```
