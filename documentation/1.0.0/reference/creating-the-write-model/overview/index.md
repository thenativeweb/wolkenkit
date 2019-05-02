# Overview

The write model is responsible for updating the application state. For that, it handles commands, publishes and stores events, and finally updates the state.

## Introducing commands and events

A *command* is a request to update the application state. They are typically caused by some user interaction, but they can also be caused programmatically. A command contains data as well as metadata. Its name is phrased using the imperative, as it represents an instruction given to the application.

When the application runs a command this results in one or more *events*. An event is a fact that has happened and that can not be undone. They also contain data and metadata. An event's name is phrased using past tense. Events are published by the write model, so that the read model as well as clients can react to them. Additionally, they are stored in the event store.

## Introducing aggregates

To decide whether running a command is allowed you need an *aggregate*. An aggregate embraces logically related commands and events. It contains the state that is necessary to decide whether to publish events, and thereby update the application state.

When an aggregate is initialized you need to set its *initial state*. It contains any values that make up the aggregate's state when no command has yet been run. By default, commands and events can only be run respectively received by the owner of their aggregate. You may want to change this by configuring authorization.

## Introducing contexts

In a complex application you will have many aggregates. Some of them will be closely related to each other, while others will address completely different parts of your application. To group related aggregates use a *context*.
