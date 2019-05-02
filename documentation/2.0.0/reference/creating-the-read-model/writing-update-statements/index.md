# Writing update statements

To update complex items, you may have to write more complex update expressions than just providing the new value. For that, use set operators.

## Using arithmetic set operators

The following arithmetic set operators are available:

Operator       | Description
---------------|---------------------------------------------
`$decrementBy` | Decreases the field by the given value.
`$divideBy`    | Divides the field by the given value.
`$incrementBy` | Increments the field by the given value.
`$multiplyBy`  | Multiplies the field by the given value.

E.g., to increase the `printCount` field of an invoice, use the following code:

```javascript
invoices.update({
  where: { id: event.aggregate.id },
  set: { printCount: { $incrementBy: 1 }}
});
```

## Using array set operators

The following array set operators are available:

Operator  | Description
----------|---------------------------------------------
`$add`    | Adds the given value to the array.
`$remove` | Removes the given value from the array.

E.g., to remove the tag `private` from all invoices that contain this tag, use the given code:

```javascript
invoices.update({
  where: { tags: { $contains: 'private' }},
  set: { tags: { $remove: 'private' }}
});
```
