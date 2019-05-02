# Handling application events

The client application is an [EventEmitter](https://nodejs.org/dist/v<%= current.versions.node %>/docs/api/events.html#events_class_eventemitter) that emits multiple lifecycle events.

## Handling errors

If your client application encounters an error, it emits an `error` event:

```javascript
app.on('error', err => {
  console.error(err);
});
```

## Handling disconnects

From time to time your client application may lose its connection to the wolkenkit application, e.g. because of network issues.

If the connection gets lost the client application will emit a `disconnected` event. Once you receive this event you should stop sending commands, and let the user know that they are currently not able to work.

```javascript
app.on('disconnected', () => {
 // ...
});
```

Whenever the client application establishes a connection to the wolkenkit application again, it emits a `connected` event:

```javascript
app.on('connected', () => {
 // ...
});
```

:::hint-tip
> **Reload on connected**
>
> Even if a connection gets established again, the client application and the wolkenkit application need to be synchronized again. Hence it is recommended to reload the client application. You may use the `connected` event to do this automatically.
>
> ```javascript
> app.on('connected', () => {
>   window.location.reload();
> });
> ```
:::
