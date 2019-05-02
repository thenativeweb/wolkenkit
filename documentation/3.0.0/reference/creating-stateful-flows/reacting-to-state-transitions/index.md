# Reacting to state transitions

If a flow transitions from one state to another, you can run a reaction.

To run a reaction, add an object to the `reactions` object using the name of the current state, and then, inside of this object, a function with the name of the new state. This function takes two parameters, the flow itself and the event.

Inside of the function, add code that reacts to the transition. To read the flow's state, use the `state` property of the flow. If something failed, call the `event.fail` function and provide a reason.

E.g., to run a reaction when a flow transitions from `pristine` to `awaiting-payment`, use the following code:

```javascript
const reactions = {
  pristine: {
    'awaiting-payment' (flow, event) {
      // ...
    }
  }
};
```

Some reactions require asynchronous code. Therefore, you can use the keywords `async` and `await`. To be able to do this, define the reaction using the `async` keyword:

```javascript
const reactions = {
  pristine: {
    async 'awaiting-payment' (flow, event) {
      // ...
    }
  }
};
```
