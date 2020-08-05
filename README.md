# wolkenkit

wolkenkit is a CQRS and event-sourcing framework based on Node.js. It empowers you to build and run scalable distributed web and cloud services that process and store streams of domain events. It supports JavaScript and TypeScript, and is available under an open-source license. Additionally, there are also enterprise add-ons. Since it works especially well in conjunction with domain-driven design (DDD), wolkenkit is the perfect backend framework to shape, build, and run web and cloud APIs.

**BEWARE: This README.md refers to the wolkenkit 4.0 community technology preview (CTP) 5. If you are looking for the latest stable release of wolkenkit, see the [wolkenkit documentation](https://docs.wolkenkit.io/).**

![wolkenkit](assets/logo.png "wolkenkit")

## Status

| Category         | Status                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Version          | [![npm](https://img.shields.io/npm/v/wolkenkit)](https://www.npmjs.com/package/wolkenkit)                                                      |
| Dependencies     | ![David](https://img.shields.io/david/thenativeweb/wolkenkit)                                                                                  |
| Dev dependencies | ![David](https://img.shields.io/david/dev/thenativeweb/wolkenkit)                                                                              |
| Build            | ![GitHub Actions](https://github.com/thenativeweb/wolkenkit/workflows/Release/badge.svg?branch=master) |
| License          | ![GitHub](https://img.shields.io/github/license/thenativeweb/wolkenkit)                                                                        |

## Quick start

First you have to initialize a new application. For this, execute the following command and select a template and a language. The application is then created in a new subdirectory:

```shell
$ npx wolkenkit@4.0.0-ctp.5 init <name>
```

Next, you need to install the application dependencies. To do this, change to the application directory and run the following command:

```shell
$ npm install
```

Finally, from within the application directory, run the application in local development mode by executing the following command:

```shell
$ npx wolkenkit dev
```

*Please note that the local development mode processes all data in-memory only, so any data will be lost when the application is closed.*

### Sending commands, receiving domain events, and querying views

To send commands or receive domain events, the current version offers an HTTP and a GraphQL interface.

#### Using the HTTP interface

wolkenkit provides two primary endpoints in local development mode:

- `http://localhost:3000/command/v2/:contextName/:aggregateName/:commandName` submits commands for new aggregates
- `http://localhost:3000/command/v2/:contextName/:aggregateName/:aggregateId/:commandName` submits commands for existing aggregates
- `http://localhost:3000/domain-events/v2` subscribes to domain events

Additionally, the following secondary endpoints are available as well:

- `http://localhost:3000/command/v2/cancel` cancels a submitted, but not yet handled command
- `http://localhost:3000/command/v2/description` fetches a JSON description of all available commands
- `http://localhost:3000/domain-events/v2/description` fetches a JSON description of all available domain events
- `http://localhost:3000/open-api/v2` provides an OpenAPI description of the HTTP interface
- `http://localhost:3001/health/v2` fetches health data

##### Sending commands

To send a command, send a `POST` request with the following JSON data structure in the body to the command endpoint of the runtime. Of course, the specific names of the context, the aggregate and the command itself, as well as the aggregate id and the command's data depend on the domain you have modeled:

```json
{
  "text": "Hello, world!"
}
```

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"text":"Hello, world!"}' \
    http://localhost:3000/command/v2/communication/message/send
```

If you want to address an existing aggregate, you also have to provide the aggregate's id:

```shell
$ curl \
    -i \
    -X POST \
    -H 'content-type: application/json' \
    -d '{}' \
    http://localhost:3000/command/v2/communication/message/d2edbbf7-a515-4b66-9567-dd931f1690d3/like
```

###### Cancelling a command

To cancel a command, send a `POST` request with the following JSON data structure in the body to the cancel endpoint of the runtime. Of course, the specific names of the context, the aggregate and the command itself, as well as the aggregate id and the command's data depend on the domain you have modeled:

```json
{
  "contentIdentifier": { "name": "communication" },
  "aggregateIdentifier": { "name": "message", "id": "d2edbbf7-a515-4b66-9567-dd931f1690d3" },
  "name": "send",
  "id": "<command-id>"
}
```

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    -X POST \
    -H 'content-type: application/json' \
    -d '<json>' \
    http://localhost:3000/command/v2/cancel
```

*Please note that you can cancel commands only as long as they are not yet being processed by the domain.*

##### Subscribing to domain events

To receive domain events, send a `GET` request to the domain events endpoint of the runtime. The response is a stream of newline-separated JSON objects, using `application/x-ndjson` as its content-type. From time to time, a `heartbeat` will be sent by the server as well, which you may want to filter.

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    http://localhost:3000/domain-events/v2
```

##### Querying a view

To query a view, send a `GET` request to the views endpoint of the runtime. The response is a stream of newline separated JSON objects, using `application/x-ndjson` as its content-type. This response stream does _not_ contain heartbeats and ends as soon as the last item is streamed.

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    http://localhost:3000/views/v2/messages/all
```

#### Using the GraphQL interface

wolkenkit provides a GraphQL endpoint under the following address:

- `http://localhost:3000/graphql/v2`

You can use it to submit commands and subscribe to domain events, however cancelling commands is currently not supported. If you point your browser to this endpoint, you will get an interactive GraphQL playground.

##### Sending commands

To send a command, send a mutation with the following data structure to the GraphQL endpoint of the runtime. Of course, the specific names of the context, the aggregate and the command itself, as well as the aggregate id and the command's data depend on the domain you have modeled:

```
mutation {
  command {
    communication_message_send(aggregateIdentifier: { id: "d2edbbf7-a515-4b66-9567-dd931f1690d3" }, data: { text: "Hello, world!" }) {
      id,
      aggregateIdentifier {
        id
      }
    }
  }
}
```

###### Cancelling a command

To cancel a command, send a mutation with the following data structure to the GraphQL endpoint of the runtime. Of course, the specific names of the context, the aggregate and the command itself, as well as the aggregate id and the command's data depend on the domain you have modeled:

```
mutation {
  cancel(commandIdentifier: {
    contextIdentifier: { name: "communication" },
    aggregateIdentifier: { name: "message", id: "d2edbbf7-a515-4b66-9567-dd931f1690d3" },
    name: "send",
    id: "0a2d394c-2873-4643-84fd-dbcc43d80c5b"
  }) {
    success
  }
}
```

*Please note that you can cancel commands only as long as they are not yet being processed by the domain.*

##### Subscribing to domain events

To receive domain events, send a subscription to the GraphQL endpoint of the runtime. The response is a stream of objects, where the domain events' `data` has been stringified:

```
subscription {
  domainEvents {
    contextIdentifier { name },
    aggregateIdentifier { name, id },
    name,
    id,
    data
  }
}
```

###### Qerying a view

To query a view, send a query to the GraphQL endpoint of the runtime:

```
query {
  messages {
    all {
      id
      timestamp
      text
      likes
    }
  }
}
```

### Managing files

wolkenkit provides a file storage service that acts as a facade to a storage backend such as S3 or the local file system. It can be addressed using an HTTP API.

#### Using the HTTP interface

wolkenkit provides three primary endpoints in local development mode:

- `http://localhost:3000/files/v2/add-file` adds a file
- `http://localhost:3000/files/v2/file/:id` gets a file
- `http://localhost:3000/files/v2/remove-file` removes a file

##### Adding files

To add a file, send a `POST` request with the file to be stored in its body to the add-file endpoint of the runtime. Send the file's id, its name and its content type using the `x-id`, `x-name` and `content-type` headers.

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    -X POST \
    -H 'x-id: 03edebb0-7a36-4902-a082-ef979982a12c' \
    -H 'x-name: hello.txt' \
    -H 'content-type: text/plain' \
    -d 'Hello, world!' \
    http://localhost:3000/files/v2/add-file
```

##### Getting files

To get a file, send a `GET` request with the file id as part of the URL to the file endpoint of the runtime.

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    http://localhost:3000/files/v2/file/03edebb0-7a36-4902-a082-ef979982a12c
```

You will get the file's id, name and its content-type in the `x-id`, `x-name` and `content-type` headers.

##### Removing files

To remove a file, send a `POST` request with the following JSON structure to the remove-file endpoint of the runtime:

```json
{
  "id": "03edebb0-7a36-4902-a082-ef979982a12c"
}
```

A sample call to `curl` might look like this:

```shell
$ curl \
    -i \
    -X POST \
    -H 'content-type: application/json' \
    -d '{"id":"03edebb0-7a36-4902-a082-ef979982a12c"}' \
    http://localhost:3000/files/v2/remove-file
```

### Authenticating a user

For authentication wolkenkit relies on OpenID Connect, so to use authentication you have to set up an external identity provider such as [Auth0](https://auth0.com/) or [Keycloak](https://www.keycloak.org/).

Configure it to use the *implicit flow*, copy its certificate to your application directory, and set the `--identity-provider-issuer` and `--identity-provider-certificate` flags when running `npx wolkenkit dev`. For details, see the CLI's integrated help. Please make sure that your identity provider issues token using the `RS256` algorithm, otherwise wolkenkit won't be able to decode and verify the token.

If a user tries to authenticate with an invalid or expired token, they will receive a `401`. If the user doesn't send a token at all, they will be given a token that identifies them as `anonymous`. By default, you can not differentiate between multiple anonymous users. If you need this, set the `x-anonymous-id` header in the client accordingly.

### Packaging the application into a Docker image

To package the application into a Docker image, change to the application directory and run the following command. Assign a custom tag to name the Docker image:

```shell
$ docker build -t <tag> .
```

Then you can push the created Docker image into a registry of your choice, for example to use it in Kubernetes.

### Run the application with `docker-compose`

Once you have built the Docker image, you can use `docker-compose` to run the application. The application directory contains a subdirectory named `deployment/docker-compose`, which contains ready-made scripts for various scenarios.

Basically, you can choose between the single-process runtime and the microservice runtime. While the former runs the entire application in a single process, the latter splits the different parts of the application into different processes, each of which you can then run on a separate machine.

Using `docker-compose` also allows you to connect your own databases and infrastructure components. For details see the respective scripts.

### Configuring data stores

wolkenkit uses a number of stores to run your application. In the local development mode, these stores are all run in-memory, but if you run the application using Docker, you will probably want to use persistent data stores. The following databases are supported for the domain event store, the lock store, and the priority queue store:

- In-memory
- MariaDB
- MongoDB
- MySQL
- PostgreSQL
- Redis (only for the lock store)
- SQL Server

*Please note that MongoDB must be at least version 4.2, and that you need to run it as a replica set (a single node cluster is fine).*

For details on how to configure the databases, please have a look at the source code. This will be explained in more detail in the final version of the documentation.

### Getting help

Please remember that this version is a community technology preview (CTP) of the upcoming wolkenkit 4.0. Therefore it is possible that not all provided features work as expected or that some features are missing completely.

**BEWARE: Do not use the CTP for production use, it's for getting a first impression of and evaluating the upcoming wolkenkit 4.0.**

If you experience any difficulties, please [create an issue](https://github.com/thenativeweb/wolkenkit/issues/new/choose) and provide any steps required to reproduce the issue, as well as the expected and the actual result. Additionally provide the versions of wolkenkit and Docker, and the type and architecture of the operating system you are using.

Ideally you can also include a [short but complete code sample](http://sscce.org/) to reproduce the issue. Anyway, depending on the issue, this may not always be possible.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter):

```shell
$ npx roboter
```

## Publishing an internal version

While working on wolkenkit itself, it is sometimes necessary to publish an internal version to npm, e.g. to be able to install wolkenkit from the registry. To publish an internal version run the following commands:

```shell
$ npx roboter build && npm version 4.0.0-internal.<id> && npm publish --tag internal && git push && git push --tags
```
