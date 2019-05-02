# Defining flows

To define a stateless flow, create a `.js` file with the name of the flow within the `server/flows` directory:

```shell
$ cd <app>
$ touch server/flows/<flow>.js
```

:::hint-tip
> **Shared code**
>
> The `server/flows` directory must only contain flows. If you want to add a directory or a file that is shared across multiple flows, put it into the `server/shared` folder.
:::

E.g., if you want to define a flow called `onIssued`, use the following directory structure:

```
<app>
  server
    flows
      onIssued.js
    readModel
    shared
    writeModel
```

## Structuring the code

Every stateless flow uses the same base structure. Hence, you can prepare a flow by simply copying and pasting the following template:

```javascript
'use strict';

const reactions = {};

module.exports = { reactions };
```
