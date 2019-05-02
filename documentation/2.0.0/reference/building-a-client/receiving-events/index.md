# Receiving events

If you want to receive events no matter whether you have sent a command or not, you need to observe them. For that call the `observe` function on the application's `events` property and handle the received events using the `received` function:

```javascript
app.events.observe().
  received((event, cancel) => {
    // ...
  });
```

### Cancelling observation

To cancel observing events call the provided `cancel` function. Unfortunately, this only works once you have received an event.

If you want to cancel even before that, e.g. after a given amount of time, use the `cancel` function of the `started` function. It is called immediately once observing events was started:

```javascript
app.events.observe().
  started(cancel => {
    // ...
  }).
  received((event, cancel) => {
    // ...
  });
```

## Handling errors

If an error happens you will probably want to handle it. For that add the `failed` function and provide a callback that receives the error:

```javascript
app.events.observe().
  failed(err => {
    // ...
  }).
  received((event, cancel) => {
    // ...
  });
```

## Filtering events

From time to time you do not want to receive all events, but only a subset that matches some filter criteria. For that hand over a `where` clause to the `observe` function.

E.g., to only get `issued` events, run the following code:

```javascript
app.events.observe({
  where: { name: 'issued' }
}).
  received((event, cancel) => {
    // ...
  });
```

## Using the chaining API

You can chain all the aforementioned functions. Although not technically necessary, it is highly recommended to put the `failed` function first to ensure that you don't forget it:

```javascript
app.events.observe().
  failed(err => {
    // ...
  }).
  started(cancel => {
    // ...
  }).
  received((event, cancel) => {
    // ...
  });
```
