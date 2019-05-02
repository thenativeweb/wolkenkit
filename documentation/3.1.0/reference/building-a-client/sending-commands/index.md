# Sending commands

To send a command get a reference to the wolkenkit application, get the context and the aggregate, and call the command function.

E.g., to send an `issue` command for an invoice, use the following code:

```javascript
app.accounting.invoice().issue();
```

If the command takes any parameters, provide them using an options object.

E.g., to send an `issue` command for an invoice and set its amount to `1000`, use the following code:

```javascript
app.accounting.invoice().issue({
  amount: 1000
});
```

:::hint-warning
> **File storage for large documents**
>
> Commands represent a user's request to the system. Although they contain data, they should not contain large documents such as PDFs, images or videos. If you want to store such documents, think about using [file storage](../../storing-large-files/accessing-file-storage/).
:::

## Addressing existing aggregates

If a command addresses an existing aggregate, hand over the aggregate id as a parameter to the aggregate function.

E.g., to send an `issue` command for an existing invoice, use the following code:

```javascript
const invoiceId = // ...

app.accounting.invoice(invoiceId).issue({
  // ...
});
```

## Handling errors

If an error happens you will probably want to handle it. For that add the `failed` function and provide a callback that receives the error and the sent command.

E.g., to handle errors that happen when sending the `issue` command, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}).
  failed((err, command) => {
    // ...
  });
```

## Getting notified on delivery

If you want to get notified once a command has been delivered to the wolkenkit application, add the `delivered` function and provide a callback that takes the sent command.

E.g., to get notified once the `issue` command has been delivered, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}).
  delivered(command => {
    // ...
  });
```

## Awaiting events

If you want to wait for an event caused by a command you just sent, use the `await` function and provide the name of the event you are interested in as well as a callback that takes the event and the sent command.

E.g., to wait for the `issued` event after having sent an `issue` command, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}).
  await('issued', (event, command) => {
    // ...
  });
```

### Awaiting multiple events

If there are multiple events that may happen, add the `await` function multiple times, or provide the event names in an array.

:::hint-warning
> **Await only runs once**
>
> If you specify multiple `await` functions or multiple events as an array, only the first event will cause the `await` function to be run.
:::

E.g., to wait for the `issued` or the `noted` event after having sent an `issue` command, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}).
  await([ 'issued', 'noted' ], (event, command) => {
    // ...
  });
```

## Handling timeouts

If you send a command and await an event, you probably want to limit the time to wait. For that, add the `timeout` function and provide a duration and a callback that takes the command. If you don't provide the timeout function, wolkenkit defaults to 120 seconds.

:::hint-tip
> **Timeout always works**
>
> You can use the `timeout` function whether you specify an `await` function or not.
:::

```javascript
app.accounting.invoice().issue({
  // ...
}).
  await('issued', (event, command) => {
    // ...
  }).
  timeout('30s', command => {
    // ...
  });
```

## Using the chaining API

You can chain all the aforementioned functions. Although not technically necessary, it is highly recommended to put the `failed` function first to ensure that you don't forget it.

E.g., to use the chaining API when sending an `issue` command, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}).
  failed((err, command) => {
    // ...
  }).
  delivered(command => {
    // ...
  }).
  await('issued', (event, command) => {
    // ...
  }).
  timeout('30s', command => {
    // ...
  });
```

## Impersonating commands

From time to time you may need to send commands on behalf of another user. For that, besides the command's payload, use an options object to specify the `asUser` property, and provide the `sub` claim of the user's token.

To use impersonation you need to have the `can-impersonate` claim in your own token set to `true`.

E.g., to send an `issue` command on behalf of another user, use the following code:

```javascript
app.accounting.invoice().issue({
  // ...
}, {
  asUser: '42fd502f-4dda-46e3-b90b-6c841fdd2339'
});
```
