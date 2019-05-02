# Defining commands

To define a command add an appropriately named function to the `commands` object of the aggregate the command refers to. This function receives two parameters, the aggregate instance and the command.

Inside of the function, add code that decides whether the command may be run. If you need to reject the command, call the `command.reject` function and provide a reason.

E.g., to issue an invoice, use the following code:

```javascript
const commands = {
  issue (invoice, command) {
    const canInvoiceBeIssued = // ...

    if (!canInvoiceBeIssued) {
      return command.reject('...');
    }

    // ...
  }
};
```

Some commands require asynchronous code. Therefore, you can use the keywords `async` and `await`. To be able do this, define the command using the `async` keyword:

```javascript
const commands = {
  async issue (invoice, command) {
    // ...

    const result = await validateInvoice();

    // ...
  }
};
```

For a detailed list of a command's properties, see the [data structure of commands](../../data-structures/commands/).

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

:::hint-warning
> **File storage for large documents**
>
> Commands represent a user's request to the system. Although they contain data, they should not contain large documents such as PDFs, images or videos. If you want to store such documents, think about using [file storage](../../storing-large-files/accessing-file-storage/).
:::

## Accessing the aggregate state

To decide whether a command may be run you may need to access the aggregate state. For that, use the `state` property of the aggregate.

E.g., to verify whether an invoice was already issued, use the following code (assuming that the aggregate state contains a property `isIssued` set to `true`):

```javascript
if (invoice.state.isIssued) {
  // ...
}
```

To get the aggregate ID, access the property `id` of the aggregate directly, as the ID is not part of the state.

## Publishing events

Typically you need to publish events to let the world know about the outcome of the command. For that, call the `events.publish` function on the aggregate and provide the name and the data of the event.

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

## Verifying whether an aggregate exists

Some commands are intended to initialize new aggregates. Other commands, though, are supposed to change the state of existing aggregates. To ensure that commands are only executed if they are to be executed, you may need to determine whether you are dealing with a new or an existing aggregate. That's what the `exists` function is for. Depending on the state of the aggregate, this function returns either `true` or `false`.

E.g., to verify whether an invoice aggregate already exists, use the following code:

```javascript
if (invoice.exists()) {
  // ...
}
```

:::hint-tip
> **Middlewares simplify things**
>
> Instead of calling the `exists` function manually, you can alternatively use a [middleware](../using-command-middleware/) such as [wolkenkit-command-tools](https://github.com/thenativeweb/wolkenkit-command-tools).
>
> The two functions [`only.ifExists`](../using-command-middleware/#onlyifexists) and [`only.ifNotExists`](../using-command-middleware/#onlyifnotexists) serve the same purpose, but can be integrated more elegantly.
:::
