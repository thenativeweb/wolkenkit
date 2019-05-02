# Architecture

As mentioned in [data flow](../data-flow/), in a wolkenkit application, you typically have a client with a task-based UI. This may be a static web site, a mobile application, or anything else. Everytime the user performs a task, the client sends one or more commands to wolkenkit.

In wolkenkit, there are multiple servers that make up an application. The public facing server is called *broker*, since it acts as the gateway to a wolkenkit application and handles commands, events and queries. This represents [CQRS](../why-wolkenkit/#scaling-with-confidence) which separates writing (sending commands) from reading (subscribing to events and querying read models):

![Architecture: From client to broker](/architecture/architecture-from-client-to-broker.svg)

When the broker receives a command, it forwards the command to a message queue, the so-called *command bus*. Once this has been done, the broker acknowledges to the client that the command was received and accepted. Then another server, whose responsibility is the write model, fetches the previously accepted commands from the command bus to handle them. This server is called *core*.

To handle a command, the core replays the needed aggregate from the *event store*, and hands over the command as well as the replayed aggregate to the command handler you provided as part of your application's [write model](../../../reference/creating-the-write-model/overview/) that was modeled using [domain-driven design (DDD)](../why-wolkenkit/#empowering-interdisciplinary-teams). As a result of the command handler, one or more events get published.

These events are written to the *event store* using [event sourcing](../why-wolkenkit/#learning-from-your-past), and then sent back to the broker via another message queue called *event bus*. The broker updates any lists that are stored inside the *list store* using the projections you defined in your application's [read model](../../../reference/creating-the-read-model/overview/), and finally pushes the events to the client:

![Architecture: Client, broker and core](/architecture/architecture-client-broker-and-core.svg)

Complementary to the basic processing of commands and events described so far, there are also additional services for advanced use cases, e.g. to run workflows, store large files and authenticate users.

To run workflows, the core not only sends published events to the broker, but also to another server called *flows*. For that, it uses a dedicated message queue called *flow bus*. Whenever the flow server receives an event, it runs reactions for that event based on your application's [stateless](../../../reference/creating-stateless-flows/overview/) and [stateful flows](../../../reference/creating-stateful-flows/overview/).

For storing large files, wolkenkit provides a file storage service called *depot*. It provides its own API and client SDK to [store and retrieve files](../../../reference/storing-large-files/accessing-file-storage/). Hence, it is independent of the broker and the core, and the client must address depot separately.

To [authenticate users](../../../reference/configuring-an-application/enabling-authentication/) wolkenkit uses OpenID Connect, which means that it relies on an external identity provider, such as [Auth0](https://auth0.com/) or [Keycloak](https://www.keycloak.org/).

All the aforementioned application servers (broker, core and flows) and infrastructure services (event store, list store, depot and the various message queues) run as individual processes, which makes any wolkenkit application a distributed system by default:

![Architecture: Distributed by default](/architecture/architecture-distributed-by-default.svg)

## Running on Docker

For all processes of a wolkenkit application there are [Docker base images](https://hub.docker.com/r/thenativeweb/). When starting an application [using the CLI](../../../reference/using-the-cli/controlling-the-lifecycle/), these base images are taken as the foundation to build custom Docker images specific to your application. These application-specific images then contain your application's code and configuration.

Finally, the images are run as containers that get connected to each other by using a virtual network. Since the application containers (broker, core and flows) run your application's code, they may need a few npm modules. To avoid having to install them to every single application container, they are only installed once to a shared Docker container named *node-modules* that is then used as a volume by the other containers.

The publicly accessible ports of all the containers are exposed using a reverse proxy, which runs in a Docker container named *proxy*.

## Finding the code

The code for wolkenkit is located in repositories on [GitHub](https://github.com/thenativeweb). On [Docker Hub](https://hub.docker.com/r/thenativeweb/), there is an automated build for each repository that is responsible for building the respective Docker image:

| Component | Repository | Docker image |
|-|-|-|
| CLI | [wolkenkit](https://github.com/thenativeweb/wolkenkit) | n/a |
| Client SDK | [wolkenkit-client-js](https://github.com/thenativeweb/wolkenkit-client-js) | n/a |
| Depot client SDK | [wolkenkit-depot-client-js](https://github.com/thenativeweb/wolkenkit-depot-client-js) | n/a |
| Broker | [wolkenkit-broker](https://github.com/thenativeweb/wolkenkit-broker) | [wolkenkit-broker](https://hub.docker.com/r/thenativeweb/wolkenkit-broker/) |
| Core | [wolkenkit-core](https://github.com/thenativeweb/wolkenkit-core) | [wolkenkit-core](https://hub.docker.com/r/thenativeweb/wolkenkit-core/) |
| Flows | [wolkenkit-flows](https://github.com/thenativeweb/wolkenkit-flows) | [wolkenkit-flows](https://hub.docker.com/r/thenativeweb/wolkenkit-flows/) |
| Event store | [wolkenkit-box-postgres](https://github.com/thenativeweb/wolkenkit-box-postgres) | [wolkenkit-postgres](https://hub.docker.com/r/thenativeweb/wolkenkit-postgres/) |
| List store | [wolkenkit-box-mongodb](https://github.com/thenativeweb/wolkenkit-box-mongodb) | [wolkenkit-mongodb](https://hub.docker.com/r/thenativeweb/wolkenkit-mongodb/) |
| Depot | [wolkenkit-depot](https://github.com/thenativeweb/wolkenkit-depot) | [wolkenkit-depot](https://hub.docker.com/r/thenativeweb/wolkenkit-depot/) |
| Message queue | [wolkenkit-box-rabbitmq](https://github.com/thenativeweb/wolkenkit-box-rabbitmq) | [wolkenkit-rabbitmq](https://hub.docker.com/r/thenativeweb/wolkenkit-rabbitmq/) |
| Shared npm modules | [wolkenkit-box-node-modules](https://github.com/thenativeweb/wolkenkit-box-node-modules) | [wolkenkit-node-modules](https://hub.docker.com/r/thenativeweb/wolkenkit-node-modules/) |
| Proxy | [wolkenkit-proxy](https://github.com/thenativeweb/wolkenkit-proxy) | [wolkenkit-proxy](https://hub.docker.com/r/thenativeweb/wolkenkit-proxy/) |
