# wolkenkit

wolkenkit is an open-source CQRS and event-sourcing framework for JavaScript and Node.js that perfectly matches DDD.

![wolkenkit](images/logo.png "wolkenkit")

> wolkenkit is a CQRS and event-sourcing framework for JavaScript and Node.js. wolkenkit uses an event-driven model based on DDD to setup an API for your business in no time. This way, wolkenkit bridges the language gap between your domain and technology.

## Table of contents

-   [Installation](#installation)

-   [Quick start](#quick-start)

-   [Sample applications](#sample-applications)

-   [Getting help](#getting-help)

    -   [Reporting an issue](#reporting-an-issue)
    -   [Asking a question](#asking-a-question)
    -   [Getting support](#getting-support)

-   [Finding the code](#finding-the-code)

-   [Running the build](#running-the-build)

-   [FAQ](#faq)

    -   [Why do I get an Error loading extension section V3_ca message when running the story tests?](#why-do-i-get-an-error-loading-extension-section-v3_ca-message-when-running-the-story-tests)

-   [License](#license)

## Installation

```shell
$ npm install -g wolkenkit
```

## Quick start

First, have a look at the [documentation](https://docs.wolkenkit.io), and its getting started [guides](https://docs.wolkenkit.io/latest/guides/creating-your-first-application/setting-the-objective/). You should also learn about [why to use wolkenkit](https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/why-wolkenkit/).

There is a variety of [blog posts](https://docs.wolkenkit.io/latest/media/online-resources/blog-posts/) and [articles](https://docs.wolkenkit.io/latest/media/online-resources/articles/) that help you get started. Also, you are welcome to [join us on Slack](http://slackin.wolkenkit.io), and have a look at the [previously asked questions at Stack Overflow](http://stackoverflow.com/questions/tagged/wolkenkit).

If you are curious on what's next, have a look at the [roadmap](roadmap.md).

## Sample applications

There are a number of sample applications available:

-   [wolkenkit-boards](https://github.com/thenativeweb/wolkenkit-boards) is a team collaboration application.
-   [wolkenkit-geocaching](https://github.com/revrng/wolkenkit-geocaching) is a geocaching application.
-   [wolkenkit-nevercompletedgame](https://github.com/thenativeweb/wolkenkit-nevercompletedgame) is a mystery game.
-   [wolkenkit-template-chat](https://github.com/thenativeweb/wolkenkit-template-chat) is a simple messaging application.
-   [wolkenkit-todomvc](https://github.com/thenativeweb/wolkenkit-todomvc) is a todo list application.

## Getting help

If you need any help with wolkenkit, consider the following options. Also, you are welcome to [join us on Slack](http://slackin.wolkenkit.io).

### Reporting an issue

If you have found an issue please first have a look at the [previously reported issues](https://github.com/thenativeweb/wolkenkit/issues) to verify whether the issue has already been reported.

If not, [report a new issue](https://github.com/thenativeweb/wolkenkit/issues/new/choose) and provide any steps required to reproduce the issue, as well as the expected and the actual result. Additionally provide the versions of wolkenkit and Docker, and the type and architecture of the operating system you are using.

Ideally you can also include a [short but complete code sample](http://www.yoda.arachsys.com/csharp/complete.html) to reproduce the issue. Anyway, depending on the issue, we know that this is not always possible.

Although wolkenkit is developed using multiple repositories, please report any issues to the [thenativeweb/wolkenkit](https://github.com/thenativeweb/wolkenkit/issues) repository, as this is the primary contact point.

### Asking a question

If you want to ask a question please first have a look at the [previously asked questions at Stack Overflow](http://stackoverflow.com/questions/tagged/wolkenkit) to verify whether your question has already been asked.

If not, [ask a new question](http://stackoverflow.com/questions/ask) and tag it with `wolkenkit`.

### Getting support

If you need help by the original authors of wolkenkit, e.g. to address issues specific to your environment or project, you may be interested in a paid support plan. For that, feel free to [contact the native web](mailto:hello@thenativeweb.io).

## Finding the code

Since wolkenkit is a distributed application, its code is spread across various repositories. For an overview of the architecture and a list of the repositories, see the [wolkenkit documentation](https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/architecture/).

Additionally, you may want to have a look at these repositories that contain the most important supporting modules:

-   [wolkenkit-eventstore](https://github.com/thenativeweb/wolkenkit-eventstore)
-   [commands-events](https://github.com/thenativeweb/commands-events)
-   [tailwind](https://github.com/thenativeweb/tailwind)

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```

Additionally to the unit tests, there are so-called _story tests_. To run them, use the following command:

```shell
$ npx roboter test-stories
```

## FAQ

### Why do I get an _Error loading extension section V3_ca_ message when running the story tests?

If you get the error _Error loading extension section V3_ca_ when running the story tests, you have to edit your local OpenSSL configuration. You can find the configuration at `/private/etc/ssl/openssl.cnf`. In this file you have to add the following lines:

    [ v3_ca ]
    basicConstraints = critical,CA:TRUE

## License

Copyright (c) 2014-2019 the native web.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see [GNU Licenses](http://www.gnu.org/licenses/).
