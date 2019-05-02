# Updating an application

To update an application to the current version of wolkenkit follow the steps given below.

## package.json

**Previous version (1.2.0)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "1.2.0"
  },
  "...": "..."
}
```

**Current version (<%= current.version %>)**

```json
"wolkenkit": {
  "application": "your-app",
  "runtime": {
    "version": "<%= current.version %>"
  },
  "...": "..."
}
```

## Write model, defining commands

**Previous version (1.2.0)**

```javascript
const commands = {
  send (message, command, mark) {
    if (...) {
      return mark.asRejected('Failed to send message.');
    }

    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const commands = {
  async send (message, command) {
    if (...) {
      return command.reject('Failed to send message.');
    }

    // ...
  }
};
```

Please note that you can omit the `async` keyword if you don't use asynchronous code in your command. For details see [defining commands](../../../reference/creating-the-write-model/defining-commands/).

## Write model, using command middleware

**Previous version (1.2.0)**

```javascript
const commands = {
  send: [
    (message, command, mark) => {
      if (...) {
        return mark.asRejected('Failed to validate message.');
      }

      // ...

      mark.asReadyForNext();
    },

    (message, command, mark) => {
     if (...) {
       return mark.asRejected('Failed to send message.');
     }

     // ...

     mark.asDone();
   }
  ]
};
```

**Current version (<%= current.version %>)**

```javascript
const commands = {
  send: [
    async (message, command) => {
      if (...) {
        return command.reject('Failed to validate message.');
      }

      // ...
    },

    async (message, command) => {
     if (...) {
       return command.reject('Failed to send message.');
     }

     // ...
   }
  ]
};
```

Please note that you can omit the `async` keyword if you don't use asynchronous code in your middleware. For details see [using command middleware](../../../reference/creating-the-write-model/using-command-middleware/).

## Write model, using services

**Previous version (1.2.0)**

```javascript
const commands = {
  send (message, command, services, mark) {
    const app = services.get('app');

    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const commands = {
  async send (message, command, { app }) {
    // ...
  }
};
```

For details see [using command services](../../../reference/creating-the-write-model/using-command-services/).

## Read model, defining projections

**Previous version (1.2.0)**

```javascript
const when = {
  'communication.message.sent' (messages, event, mark) {
    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const projections = {
  async 'communication.message.sent' (messages, event) {
    // ...
  }
};
```

Please note that you can omit the `async` keyword if you don't use asynchronous code in your projections. For details see [defining projections](../../../reference/creating-the-read-model/defining-projections/).

## Read model, using services

**Previous version (1.2.0)**

```javascript
const when = {
  'communication.message.sent' (messages, event, services, mark) {
    const app = services.get('app');

    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const projections = {
  'communication.message.sent' (messages, event, { app }) {
    // ...
  }
};
```

For details see [using services](../../../reference/creating-the-read-model/using-services/).

## Stateless flows, reacting to events

**Previous version (1.2.0)**

```javascript
const when = {
  'communication.message.sent' (event, mark) {
    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const reactions = {
  async 'communication.message.sent' (event) {
    // ...
  }
};
```

Please note that you can omit the `async` keyword if you don't use asynchronous code in your reaction. For details see [reacting to events](../../../reference/creating-stateless-flows/reacting-to-events/).

## Stateless flows, using services

**Previous version (1.2.0)**

```javascript
const when = {
  'communication.message.sent' (event, services, mark) {
    const app = services.get('app');

    // ...

    mark.asDone();
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const reactions = {
  'communication.message.sent' (event, { app }) {
    // ...
  }
};
```

For details see [using services](../../../reference/creating-stateless-flows/using-services/).

## Stateful flows, reacting to state transitions

**Previous version (1.2.0)**

```javascript
const when = {
  pristine: {
    'awaiting-payment' (flow, event, mark) {
      // ...

      mark.asDone();
    }    
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const reactions = {
  pristine: {
    async 'awaiting-payment' (flow, event) {
      // ...
    }    
  }
};
```

Please note that you can omit the `async` keyword if you don't use asynchronous code in your reaction. For details see [reacting to state transitions](../../../reference/creating-stateful-flows/reacting-to-state-transitions/).

## Stateful flows, using services

**Previous version (1.2.0)**

```javascript
const when = {
  pristine: {
    'communication.message.sent' (flow, event, services, mark) {
      const app = services.get('app');

      // ...

      mark.asDone();
    }    
  }
};
```

**Current version (<%= current.version %>)**

```javascript
const reactions = {
  pristine: {
    'communication.message.sent' (flow, event, { app }) {
      // ...
    }    
  }
};
```

For details see [using services](../../../reference/creating-stateful-flows/using-services/).

## Client

Up to wolkenkit 1.2.0, instead of loading the wolkenkit SDK by using the `require` function, you could use a `<script>` tag in your `index.html` file. wolkenkit <%= current.version %> does not support loading the SDK using a `<script>` tag any more.

So now you must use the `require` function to load the wolkenkit SDK, no matter whether you are on Node.js or you are writing an application for the browser:

```javascript
const wolkenkit = require('wolkenkit-client');
```

This means that when developing for the browser you have to use a bundler such as [webpack](https://webpack.js.org/). For details see [connecting to an application](../../../reference/building-a-client/connecting-to-an-application/#in-the-browser).
