# Defining aggregates

To define an aggregate, create a `.js` file with the name of the aggregate within the appropriate context directory:

```shell
$ cd <app>
$ touch server/writeModel/<context>/<aggregate>.js
```

:::hint-tip
> **Shared code**
>
> The `server/writeModel` directory must only contain contexts and aggregates. If you want to add a directory or a file that is shared across multiple aggregates, put it into the `server/shared` folder.
:::

E.g., if you want to define an aggregate called `invoice` in the `accounting` context, use the following directory structure:

```
<app>
  server
    flows
    readModel
    shared
    writeModel
      accounting
        invoice.js
```

## Structuring the code

Every aggregate uses the same base structure. Hence, you can prepare an aggregate by simply copying and pasting the following template:

```javascript
'use strict';

const initialState = {
  isAuthorized: {
    commands: {},
    events: {}
  }
};

const commands = {};

const events = {};

module.exports = { initialState, commands, events };
```
