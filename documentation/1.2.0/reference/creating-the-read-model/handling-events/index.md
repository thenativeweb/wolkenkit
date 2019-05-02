# Handling events

To handle an event, add the fully-qualified name of the event to the `when` object and provide a function to handle the event. Like commands, this function takes three parameters: the list itself, the event, and a `mark` object.

Inside of the function, add code that updates the list according to the event. Once you are done, call the `mark.asDone` function.

E.g., to handle the `issued` event of an invoice, use the following code:

```javascript
const when = {
  'accounting.invoice.issued' (invoices, event, mark) {
    // ...
    mark.asDone();
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
const when = {
  'accounting.invoice.issued' (invoices, event, mark) {
    invoices.add({
      amount: event.data.amount,
      participant: event.data.participant
    });
    mark.asDone();
  }
};
```

## Updating items

To update an item, call the list's `update` function and provide a `where` clause as well as an update expression. Use the `where` clause to specify which items to update, and the update expression to specify how these items will be updated.

E.g., to update an invoice once a `sentAsLetterPost` event is received, use the following code:

```javascript
const when = {
  'accounting.invoice.sentAsLetterPost' (invoices, event, mark) {
    invoices.update({
      where: { id: event.aggregate.id },
      set: {
        sentAsLetterPost: true
      }
    });
    mark.asDone();
  }
};
```

## Removing items

Finally, to remove an item, call the list's `remove` function and provide a `where` clause to describe one or more items to be removed.

E.g., to remove an invoice from the list of invoices once a `paid` event is received, use the following code:

```javascript
const when = {
  'accounting.invoice.paid' (invoices, event, mark) {
    invoices.remove({
      where: { id: event.aggregate.id }
    });
    mark.asDone();
  }
};
```
