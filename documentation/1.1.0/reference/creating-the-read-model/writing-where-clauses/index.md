# Writing where clauses

To update or remove all items that match a given criteria, you may have to write more complex queries than simple comparisons for equality. For that, use query operators.

## Using query operators

The following query operators are available that match simple types:

Operator                | Description
------------------------|---------------------------------------------
`$greaterThan`          | Matches fields greater than the given value.
`$greaterThanOrEqualTo` | Matches fields greater than or equal to the given value.
`$lessThan`             | Matches fields less than the given value.
`$lessThanOrEqualTo`    | Matches fields less than or equal to the given value.
`$notEqualTo`           | Matches fields not equal to the given value.

E.g., to remove all invoices that have an amount less than `1000`, use the following code:

```javascript
invoices.remove({
  where: { amount: { $lessThan: 1000 }}
});
```

The following query operators are available that match arrays:

Operator          | Description
------------------|---------------------------------------------
`$contains`       | Matches arrays that contain the given value.
`$doesNotContain` | Matches arrays that do not contain the given value.

E.g., to remove all invoices that are tagged with the `private` tag, use the following code:

```javascript
invoices.remove({
  where: { tags: { $contains: 'private' }}
});
```

## Using logical operators

To combine multiple `where` clauses, use logical operators. The following logical operators are available:

Operator | Description
---------|---------------------------------------------
`$and`   | Matches items that match all conditions.
`$or`    | Matches items that match at least one condition.

E.g., to remove all invoices that have an amount less than `1000` or are tagged with the `private` tag, use the following code:

```javascript
invoices.remove({
  where: {
    $or: [
      { amount: { $lessThan: 1000 }},
      { tags: { $contains: 'private' }}
    ]    
  }
});
```
