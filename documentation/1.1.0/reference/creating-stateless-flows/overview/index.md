# Overview

Stateless flows are responsible for implementing simple workflows. For that, they react to events by sending commands or running tasks.

You can compare a *stateless flow* to an *if this then that* rule that handles events. They are typically used to update the application state across multiple aggregates, e.g. to notify a user once an invoice has been issued, supposed that *user* and *invoice* are separate aggregates. You may also use them to interact with third-party applications, e.g. to send a text message or a mail.
