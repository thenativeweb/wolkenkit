# Overview

Stateful flows are responsible for implementing complex workflows that have their own state. For that, they react to events by updating their state and performing transitions.

A *stateful flow* is a state machine whose transitions are caused by events. Whenever a stateful flow transitions, it is able to run a reaction, such as sending commands or running tasks. Using their state they have knowledge of their past. This way you can use them to create complex workflows that include conditions and loops, e.g. to notify a user once an invoice has been rejected for the third time in a row.
