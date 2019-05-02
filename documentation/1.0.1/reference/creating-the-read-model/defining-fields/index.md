# Defining fields

To define the fields of a list add their names to the `fields` object and set their initial state.

E.g., to add the fields `amount` and `recipient` to a list of invoices, use the following code:

```javascript
const fields = {
  amount: { initialState: 0 },
  recipient: { initialState: '' }
};
```

## Speeding up reading lists

For fields that are queried often it may make sense to index them. To do so, add the `fastLookup` property to the field's definition and set it to `true`. Avoid applying this to every field, as this may actually degrade performance.

E.g., to add an index to the `recipient` field of the list of invoices, use the following code:

```javascript
const fields = {
  amount: { initialState: 0 },
  recipient: { initialState: '', fastLookup: true }
};
```

:::hint-tip
> **Fast ids by default**
>
> The `id` field of every list is indexed automatically.
:::

## Marking fields as unique

Optionally, you may mark fields to be unique. For that, add the `isUnique` property and set it to `true`.

:::hint-warning
> **Unique fields require fast lookup**
>
> This only works for fields that are indexed using the `fastLookup` property.
:::

E.g., to mark the `recipient` field of the list of invoices as unique, use the following code:

```javascript
const fields = {
  amount: { initialState: 0 },
  recipient: { initialState: '', fastLookup: true, isUnique: true }
};
```

:::hint-tip
> **Unique ids by default**
>
> The `id` field of every list is marked as unique automatically.
:::
