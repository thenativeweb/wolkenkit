# Defining commands

To define a command add an appropriately named function to the `commands` object of the aggregate the command refers to. This function receives three parameters: the aggregate instance, the command, and a `mark` object.

Inside of the function, add code that decides whether the command may be run. If so, call the `mark.asDone` function. If not, call the `mark.asRejected` function and provide a reason.

E.g., to issue an invoice, use the following code:

```javascript
const commands = {
  issue (invoice, command, mark) {
    const canInvoiceBeIssued = // ...

    if (!canInvoiceBeIssued) {
      return mark.asRejected('...');
    }

    mark.asDone();
  }
};
```

For a detailled list of a command's properties, see the [data structure of commands](../../data-structures/commands/).

:::hint-warning
> **Reserved command names**
>
> Do not name a command `transferOwnership` or `authorize`, since these are reserved names.
:::

## Accessing the command data

To decide whether a command may be run you may need to access the command data. For that, use the `command.data` property.

E.g., to verify whether the amount that is given in the `issue` command is positive, use the following code:

```javascript
if (command.data.amount > 0) {
  // ...
}
```

## Accessing the aggregate state

To decide whether a command may be run you may need to access the aggregate state. For that, use the `state` property of the aggregate.

E.g., to verify whether an invoice was already issued, use the following code (assuming that the aggregate state contains a property `isIssued` set to `true`):

```javascript
if (invoice.state.isIssued) {
  // ...
}
```

## Publishing events

Typically, before calling `mark.asDone`, you need to publish events to let the world know about the outcome of the command. For that, call the `events.publish` function on the aggregate and provide the name and the data of the event.

E.g., to publish an `issued` event for an invoice, use the following code:

```javascript
invoice.events.publish('issued', {
  amount: command.data.amount
});
```

If an event does not have any data, you can omit the second parameter:

```javascript
invoice.events.publish('issued');
```
