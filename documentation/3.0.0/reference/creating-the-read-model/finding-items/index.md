# Finding items

From time to time, before adding, updating or removing items, you may need to look up other items first. For this, use the list's `read` function, which returns an array of all items that match the given criteria.

E.g., to find all invoices with an amount less than `1000`, use the following code:

```javascript
const otherInvoices = await invoices.read({
  where: { amount: { $lessThan: 1000 }}
});
```

## Finding single items

To find a single item, use the list's `readOne` function, which returns the item itself.

E.g., to find an invoice by its id, use the following code:

```javascript
const otherInvoice = await invoices.readOne({
  where: { id: '13e86e54-406a-4790-b57b-37f854625215' }
});
```
