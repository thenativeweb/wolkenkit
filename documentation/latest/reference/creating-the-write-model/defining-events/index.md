# Defining events

An event updates the state of the aggregate once it has been published. So, a function that is defined inside of the `events` object can be seen as an event handler that reacts to a particular event and updates the aggregate's state.

To define an event add an appropriately named function to the `events` object of the aggregate the event refers to. This function receives two parameters: the aggregate instance, and the event.

Inside of the function, add code that modifies the aggregate state. For that use the `setState` function of the aggregate.

:::hint-warning
> **Always handle events synchronously**
>
> You should be careful not to have any logic in an event, besides updating the state. That's why, unlike commands, events are always synchronous. Therefore, you must not use the `async` keyword here.
:::

E.g., to handle an `issued` event and set the `isIssued` property to `true`, use the following code:

```javascript
const events = {
  issued (invoice, event) {
    invoice.setState({
      isIssued: true
    });
  }
};
```

For a detailed list of an event's properties, see the [data structure of events](../../data-structures/events/).

:::hint-warning
> **Reserved event names**
>
> Do not name an event `transferredOwnership` or `authorized`, since these are reserved names.
:::

## Accessing the event data

To set the aggregate state you may need to access the event data. For that, use the `event.data` property.

E.g., to set the `requiresAttention` property depending on the amount that is given in the `issued` event, use the following code:

```javascript
invoice.setState({
  requiresAttention: event.data.amount > 2500
});
```

To get the aggregate ID, access the property `id` of the aggregate directly, as the ID is not part of the state.
