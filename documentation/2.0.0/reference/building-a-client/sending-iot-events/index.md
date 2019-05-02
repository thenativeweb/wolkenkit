# Sending IoT events

If you have set up your application to [collect IoT events](../../creating-the-write-model/collecting-iot-events/) use the appropriate command to send these events. Provide the name of the event that you want to store as well as its data as parameters.

E.g., to send the `sentAsLetterPost` event to an invoice, use the following code:

```javascript
financialservices.accounting.invoice(id).recordEvent({
  name: 'sentAsLetterPost',
  data: {
    // ...
  }
});
```
