# Defining transformations

When reading items, by default all items are returned as they are. However, sometimes it may be needed to filter or modify items, e.g. to hide items based on the time of the day, or to dynamically add fields that contain calculated values. You can do this using the `filter` and `map` transformations.

To be able to use transformations, make sure that you have added a `transformations` section to your list definition as described in [defining lists](../defining-lists/#structuring-the-code).

## Filtering items

To filter which items are being returned when reading a list, provide a `filter` function in the `transformations` section. This function is then called for each item individually, and you are handed over the item as well as the query that was sent by the client.

The `filter` function has to return a boolean value. If it returns `true`, the appropriate item is included in the result; if it returns `false`, the item is excluded:

```javascript
const transformations = {
  filter (invoices, query) {
    // ...
  }
};
```

The `query` parameter not only allows to access the `where`, `orderBy`, `skip` and `limit` parts of the query, but also provides access to the user that runs the query, and to their token. This way, e.g. you can easily filter items based on specific claims in the user's token:

```javascript
const transformations = {
  filter (invoice, query) {
    if (!query.user.token.roles.includes('accountant')) {
      return false;
    }

    return true;
  }
};
```

## Mapping items

Besides filtering items, you may also want to modify them while reading. This can be reasonable to hide fields that contain sensible data from specific users, or to dynamically add new fields that contain values that are calculated based on the other fields.

For this, provide a `map` function as part of the `transformations` section. This function is then called for each item individually, and you are handed over the item as well as the query that was sent by the client. The `map` function has to return the modified item (or the original one if you don't want to apply any modifications):

```javascript
const transformations = {
  map (invoice, query) {
    return {
      ...invoice,
      grossValue: invoice.netValue * invoice.salesTax
    };
  }
};
```

As with the `filter` function, the `query` parameter not only allows to access the `where`, `orderBy`, `skip` and `limit` parts of the query, but also provides access to the user that runs the query, and to their token. This way, e.g. you can easily map items based on specific claims in the user's token.
