# wolkenkit

wolkenkit is an open-source CQRS and event-sourcing framework for JavaScript and Node.js.

**BEWARE: This README.md refers to the wolkenkit 4.0 community technology preview (CTP) 1. If you are looking for the latest stable release of wolkenkit, see the [wolkenkit documentation](https://docs.wolkenkit.io/).**

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
$ npx wolkenkit@4.0.0-ctp.1 init <name>
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

### Getting help

Please remember that this version is a community technology preview (CTP) of the upcoming wolkenkit 4.0. Therefore it is possible that not all provided features work as expected or that some features are missing completely.

**BEWARE: Do not use the CTP for productive use, but only for getting a first impression of and evaluating the upcoming wolkenkit 4.0.**

If you experience any difficulties, please [create an issue](https://github.com/thenativeweb/wolkenkit/issues/new/choose) and provide any steps required to reproduce the issue, as well as the expected and the actual result. Additionally provide the versions of wolkenkit and Docker, and the type and architecture of the operating system you are using.

Ideally you can also include a [short but complete code sample](http://sscce.org/) to reproduce the issue. Anyway, depending on the issue, this may not always be possible.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```
