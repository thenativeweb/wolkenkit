# Defining projections

To handle an event, add the fully-qualified name of the event to the `projections` object and provide a function to handle the event. Like commands, this function takes two parameters, the list itself and the event.

Inside of the function, add code that updates the list according to the event.

E.g., to handle the `issued` event of an invoice, use the following code:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event) {
    // ...
  }
};
```

Some event handlers require asynchronous code. Therefore, you can use the keywords `async` and `await`. To be able do this, define the handler using the `async` keyword:

```javascript
const projections = {
  async 'accounting.invoice.issued' (invoices, event) {
    // ...
  }
};
```

## Adding items

To add an item to a list, call the list's `add` function and provide the item you want to add. You have access to all of the event's data, including its metadata such as the id of the aggregate the event refers to. If you do not provide an `id` explicitly, wolkenkit will automatically use the id of the aggregate the event refers to.

:::hint-tip
> **JSON only**
>
> You may use any JavaScript data type and value that is supported by JSON. This especially means that you are not allowed to use constructor functions here. Rely on object and array literals instead.
:::

E.g., to add an invoice to the list of invoices once an `issued` event is received, use the following code:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event) {
    invoices.add({
      amount: event.data.amount,
      participant: event.data.participant
    });
  }
};
```

## Updating items

To update an item, call the list's `update` function and provide a `where` clause as well as an update expression. Use the `where` clause to specify which items to update, and the update expression to specify how these items will be updated.

E.g., to update an invoice once a `sentAsLetterPost` event is received, use the following code:

```javascript
const projections = {
  'accounting.invoice.sentAsLetterPost' (invoices, event) {
    invoices.update({
      where: { id: event.aggregate.id },
      set: {
        sentAsLetterPost: true
      }
    });
  }
};
```

## Adding or updating items

From time to time it may be necessary to add or update an item, depending on whether it already exists or not. For these cases you may use the `orUpdate` extension of the `add` function, which acts as a combination of `add` and `update`:

```javascript
const projections = {
  'accounting.invoice.sentAsLetterPost' (invoices, event) {
    invoices.add({
      amount: event.data.amount,
      participant: event.data.participant,
      sentAsLetterPost: true
    }).orUpdate({
      where: { id: event.aggregate.id },
      set: {
        sentAsLetterPost: true
      }
    });
  }
};
```

First, this tries to `add` the given item. If adding the item was successful, everything is fine. If adding the item failed, the `orUpdate` part is run. This allows you to ensure that an item you want to update exists beforehand.

## Ensuring that items exist

Sometimes you may want to add an item if it does not exist yet, or do nothing otherwise. For these cases you may use the `orDiscard` extension of the `add` function, which acts as a combination of `add` and do nothing:

```javascript
const projections = {
  'accounting.invoice.sentAsLetterPost' (invoices, event) {
    invoices.add({
      amount: event.data.amount,
      participant: event.data.participant,
      sentAsLetterPost: true
    }).orDiscard();
  }
};
```

This first tries to `add` the item. If it worked, everything is fine. If the item had already existed, no error will be thrown, and nothing will happen.

## Removing items

Finally, to remove an item, call the list's `remove` function and provide a `where` clause to describe one or more items to be removed.

E.g., to remove an invoice from the list of invoices once a `paid` event is received, use the following code:

```javascript
const projections = {
  'accounting.invoice.paid' (invoices, event) {
    invoices.remove({
      where: { id: event.aggregate.id }
    });
  }
};
```
