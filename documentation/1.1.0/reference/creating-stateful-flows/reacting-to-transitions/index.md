# Reacting to transitions

If a flow transitions from one state to another, you can run a reaction.

To run a reaction, add an object to the `when` object using the name of the current state, and then, inside of this object, a function with the name of the new state. This function takes three parameters: the flow itself, the event, and a `mark` object.

Inside of the function, add code that reacts to the transition. To read the flow's state, use the `state` property of the flow. Once you are done, call the `mark.asDone` function. If something failed, you may call the `mark.asRejected` function and provide a reason.

E.g., to run a reaction when a flow transitions from `pristine` to `awaiting-payment`, use the following code:

```javascript
const when = {
  pristine: {
    'awaiting-payment' (flow, event, mark) {
      // ...

      mark.asDone();
    }
  }
};
```
