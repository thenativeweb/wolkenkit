# Creating the read model

To create the *messages* list, create a `messages.js` file within the `lists` directory:

```shell
$ touch chat/server/readModel/lists/messages.js
```
:::hint-question
> **Where is the context?**
>
> In contrast to the write model the read model does not use contexts. This is because a read model can handle events from multiple contexts, so it may not be possible to assign a read model to a specific context.
:::

Then, open the file and add the following base structure:

```javascript
'use strict';

const fields = {};

const projections = {};

module.exports = { fields, projections };
```

For more details, see [defining lists](../../../reference/creating-the-read-model/defining-lists/).

## Defining fields

As you have decided while modeling that each message in the list of messages should have a text, a number of likes, and a timestamp, you need to define the appropriate fields:

```javascript
const fields = {
  text: { initialState: '' },
  likes: { initialState: 0 },
  timestamp: { initialState: 0 }
};
```

Additionally, an `id` field is created automatically.

For more details, see [defining fields](../../../reference/creating-the-read-model/defining-fields/).

## Handling the sent event

The next question is how the list becomes filled with messages. For that you need to handle the events that have been published by the write model.

Whenever a message has been sent, add it to the list of messages, and set the text and timestamp to the data that are provided by the event. Add a `communication.message.sent` function to the `projections` object. It receives two parameters, the `messages` list itself and the actual `event`.

Add the message to the list by calling its `add` function. You do not need to set the `id` field, as it gets automatically populated using the aggregate's id that is given in the event:

```javascript
const projections = {
  'communication.message.sent' (messages, event) {
    messages.add({
      text: event.data.text,
      timestamp: event.metadata.timestamp
    });
  }
};
```

For more details, see [defining projections](../../../reference/creating-the-read-model/defining-projections/).

## Handling the liked event

Handling the *liked* event is basically the same as handling the *sent* event. The only difference is that now you need to update an existing message instead of adding a new one. Again, add an event handler, but this time call the list's `update` function:

```javascript
const projections = {
  // ...
  'communication.message.liked' (messages, event) {
    messages.update({
      where: { id: event.aggregate.id },
      set: {
        likes: event.data.likes
      }
    });
  }
};
```

## Safety check

Before you proceed, make sure that your list looks like this:

```javascript
'use strict';

const fields = {
  text: { initialState: '' },
  likes: { initialState: 0 },
  timestamp: { initialState: 0 }
};

const projections = {
  'communication.message.sent' (messages, event) {
    messages.add({
      text: event.data.text,
      timestamp: event.metadata.timestamp
    });
  },

  'communication.message.liked' (messages, event) {
    messages.update({
      where: { id: event.aggregate.id },
      set: {
        likes: event.data.likes
      }
    });
  }
};

module.exports = { fields, projections };
```

:::hint-congrats
> **Yay, congratulations!**
>
> You have created your first read model, and clients can read and observe it in real-time!
:::

Now we are ready for [creating the client](../creating-the-client/), so let's go ahead!
