# Commands

When you send a command from the client or from a flow, internally a JSON object is created. To handle commands, or to create them by yourself, you need to understand their internal structure.

If you call the `send` command from your `chat` application…

```javascript
chat.communication.message().send({
  text: 'hey, how are you?'
});
```

…then the following command will be created:

```javascript
{
  // The context of the command.
  context: {
    name: 'communication'
  },

  // The aggregate that receives the command.
  aggregate: {
    name: 'message',

    // Type: uuid
    id: '0b866be9-f83c-4501-a54f-fa3facb582c5'
  },

  // The name of the command.
  name: 'send',

  // A unique value to identify a specific command in a domain. If you use the
  // wolkenkit client SDK, it is auto-generated; otherwise, you need to create
  // it by yourself.
  // (Type: uuid)
  id: '0ff228c1-e9a5-47a6-9b96-a0767082b61e',

  // The data of the command. This contains any values that you have provided
  // when you called the command from the client.
  data: {
    text: 'hey, how are you?',
    // ...
  },

  // The user that called the command; for anonymous users, this is null.
  user: {
    // The id will be set to the subject of the JWT token provided by your
    // identity provider.
    id: 'jane.doe@thenativeweb.io',

    // The token contains all claims about the user.
    token: {
      sub: 'jane.doe@thenativeweb.io',
      // ...
    }
  },

  metadata: {
    // The point in time when the command was called.
    timestamp: 1421260133331,

    // The id of the event that caused this command; if there is no such event,
    // this is equal to the command id.
    // (Type: uuid)
    causationId: '9a5171e5-957f-40f5-aa70-64418839718e',

    // The id of the command that led to this command; if there is no such
    // command, this is equal to the command id.
    // (Type: uuid)
    correlationId: 'c5104249-76cc-4a18-8419-a52cbbdd4b28'
  }
}
```

:::hint-question
> **What is uuid?**
>
> The type `uuid` refers to a UUID in version 4, formatted as a lowercased string, without curly braces, but with dashes. To create such UUIDs by yourself, use the [uuidv4](https://www.npmjs.com/package/uuidv4) module.
:::
