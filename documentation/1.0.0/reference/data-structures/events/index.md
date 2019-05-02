# Events

When you publish an event from a write model, internally a JSON object is created. To handle events, you need to understand their internal structure.

If you publish the `sent` event from your `chat` application…

```javascript
message.events.publish('sent', {
  text: command.data.text
});
```

…then the following event will be created:

```javascript
{
  // The context of the event.
  context: {
    name: 'communication'
  },

  // The aggregate that published the event.
  aggregate: {
    name: 'message',

    // Type: uuid
    id: '0b866be9-f83c-4501-a54f-fa3facb582c5'
  },

  // The name of the event.
  name: 'send',

  // A unique value to identify a specific event in a domain.
  // (Type: uuid)
  id: '4c99d051-a526-4526-9cca-34f92a6c8c9d',

  // The type of the event, depending on its source.
  // Values: [ 'domain', 'readModel' ]
  type: 'domain',

  // The data of the event. This contains any values that you have provided when
  // you published the event.
  data: {
    text: 'hey, how are you?',
    // ...
  },

  // The user that caused this event; for anonymous users, this is null.
  user: {
    // The id will be set to the subject of the command's JWT token provided by
    // your identity provider.
    id: 'jane.doe@thenativeweb.io'
  },

  metadata: {
    // The point in time when the event was published.
    timestamp: 1421260133331,

    // The id of the command that caused this event.
    // (Type: uuid)
    causationId: '0ff228c1-e9a5-47a6-9b96-a0767082b61e',

    // The id of the command that led to this event.
    // (Type: uuid)
    correlationId: '0ff228c1-e9a5-47a6-9b96-a0767082b61e',

    isAuthorized: {
      // The id of the user that owns the aggregate instance that published
      // this event.
      owner: 'jane.doe@thenativeweb.io',

      // Set to true, if authenticated users are allowed to receive this event;
      // otherwise false.
      forAuthenticated: true,

      // Set to true, if public users are allowed to receive this event;
      // otherwise false.
      forPublic: false
    }
  }
}
```

:::hint-question
> **What is uuid?**
>
> The type `uuid` refers to a UUID in version 4, formatted as a lowercased string, without curly braces, but with dashes. To create such UUIDs by yourself, use the [uuidv4](https://www.npmjs.com/package/uuidv4) module.
:::
