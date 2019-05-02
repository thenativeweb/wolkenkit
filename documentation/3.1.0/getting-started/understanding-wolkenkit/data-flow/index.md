# Data flow

In a wolkenkit application, you typically have a client with a task-based UI. This may be a static web site, a mobile application, or anything else. Everytime the user performs a task, the client sends one or more commands to the server.

The server acknowledges the commands' receipt. For now, the client is done. This means that the client does not know whether the command was handled successfully in the first place. Instead, it's fire-and-forget. The reason the client does not wait for a response is that the UI shall not block, and handling the command may take a while.

![Data flow](/data-flow/data-flow.svg)

The server typically stores the command in a queue to decouple receiving commands from handling them. The queue allows the workers behind the queue to scale independently, as it acts as a buffer.

These workers are called *command handlers*. They decide which aggregate the command refers to, load and run the appropriate domain logic on it. This is where event-sourcing and domain-driven design come into play. We'll look at this in a minute.

The aggregate then decides whether to run the command. It may be that a command is not allowed in a certain state of the aggregate, e.g. the text of a message can only be edited if the message is not older than 24 hours. Anyway, the aggregate publishes events on what has happened. This way, you always get an event, even in case of an error.

Finally, the command handler forwards those events to anyone who is interested. This is done by storing them to a queue again.

To display results the client could subscribe and react to events. This enables live-updates, but makes it incredibly hard to get the initial view. For that, the events must be materialized into a snapshot the client can fetch at any point in time.

This is done using *event denormalizers*. They again are workers, but handle events instead of commands. In their most essential form they map events to CRUD. Each denormalizer is responsible for a table that backs a specific view in the client and updates it accordingly.

This way, each time an event is received by a denormalizer, the view gets updated. As you can easily run more than one instance of a denormalizer, scaling them is very easy.

So, the client fetches these tables. As there is a dedicated table for each of the client's views, a simple `SELECT * FROM table` is usually enough. This works because the denormalizers do not care about 3<sup>rd</sup> normal form but store data in a denormalized form perfectly suited for each view. Additionally, clients may subscribe to the events themselves, e.g. to display updates in real-time.

In summary, clients send commands to the domain which, as a reaction, publishes appropriate events. These events are then used to make up materialized views. All the events are stored within an event store.
