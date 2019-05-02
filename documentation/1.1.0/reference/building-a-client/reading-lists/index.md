# Reading lists

To read data from a list use the `lists` context and the list name to call its `read` function. Provide a `finished` function to retrieve the list once it has been read.

E.g., to read all invoices, use the following code:

```javascript
app.lists.invoices.read().
  finished(invoices => {
    // ...
  });
```

## Handling errors

If an error happens you will probably want to handle it. For that add the `failed` function and provide a callback that receives the error.

E.g., to handle errors that happen while readong the list of invoices, use the following code:

```javascript
app.lists.invoices.read().
  failed(err => {
    // ...
  }).
  finished(invoices => {
    // ...
  });
```

## Filtering lists

To only receive a subset of a list provide a `where` clause.

E.g., to only get the invoices that were issued before yesterday, use the following code:

```javascript
const yesterday = // ...

app.lists.invoices.read({
  where: { issuedAt: { $lessThan: yesterday }}
}).
  finished(invoices => {
    // ...
  });
```

### Using query operators

You may have to write more complex queries than simple comparisons for equality. For that, use query operators. The following operators are available that match simple types:

Operator                | Description
------------------------|---------------------------------------------
`$greaterThan`          | Matches fields greater than the given value.
`$greaterThanOrEqualTo` | Matches fields greater than or equal to the given value.
`$lessThan`             | Matches fields less than the given value.
`$lessThanOrEqualTo`    | Matches fields less than or equal to the given value.
`$notEqualTo`           | Matches fields not equal to the given value.

E.g., to read all invoices that have an amount less than `1000`, use the following code:

```javascript
app.lists.invoices.read({
  where: { amount: { $lessThan: 1000 }}
}).
  finished(invoices => {
    // ...
  });
```

The following query operators are available that match arrays:

Operator          | Description
------------------|---------------------------------------------
`$contains`       | Matches arrays that contain the given value.
`$doesNotContain` | Matches arrays that do not contain the given value.

E.g., to read all invoices that are tagged with the `private` tag, use the following code:

```javascript
app.lists.invoices.read({
  where: { tags: { $contains: 'private' }}
}).
  finished(invoices => {
    // ...
  });
```

### Using logical operators

To combine multiple `where` clauses, use logical operators. The following operators are available:

Operator | Description
---------|---------------------------------------------
`$and`   | Matches items that match all conditions.
`$or`    | Matches items that match at least one condition.

E.g., to remove all invoices that have an amount less than `1000` or are tagged with the `private` tag, use the following code:

```javascript
app.lists.invoices.read({
  where: {
    $or: [
      { amount: { $lessThan: 1000 }},
      { tags: { $contains: 'private' }}
    ]    
  }
}).
  finished(invoices => {
    // ...
  });
```

## Ordering lists

If you want to order the result, provide an `orderBy` expression and set the sort order to `ascending` or `descending`.

E.g., to get all invoices ordered by their amount, but in descending order, use the following code:

```javascript
app.lists.invoices.read({
  orderBy: { amount: 'descending' }
}).
  finished(invoices => {
    // ...
  });
```

## Browsing lists

Usually, you do not want to read an entire list at once. Instead, you may want to browse the list by reading only a subset. For that, use the `skip` and `take` properties to limit which and how many items to read.

E.g., to only read 10 invoices, starting at the 21st invoice, use the following code:

```javascript
app.lists.invoices.read({
  skip: 20,
  take: 10
}).
  finished(invoices => {
    // ...
  });
```

## Reading single items

If you only want to read a single item from a list, use the `readOne` function. It works in exactly the same way as `read`, except that `where` is mandatory and `orderBy`, `skip` and `take` are not available.

E.g., to read an invoice by its id, use the following code:

```javascript
app.lists.invoices.readOne({
  where: { id: 'bf04c4c4-7b39-4368-a3b6-a98ef445e49d' }
}).
  finished(invoice => {
    // ...
  });
```

## Reading and observing lists

The `read` and `readOne` functions only return a snapshot of a list. While this is enough for many situations, from time to time it may be helpful to retrieve live updates for a list.

For this use `readAndObserve` instead of `read`. Additionally, instead of `finished` you have to provide a `started` and an `updated` function that are called accordingly.

:::hint-tip
> **Same API as read**
>
> You can use `where`, `orderBy`, `skip` and `take` as before. Also the `failed` function works in exactly the same way.
:::

E.g., to read and observe the list of invoices, use the following code:

```javascript
app.lists.invoices.readAndObserve().
  started((invoices, cancel) => {
    // ...
  }).
  updated((invoices, cancel) => {
    // ...
  });
```
