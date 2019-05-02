# Defining state transitions

If a stateful flow receives an event it can transition to a new state, depending on the state it is currently in.

To handle an event, add an object to the `transitions` object using the name of the current state, and then, inside of this object, add the fully-qualified name of the event and provide a function to handle the event. This function takes two parameters: the flow itself and the event.

To read the flow's state, use the `state` property of the flow.

E.g., to handle the `issued` event of an invoice when the flow is in the `pristine` state, use the following code:

```javascript
const transitions = {
  pristine: {
    'accounting.invoice.issued' (flow, event) {
      // ...
    }
  }
};
```

## Setting the state

Inside of the function, add code that sets the state of the flow. For that, use the `setState` function of the flow.

E.g., to set the `isChecked` property of the state to `true` when an invoice's `checked` event is received while being in the `pristine` state, use the following code:

```javascript
const transitions = {
  pristine: {
    'accounting.invoice.checked' (flow, event) {
      flow.setState({
        isChecked: true
      });
    }
  }
};
```

## Transitioning to a new state

To transition a flow from the `pristine` state to a new one, use the flow's `transitionTo` function and provide the name of the new state.

E.g., to transition to the `awaiting-payment` state when an invoice's `checked` event is received while being in the `pristine` state, use the following code:

```javascript
const transitions = {
  pristine: {
    'accounting.invoice.checked' (flow, event) {
      flow.transitionTo('awaiting-payment');
    }
  }
};
```

## Handling errors

If an error happens while handling an event and you don't handle it, the flow transitions automatically to the `failed` state. You can [react to this transition](../reacting-to-state-transitions/) in the same way as you can do with any other transition.
