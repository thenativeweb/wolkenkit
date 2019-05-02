# Defining flows

To define a stateful flow, create a `.js` file with the name of the flow within the `server/flows` directory:

```shell
$ cd <app>
$ touch server/flows/<flow>.js
```

:::hint-tip
> **Shared code**
>
> The `server/flows` directory must only contain flows. If you want to add a directory or a file that is shared across multiple flows, put it into the `server/shared` folder.
:::

E.g., if you want to define a flow called `handleInvoice`, use the following directory structure:

```
<app>
  server
    flows
      handleInvoice.js
    readModel
    shared
    writeModel
```

## Structuring the code

Every stateful flow uses the same base structure. Hence, you can prepare a flow by simply copying and pasting the following template:

```javascript
'use strict';

const identity = {};

const initialState = {
  is: 'pristine'
};

const transitions = {};

const reactions = {};

module.exports = { identity, initialState, transitions, reactions };
```
