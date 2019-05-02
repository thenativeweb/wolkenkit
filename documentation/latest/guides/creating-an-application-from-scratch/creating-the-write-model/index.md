# Creating the write model

First, you need to create a new directory for your application. Call it `chat`:

```shell
$ mkdir chat
```

Inside of this directory you will store the wolkenkit application as well as any related files, such as documentation, images, and so on. The actual wolkenkit code must be in a directory called `server`, so you need to create it as well:

```shell
$ mkdir chat/server
```

Finally, for the write model, you need to create another directory called `writeModel` inside of the `server` directory:

```shell
$ mkdir chat/server/writeModel
```

To have a valid directory structure, you also need to add three more directories that you are going to need later, `readModel`, `readModel/lists`, and `flows`:

```shell
$ mkdir chat/server/readModel
$ mkdir chat/server/readModel/lists
$ mkdir chat/server/flows
```

::: hint-question
> **What do write model, read model, and flows mean?**
>
> If you are unsure about what the write model, the read model, and flows are, have a look at the [core concepts](../../../getting-started/understanding-wolkenkit/core-concepts/).
:::

As a result, your directory structure should look like this:

```
chat
  server
    flows
    readModel
      lists
    writeModel
```

For more details, see [creating the directory structure](../../../reference/initializing-an-application/starting-from-scratch/#creating-the-directory-structure).

## Configuring the application

One thing every wolkenkit application needs is a `package.json` file within the application's directory. This file contains some configuration options that wolkenkit needs to start the application.

Create a `package.json` file within the `chat` directory:

```shell
$ touch chat/package.json
```

Then, open the file and add the following code:

```json
{
  "name": "chat",
  "version": "0.0.0",
  "wolkenkit": {
    "application": "chat",
    "runtime": {
      "version": "<%= current.version %>"
    },
    "environments": {
      "default": {
        "api": {
          "port": 3000,
          "allowAccessFrom": "*"
        },
        "fileStorage": {
          "allowAccessFrom": "*"
        },
        "node": {
          "environment": "development"
        }
      }
    }
  }
}
```

For more details, see [configuring an application](../../../reference/configuring-an-application/naming-an-application/).

## Creating the communication context

To create the *communication* context, create an appropriate directory within the `writeModel` directory:

```shell
$ mkdir chat/server/writeModel/communication
```

For more details, see [defining contexts](../../../reference/creating-the-write-model/defining-contexts/).

## Creating the message aggregate

To create the *message* aggregate, create a `message.js` file within the `communication` directory:

```shell
$ touch chat/server/writeModel/communication/message.js
```

Then, open the file and add the following base structure:

```javascript
'use strict';

const initialState = {
  isAuthorized: {
    commands: {},
    events: {}
  }
};

const commands = {};

const events = {};

module.exports = { initialState, commands, events };
```

For more details, see [defining aggregates](../../../reference/creating-the-write-model/defining-aggregates/).

## Initializing the state

As you have learned while modeling, a message has a `text` and a number of `likes`. For a new message it makes sense to initialize those values to an empty string, and the number `0` respectively. So, add the following two properties to the `initialState`:

```javascript
const initialState = {
  text: '',
  likes: 0,
  // ...
};
```

For more details, see [defining the initial state](../../../reference/creating-the-write-model/defining-the-initial-state/).

## Implementing the send command

Now let's create the *send* command by adding a `send` function to the `commands` object. It receives two parameters, the `message` itself and the actual `command`. For details on the structure of the `command` object, see the [data structure of commands](../../../reference/data-structures/commands/).

Inside of this function you need to figure out whether the command is valid, and if so, publish an event. In the simplest case your code looks like this:

```javascript
const commands = {
  send (message, command) {
    message.events.publish('sent', {
      text: command.data.text
    });
  }  
};
```

Please note that you need to add the text that is contained within the command to the event, because the event is responsible for updating the state. Additionally, this gets sent to the read model and to the client, and they both are probably interested in the message's text.

Although this is going to work, it has one major drawback. The code also publishes the `sent` event for empty messages, as there is no validation. To add this, check the command's `data` property and reject the command if the text is missing:

```javascript
send (message, command) {
  if (!command.data.text) {
    return command.reject('Text is missing.');
  }

  // ...
}
```

For more details, see [defining commands](../../../reference/creating-the-write-model/defining-commands/) and [using command middleware](../../../reference/creating-the-write-model/using-command-middleware/). For details on what's inside a command, see the [data structure of commands](../../../reference/data-structures/commands/).

## Implementing the sent event

To make things work, you also need to implement a handler that reacts to the *sent* event and updates the aggregate's state. For that add a `sent` function to the `events` object. It receives two parameters, the `message` itself, and the actual `event`.

Inside of this function you need to update the state of the message. To set the text to its new value, use the `setState` function of the message object:

```javascript
const events = {
  sent (message, event) {
    message.setState({
      text: event.data.text
    });
  }  
};
```

For more details, see [defining events](../../../reference/creating-the-write-model/defining-events/). For details on what's inside an event, see the [data structure of events](../../../reference/data-structures/events/).

## Implementing the like command

Implementing the *like* command is basically the same as implementing the *send* command. There is one exception, because *like* is self-sufficient and has no additional data. Hence the `like` command could look like this:

```javascript
const commands = {
  // ...
  like (message, command) {
    message.events.publish('liked');
  }  
};
```

Anyway, this raises the question how an event handler should figure out the new number of likes. This is especially true for a client that does not have the current state at hand, but might also be interested in the *liked* event. To fix this, calculate the new number of likes and add this information when publishing the *liked* event:

```javascript
// ...
message.events.publish('liked', {
  likes: message.state.likes + 1
});
// ...
```

## Implementing the liked event

Implementing the *liked* event is exactly the same as implementing the *sent* event. Hence, your code looks like this:

```javascript
const events = {
  // ...
  liked (message, event) {
    message.setState({
      likes: event.data.likes
    });
  }  
};
```

## Configuring the authorization

By default, you will not be able to run the new commands or receive any events for security reasons. As we are not going to implement authentication for this application, you need to allow access for public users. For that, add the following lines to the `isAuthorized` section of the `initialState`:

```javascript
const initialState = {
  // ...
  isAuthorized: {
    commands: {
      send: { forPublic: true },
      like: { forPublic: true }
    },
    events: {
      sent: { forPublic: true },
      liked: { forPublic: true }
    }
  }
};
```

For more details, see [configuring authorization](../../../reference/creating-the-write-model/configuring-authorization/).

## Safety check

Before you proceed, make sure that your aggregate looks like this:

```javascript
'use strict';

const initialState = {
  text: '',
  likes: 0,
  isAuthorized: {
    commands: {
      send: { forPublic: true },
      like: { forPublic: true }
    },
    events: {
      sent: { forPublic: true },
      liked: { forPublic: true }
    }
  }
};

const commands = {
  send (message, command) {
    if (!command.data.text) {
      return command.reject('Text is missing.');
    }

    message.events.publish('sent', {
      text: command.data.text
    });
  },

  like (message, command) {
    message.events.publish('liked', {
      likes: message.state.likes + 1
    });
  }
};

const events = {
  sent (message, event) {
    message.setState({
      text: event.data.text
    });
  },

  liked (message, event) {
    message.setState({
      likes: event.data.likes
    });
  }
};

module.exports = { initialState, commands, events };
```

## Test driving the write model

Now, start your application by running the following command from inside the `chat` directory, and wait until a success message is shown:

```shell
$ wolkenkit start
```

For more details, see [controlling the lifecycle](../../../reference/using-the-cli/controlling-the-lifecycle/).

:::hint-congrats
> **Yay, congratulations!**
>
> You have created your first write model, and you are now also running a cloud-native application that is powered by an HTTP API that streams events in real-time, all securely encrypted using TLS!
:::

Let's try it. First subscribe to the real-time events. Open a new terminal and run the following command:

```shell
$ curl -X POST https://local.wolkenkit.io:3000/v1/events
```

Now, open another terminal side-by-side, and send your first chat message. As soon as you send it, you can watch the events that are being published:

```shell
$ AGGREGATE_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
$ TIMESTAMP="$(date +%s000)"
$ curl \
    -X POST \
    -H "content-type: application/json" \
    -d '{
          "context": {
            "name": "communication"
          },
          "aggregate": {
            "name": "message",
            "id": "'"$AGGREGATE_ID"'"
          },
          "name": "send",
          "id": "'"$AGGREGATE_ID"'",
          "data": {
            "text": "Hello wolkenkit!"
          },
          "custom": {},
          "user": null,
          "metadata": {
            "timestamp": '"$TIMESTAMP"',
            "causationId": "'"$AGGREGATE_ID"'",
            "correlationId": "'"$AGGREGATE_ID"'"
          }
        }' \
    https://local.wolkenkit.io:3000/v1/command
```

Before you proceed, cancel the running `curl` process, and stop your application by running the following command:

```shell
$ wolkenkit stop
```

For the client, we are now missing the list of messages, so let's go ahead and start [creating the read model](../creating-the-read-model/)!
