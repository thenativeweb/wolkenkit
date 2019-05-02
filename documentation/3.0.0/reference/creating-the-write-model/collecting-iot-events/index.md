# Collecting IoT events

If you are building an IoT application, you need to collect events that happen in the real-world, e.g. sensor data. It may feel difficult to map them to commands, since the events have already happened, and hence do not serve well as tasks.

## Defining physical events

In order to handle physical events you need to [define them](../defining-events/) in the same way as you define other events, too. If you need to, you may also update the aggregate state from the events. This allows you to access the data from previously recorded physical events when handling a command.

E.g., when you want to set the `sentAsLetterPost` property of the aggregate state to `true` once an invoice was sent as letter post, use the following code:

```javascript
const events = {
  sentAsLetterPost (invoice, event) {
    invoice.setState({
      sentAsLetterPost: true
    });
  };
};
```

## Recording physical events

To record physical events register a generic event-recording command such as `recordEvent` and use the `handle.physicalEvents` middleware from the [wolkenkit-command-tools](https://github.com/thenativeweb/wolkenkit-command-tools) module.

E.g., if you want to collect the information that an invoice was sent as letter post, use the following code:

```javascript
const formats = require('formats'),
      { handle, only } = require('wolkenkit-command-tools');

// ...

const commands = {
  recordEvent: [
    only.ifExists(),
    handle.physicalEvents({
      sentAsLetterPost: {
        recipient: formats.string({ minLength: 1 })
      }
    })
  ]
};
```
