# Identifying flows

Since stateful flows may handle the same type of event multiple times, you need to identify the flow instance based on a unique id. This id will usually be derived from a received event. For that, add a function to the `identity` object that maps the received event to the flow's identity.

If a flow only handles events from a single aggregate instance, its identity is probably just the aggregate id, but in more complex scenarios you need to find a common denominator.

:::hint-warning
> **Provide identity**
>
> You must provide an identity function for each event that is to be handled by a stateful flow, even if the identity is the event's aggregate id.
:::

E.g., to identify a flow based on an order's `submitted` event and an invoice's `issued` event, where the common denominator is the order id shared by both events, use the following code:

```javascript
const identity = {
  'accounting.invoice.issued': event => event.data.orderId,
  'delivery.order.submitted': event => event.aggregate.id
};
```
