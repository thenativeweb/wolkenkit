# Defining lists

To define a list, create a `.js` file with the name of the list within the `server/readModel/lists` directory:

```shell
$ cd <app>
$ touch server/readModel/lists/<list>.js
```

:::hint-tip
> **Shared code**
>
> The `server/readModel/lists` directory must only contain lists. If you want to add a directory or a file that is shared across multiple lists, put it into the `server/shared` folder.
:::

E.g., if you want to define a list called `invoices`, use the following directory structure:

```
<app>
  server
    flows
    readModel
      lists
        invoices.js
    shared
    writeModel
```

:::hint-question
> **Where is the context?**
>
> In contrast to the write model the read model does not use contexts. This is because a read model can handle events from multiple contexts, so it may not be possible to assign a read model to a specific context.
:::

## Structuring the code

Every list uses the same base structure. Hence, you can prepare a list by simply copying and pasting the following template:

```javascript
'use strict';

const fields = {};

const projections = {};

module.exports = { fields, projections };
```

If you need to [define transformations](../defining-transformations/), you also have to add a `transformations` section. Since transformations are optional, you do not need to provide this section if you don't need it:

```javascript
'use strict';

const fields = {};

const projections = {};

const transformations = {};

module.exports = { fields, projections, transformations };
```
