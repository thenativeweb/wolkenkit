# Defining the initial state

To define the initial state, assign the desired properties to the `initialState` object.

:::hint-warning
> **JSON only**
>
> You may use any JavaScript data type and value that is supported by JSON. This especially means that you are not allowed to use constructor functions here. Rely on object and array literals instead.
:::

E.g., if you want to add a field of type boolean named `isChecked`, you will end up with the following initial state:

```javascript
const initialState = {
  isChecked: false,
  is: 'pristine'
};
```

The `is` property represents the name of the flow's current state. It will later be changed when the flow [transitions to a new state](../defining-state-transitions/#transitioning-to-a-new-state).

:::hint-warning
> **Required property**
>
> Do not remove the `is` property, since it is required, and therefor reserved.
:::
