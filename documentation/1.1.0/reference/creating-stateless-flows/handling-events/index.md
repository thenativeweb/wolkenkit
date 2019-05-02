# Handling events

To handle an event, add the fully-qualified name of the event to the `when` object and provide a function to handle the event. This function takes two parameters: the event, and a `mark` object.

Inside of the function, add code that reacts to the event. Once you are done, call the `mark.asDone` function.

E.g., to handle the `issued` event of an invoice, use the following code:

```javascript
const when = {
  'accounting.invoice.issued' (event, mark) {
    // ...
    mark.asDone();
  }
};
```
