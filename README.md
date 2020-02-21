# wolkenkit

wolkenkit is an open-source CQRS and event-sourcing framework for JavaScript and Node.js.

**BEWARE: This is the README.md for the upcoming wolkenkit 4.0 version, which is currently only available as a preview. If you are looking for the latest stable release of wolkenkit, see the [wolkenkit documentation](https://docs.wolkenkit.io/).**

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

To initialize a new application, run the following command:

```shell
$ npx wolkenkit@4.0.0-internal.14 init <name>
```

Then, change into the newly created application directory, and install its dependencies:

```shell
$ npm install
```

Finally, from within the application directory, run the application in local development mode:

```shell
$ npx wolkenkit dev
```

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```
