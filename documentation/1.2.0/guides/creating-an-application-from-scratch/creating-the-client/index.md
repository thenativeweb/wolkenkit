# Creating the client

As wolkenkit is a backend framework, you are completely free to create whatever client you want to, as long as it is able to do HTTP requests.

For JavaScript, there is a client SDK that internally uses this HTTP API, but adds a convenience layer that simplifies talking to your backend dramatically. You can use it inside the browser as well as on the server.

## Downloading the client blueprint

To make things easy we have prepared a sample client for you that you are going to extend. [Download the client](./client.tar.gz) into your `chat` directory and, from within this directory, run the following commands:

```shell
$ tar -xvzf client.tar.gz
$ rm client.tar.gz
```

As a result, your directory structure should look like this:

```
chat
  client
    index.css
    index.html
    index.js
    lib
      ...
  server
    ...
```

:::hint-congrats
> **Vanilla JavaScript**
>
> The client does not depend on a specific UI framework, so you do not need any special knowledge besides what you know about vanilla JavaScript anyway.
:::

## Connecting the client to the backend

First, you need to reference the client SDK from within the `index.html` file. For that, open the file and add the following line:

```html
<script src="/lib/wolkenkit-client.browser.min.js"></script>
```

Then, you need to connect to the backend. For this, open the `index.js` file and add the following lines:

```javascript
wolkenkit.connect({ host: 'local.wolkenkit.io', port: 3000 }).
  then(chat => {
    console.log('Yay, you are connected!');
  }).
  catch(err => {
    console.error(err);
  });
```

For more details, see [connecting to an application](../../../reference/building-a-client/connecting-to-an-application/).

## Test driving the connection

Now, start your wolkenkit backend by running the following command from inside the `chat` directory, and wait until a success message is shown:

```shell
$ wolkenkit start
```

wolkenkit only takes care of the server part of your application and does not run the client for you automatically. Hence you need to install an HTTP server and run the client manually. We are using [http-server](https://www.npmjs.com/package/http-server) that can easily be installed by using the following command:

```shell
$ npm install -g http-server
```

Once you have done that run the client using the following command. This will automatically launch a browser and open the client:

```shell
$ http-server ./client/ -o
```

Have a look at the browser's development console to verify that you actually see the success message:

![Connected](./connected.png)

## Sending messages

To send a message, you must add an event handler to the `submit` event of the client's send message form. Inside of this handler, you can then run the `send` command of the `message` aggregate, that you can access using the `communication` context of the `chat` application:

```javascript
document.querySelector('.send-message-form').addEventListener('submit', event => {
  event.preventDefault();

  const text = document.querySelector('.new-message').value;

  chat.communication.message().send({ text });
});
```

To get notified when something goes wrong, add the `failed` callback to the command. Also, it might be useful to reset and focus the text box, once the command has been delivered to the server. For that, add the `delivered` callback to the command:

```javascript
chat.communication.message().send({ text }).
  failed(err => console.error(err)).
  delivered(() => {
    document.querySelector('.new-message').value = '';
    document.querySelector('.new-message').focus();
  });
```

To ensure that the text box is automatically focused when the client is opened, add another line in the end:

```javascript
document.querySelector('.send-message-form').addEventListener('submit', event => {
  // ...
});

document.querySelector('.new-message').focus();
```

For more details, see [sending commands](../../../reference/building-a-client/sending-commands/).

## Reading and observing messages

Although you are now able to send messages, your client will not receive any of them. To make things work, you need to read and observe the `messages` list and update the UI accordingly. For that, use the `started` and the `updated` callbacks. As before, you will also want to make sure that you get notified in case of errors:

```javascript
// ...

document.querySelector('.new-message').focus();

chat.lists.messages.readAndObserve().
  failed(err => console.error(err)).
  started(render).
  updated(render);
```

:::hint-question
> **What is render?**
>
> The `render` function does not belong to wolkenkit. Instead it is a ready-made function of the client blueprint that makes it easy to update its UI. If you are interested in how this works, feel free to have a look at the source code.
:::

In a chat it makes sense to have the newest messages at the top of the client, so we will order the messages reversed by their timestamp. Also, you probably do not want to receive all messages that have ever been written, so let's limit their number to `50`:

```javascript
chat.lists.messages.readAndObserve({
  orderBy: { timestamp: 'descending' },
  take: 50
}).
  failed(err => console.error(err)).
  started(render).
  updated(render);
```

You are now able to send and receive messages, so you already have a working chat.

For more details, see [reading lists](../../../reference/building-a-client/reading-lists/).

## Liking messages

What is still missing is the ability to *like* messages. As the client already provides buttons for this, we are going to handle their `click` events. For performance reasons this is done once for the list, not for each button individually. Of course, then you need to get the `id` of the message whose button was clicked.

Finally, you can run the `like` command for the message of your choice:

```javascript
chat.lists.messages.readAndObserve().
  // ...

document.querySelector('.messages').addEventListener('click', event => {
  if (!event.target.classList.contains('likes')) {
    return;
  }

  const messageId = event.target.getAttribute('data-message-id');

  chat.communication.message(messageId).like().
    failed(err => console.error(err));
});
```

## Lets's chat!

Once you reload your browser, you are now able to chat. This even works with multiple browsers concurrently:

![The chat application](chat.png)

:::hint-congrats
> **Yay, congratulations!**
>
> You have created your first application from scratch, including a real-time client!
:::

Let's recap what you have achieved:

- Users can send messages.
- Users can like messages.
- Sent messages are visible to all users.
- When a user enters the chat they are shown the previously sent messages.
- When a user receives a message the UI is updated in real-time.
- Sending and receiving messages is possible using an API.
- Sending and receiving messages is encrypted.

We hope that you will have a great time with wolkenkit. For now, we wish you some happy chatting 😊!
