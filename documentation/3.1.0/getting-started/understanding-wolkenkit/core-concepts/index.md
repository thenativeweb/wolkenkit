# Core concepts

There are three important concepts that make up a wolkenkit application: The write model, the read model, and flows.

<div class="write-model">

## The write model

The write model is responsible for handling input from the client and storing the resulting events. It consists of several separate contexts, where each context has its own individual language.

A context consists of several aggregates. An aggregate is a piece of state inside your application and starts with an initial state. It receives commands that request changes to this state, and it publishes events when the state should actually be changed. In other words, the state will be transformed over time, and its current value results from the history of previously published events.

For more details, see the [write model overview](../../../reference/creating-the-write-model/overview/).

</div>

<div class="read-model">

## The read model

While the write model is a gate-keeper for changing the state of your application, the read model is about efficiently reading this state. For that, the read model transforms the stream of events into data structures that are optimized for reading.

In contrast to the paradigms you might be used to, the read model favors denormalized data structures, since they improve read performance: If all data is denormalized you do not need any joins which will effectively speed up reading data. Keep in mind that the read model is just a cached view of the events that were created within the write model. Hence, the data structures can be recreated at any time without further ado. This also allows to arbitrarily re-interpret events from the past.

For more details, see the [read model overview](../../../reference/creating-the-read-model/overview/).

</div>

<div class="flows">

## Flows

Flows are responsible for reacting to events and sending commands, e.g. to implement workflows. They do neither belong to the write nor to the read model. Instead, they exist on their own. Flows can be used to establish a connection between multiple aggregates, contexts, or applications.

The simplest form of a flow is stateless. It can be seen as a simple If-This-Then-That rule which is responding to events from the write model. E.g., it could send a text message, or simply send another command.

In contrast to these simple flows there is another type of flows, the so-called stateful flows. They can be used to create long-running processes that need to hold some state, e.g. an order process. Basically a stateful flow is a state machine that is able to react to events from the write model, and that can store and change its state. It can then act upon state transitions and create reactions to them just like simple flows do.

For more details, see the [stateless flows overview](../../../reference/creating-stateless-flows/overview/) and the [stateful flows overview](../../../reference/creating-stateful-flows/overview/).

</div>
