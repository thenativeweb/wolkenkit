# Defining the initial state

To define the initial state, assign the desired properties to the `initialState` object.

:::hint-warning
> **JSON only**
>
> You may use any JavaScript data type and value that is supported by JSON. This especially means that you are not allowed to use constructor functions here. Rely on object and array literals instead.
:::

E.g., if you want to add a field  of type string named `recipient`, you will end up with the following initial state:

```javascript
const initialState = {
  recipient: '',
  isAuthorized: {
    commands: {},
    events: {}
  }
};
```

:::hint-warning
> **Required property**
>
> Do not remove the `isAuthorized` property, since this is a reserved name.
:::

For more details on the `isAuthorized` property, see [configuring authorization](../configuring-authorization/).
