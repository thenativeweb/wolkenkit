# Using command middleware

From time to time you may want to extract recurring parts of commands into reusable functions. This can be done using middleware.

While [defining commands](../defining-commands/) introduced commands as functions, commands can actually also be arrays of functions. In this case, the array acts as a chain of responsibility, where each function decides whether to pass the command to the next element of the chain or whether to reject it.

All functions besides the actual command are so-called middleware functions. They receive the same parameters as the actual command. Just like commands, you can optionally mark them with the keyword `async`.

E.g., if you want to add a middleware function to the `issue` command, use the following code:

```javascript
const commands = {
  issue: [
    (invoice, command) => {
      // ...
    },

    (invoice, command) => {
      // ...
    }
  ]
};
```

If you call `command.reject` within a middleware, any further execution of the chain gets cancelled immediately.

## Using setup functions

To reuse middleware it is recommended to wrap it in a setup function. This way you can provide options to the middleware itself.

E.g., if you want to create a middleware for invoices that only passes the command to the next element of the chain if the amount that was sent within the command is above a given threshold, use the following code:

```javascript
const onlyIfAmountIsAbove = function (threshold) {
  return function (invoice, command) {
    if (command.data.amount > threshold) {
      return;
    }

    return command.reject('Amount is too low.');
  };
};
```

To use this middleware call the setup function before the actual command as part of the chain:

```javascript
const commands = {
  issue: [
    onlyIfAmountIsAbove(0),
    (invoice, command) => {
      // ...
    }
  ]
};
```


## Using ready-made middleware

Instead of manually creating middleware for common use-cases, you may also use modules such as [wolkenkit-command-tools](https://github.com/thenativeweb/wolkenkit-command-tools). It features a number of ready-made middlewares, such as `only.ifExists` and `only.ifValidatedBy`.

### only.ifExists

This middleware passes if the aggregate instance exists, otherwise it rejects the command.

E.g., to run the `issue` command only if the invoice already exists, use the following code:

```javascript
const commands = {
  issue: [
    only.ifExists(),
    (invoice, command) => {
      // ...
    }
  ]
};
```

### only.ifNotExists

This middleware passes if the aggregate instance does not exist, otherwise it rejects the command.

E.g., to run the `issue` command only if the invoice does not yet exist, use the following code:

```javascript
const commands = {
  issue: [
    only.ifNotExists(),
    (invoice, command) => {
      // ...
    }
  ]
};
```

### only.ifCommandValidatedBy

This middleware passes if the command data can be validated by the given JSON schema, otherwise it rejects the command. Internally, the `only.ifCommandValidatedBy` function uses [ajv](https://github.com/epoberezkin/ajv) to validate the given JSON schema. For details on the supported keywords see [its documentation](http://epoberezkin.github.io/ajv/#validation-keywords).

E.g., to run the `issue` command only if the command contains an `amount` property of type `number`, use the following code:

```javascript
const commands = {
  issue: [
    only.ifCommandValidatedBy({
      type: 'object',
      properties: {
        amount: { type: 'number' }
      },
      required: [ 'amount' ]
    }),
    (invoice, command) => {
      // ...
    }
  ]
};
```

#### Using a validation function

Alternatively, you may also provide a validation function. This function must return `true` if the validation was successful, otherwise `false`. The validation function is given the command data as parameter.

E.g., to manually verify whether the command contains an `amount` property of type `number`, use the following code:

```javascript
const commands = {
  issue: [
    only.ifCommandValidatedBy(data => {
      if (typeof data.amount !== 'number') {
        return false;
      }
      return true;
    }),
    (invoice, command) => {
      // ...
    }
  ]
};
```

### only.ifStateValidatedBy

This middleware passes if the aggregate's state can be validated by the given JSON schema, otherwise it rejects the command. Internally, the `only.ifStateValidatedBy` function uses [ajv](https://github.com/epoberezkin/ajv) to validate the given JSON schema. For details on the supported keywords see [its documentation](http://epoberezkin.github.io/ajv/#validation-keywords).

E.g., to run the `issue` command only if the aggregate's state contains an `amount` property of type `number`, use the following code:

```javascript
const commands = {
  issue: [
    only.ifStateValidatedBy({
      type: 'object',
      properties: {
        amount: { type: 'number' }
      },
      required: [ 'amount' ]
    }),
    (invoice, command) => {
      // ...
    }
  ]
};
```

#### Using a validation function

Alternatively, you may also provide a validation function. This function must return `true` if the validation was successful, otherwise `false`. The validation function is given the command data as parameter.

E.g., to manually verify whether the aggregate's state contains an `amount` property of type `number`, use the following code:

```javascript
const commands = {
  issue: [
    only.ifStateValidatedBy(data => {
      if (typeof data.amount !== 'number') {
        return false;
      }
      return true;
    }),
    (invoice, command) => {
      // ...
    }
  ]
};
```
