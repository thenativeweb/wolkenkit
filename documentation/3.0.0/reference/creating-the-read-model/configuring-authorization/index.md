# Configuring authorization

When a list handles an event that results in adding a new item, this item inherits the authorization from the event. This ensures that the authorization is consistent across events and lists. Additionally, the user that caused the event becomes the owner of the list item.

E.g., configure the authorization of an invoice in a way that authenticated users can receive `issued` events, but public users can't:

```javascript
const initialState = {
  isAuthorized: {
    commands: {},
    events: {
      issued: { forAuthenticated: true, forPublic: false }
    }
  }
};
```

Now, make the list of invoices handle this event and add a new item:

```javascript
const projections = {
  'accounting.invoice.issued' (invoices, event) {
    invoices.add({
      amount: event.data.amount
    });
  }
};
```

Then, the new item will be readable by authenticated users, but not by public users. Additionally, the user who caused the `issued` event becomes the owner of this list item.

## Granting access at runtime

Sometimes you need to grant or revoke access to a list item at runtime. For that, use the `authorize` function. This function requires you to provide a `where` clause to select the desired items as well as the access rights that you want to change.

To grant access to any authenticated user set the `forAuthenticated` flag to `true`, to grant access to anyone set the `forPublic` flag to `true`. To revoke access use `false` instead. Not providing a flag at all is equivalent to not changing the current configuration.

E.g., to grant read access to all invoices that have an amount less than `1000` to all authenticated users, and revoke access for public users at the same time, use the following code:

```javascript
invoices.authorize({
  where: { amount: { $lessThan: 1000 }},
  forAuthenticated: true,
  forPublic: false
});
```

## Transferring ownership

To transfer ownership of a list item, use its `transferOwnership` function. This function requires you to provide the id of the new owner using the `to` property.

E.g., to transfer ownership of all invoices that have an amount less than `1000` to the user with the id `09ee43c9-5abc-4e9b-acc3-e8b75a3e4b98`, use the following code:

```javascript
invoices.transferOwnership({
  where: { amount: { $lessThan: 1000 }},
  to: '09ee43c9-5abc-4e9b-acc3-e8b75a3e4b98'
});
```

:::hint-warning
> **Only known users**
>
> If you provide an id of a non-existent user, the ownership will be transferred anyway. You will not be able to return to the previous state.
:::
