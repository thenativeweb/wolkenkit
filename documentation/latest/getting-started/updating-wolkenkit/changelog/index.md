# Changelog

Read what has changed in wolkenkit.

## <%= current.version %>

The following significant changes have been made since wolkenkit `3.1.0`:

- **[BREAKING] Added** support to use multiple identity providers at once
  - In the past, to use authentication, you had to configure an identity provider. Now it is possible to use one or even multiple identity providers at the same time, for example to support different user groups. For details on how to update your current application configuration, see [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).
- **[BREAKING] Changed** how to configure an application's API address
  - The configuration in the `package.json` file for the host and port of a wolkenkit application's API have changed. For details on how to adjust your current application configuration, see [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).
- **Added** transformations for read models
  - If you have accessed a read model in the past, it has been read and delivered as is. The new version of wolkenkit now offers the possibility to modify and filter data while reading by [using transformations](../../../../<%= current.version %>/reference/creating-the-read-model/defining-transformations/).
- **Added** the option to set the ID of file uploads manually
  - When you upload a file to the file storage, an ID is created and returned for that file. Now it is also possible to [set the ID manually](../../../../<%= current.version %>/reference/storing-large-files/adding-files/#setting-the-id-manually).
- **Added** support for EcmaScript 2018 and 2019
  - In previous versions, wolkenkit supported EcmaScript 2017 and earlier. The new version now also contains support for EcmaScript 2018 and 2019, which lets you use the latest language features.
- **Added** code validation when starting an application
  - When starting a wolkenkit application, the CLI now verifies whether all required directories and files exist, and if the files contain and export the required structure.
- **Added** a guide on how to use the latest runtime
  - Although generally not recommended for developers of wolkenkit applications, from time to time it may make sense to use the `latest` runtime, e.g. to evaluate new features that have not yet been officially released. There are a number of pitfalls you have to watch out for when doing this, which is why there is now a guide that explains how to [use the latest runtime](../../../../<%= current.version %>/guides/using-the-latest-runtime/overview/).
- **Improved** the CLI error messages
  - In the past, when something went wrong e.g. while running `wolkenkit start`, you were left with a generic error message. This has been improved, as you now always see the error's details, even if you are not in verbose mode.
- **Fixed** `start` with an empty read model
  - In the past, running `wolkenkit start` led to an error if no read model had been defined. This has been changed, so you can start even if you did not yet define any lists, but only commands.
- **Contributions** by the community
  - [@damienbenon](https://github.com/damienbenon)
  - [@devmcc](https://github.com/devmcc)
  - [@jbeaudoin11](https://github.com/jbeaudoin11)
  - [@lorenzleutgeb](https://github.com/lorenzleutgeb)
  - [@madfist](https://github.com/madfist)
  - [@manfredmjka](https://github.com/manfredmjka)
  - [@schmuto](https://github.com/schmuto)
  - [@steffengottschalk](https://github.com/steffengottschalk)
  - [@timrach](https://github.com/timrach)

For details on how to update to version `<%= current.version %>` see [updating the CLI](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).

## 3.1.0

The following significant changes have been made since wolkenkit `3.0.0`:

- **[BREAKING] Removed** support for wolkenkit 1.x from the CLI
  - Starting with wolkenkit 3.1.0, the CLI no longer supports the runtimes `1.0.0`, `1.0.1`, `1.1.0` and `1.2.0`. If you still need to run an application based on one of these runtime versions, use CLI `3.0.0` or less.
- **Added** `--persist` flag to the CLI
  - In the past setting a shared key and enabling persistent data storage was linked to each other. This has been changed, so that now you can set a shared key to [protect your application](../../../../latest/reference/using-the-cli/protecting-an-application/) without enabling persistence, and there is a new dedicated `--persist` flag to [enable persistence](../../../../latest/reference/using-the-cli/storing-data-permanently/).
- **Added** interactive template selection to the CLI's `init` command
  - When you ran `wolkenkit init` in the past, the default template was always used to initialize your application. Now the CLI provides an interactive selection, which lets you choose which template to use, unless you explicitly specifiy the `--template` flag.
- **Fixed** missing dependency in the client SDK
  - Depending on your client's dependencies, the client SDK could run into an error because of a missing dependency. This has been fixed.
- **Contributions** by the community
  - [@gossi](https://github.com/gossi)
  - [@greeb](https://github.com/greeb)
  - [@maxtilford](https://github.com/maxtilford)

For details on how to update to version `3.1.0` see [updating the CLI](../../../../3.1.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../3.1.0/getting-started/updating-wolkenkit/updating-an-application/).

## 3.0.0

The following significant changes have been made since wolkenkit `2.0.0`:

- **[BREAKING] Rewritten** wolkenkit's file storage from scratch
  - The file storage service of wolkenkit, depot, was [rewritten from scratch](../../../../3.0.0/reference/storing-large-files/accessing-file-storage/). The new code base is of much better quality and introduces a variety of new features. This includes, but is not limited to, an option to remove files as well as an option to manage authorization for them.
- **[BREAKING] Changed** client SDK requires polyfill for Internet Explorer 11
  - In the past the client SDK worked without a polyfill in Internet Explorer 11. This has changed, you now need to [add the `@babel/polyfill` module](../../../../3.0.0/reference/building-a-client/connecting-to-an-application/#installing-the-sdk) if you are targeting Internet Explorer 11.
- **Added** a landing page to the API endpoint
  - When opening the API endpoint in a browser, in the past this resulted in a `404`. This has been changed, as the API endpoint now contains a landing page which improves the user experience when approaching the API manually for the first time.
- **Added** `export` and `import` commands to the CLI
  - To backup and restore your application's data such as the events from the event store, there are now two new CLI commands, [`export` and `import`](../../../../3.0.0/reference/using-the-cli/exporting-and-importing-data/).
- **Added** `upsert` semantics for read models
  - From time to time it is necessary to add an item to a read model, if the item does not exist yet, or update it otherwise. This was inconvenient in the past. Now there is the [`orUpdate` extension](../../../../3.0.0/reference/creating-the-read-model/defining-projections/#adding-or-updating-items) to the `add` command, which allows you to easily fall back to updating an item.
- **Added** `do nothing` semantics for read models
  - Sometimes you may want to add an item to a read model, if it does not exist yet, but do nothing otherwise. This was cumbersome in the past. Now there is the [`orDiscard` extension](../../../../3.0.0/reference/creating-the-read-model/defining-projections/#ensuring-that-items-exist) to the `add` command, which allows you to easily handle this case.
- **Added** support for managing secrets in `package.json`
  - When configuring a wolkenkit application by using environment variables, there was always the problem of how to handle secrets, such as credentials. Now there is the option of [securing environment variables](../../../../3.0.0/reference/configuring-an-application/setting-environment-variables/#securing-environment-variables) to make sure that secrets actually stay secret.
- **Added** a search feature to the wolkenkit documentation
  - In the past you always had to navigate the documentation manually. If you didn't know where to find information on a specific topic, this was cumbersome. Now there is a search feature which allows you to easier navigate the documentation by keywords.
- **Added** a section for contributing to wolkenkit to the documentation
  - In the past, there was no central point of information for contributors. To change this there is now a section on [contributing to wolkenkit](../../../../3.0.0/getting-started/contributing-to-wolkenkit/overview/).
- **Added** the aggregate ID in command and event handlers
  - In the past if you wanted to access the aggregate ID from within a [command handler](../../../../3.0.0/reference/creating-the-write-model/defining-commands/#accessing-the-aggregate-state) or an [event handler](../../../../3.0.0/reference/creating-the-write-model/defining-events/#accessing-the-event-data), there was no direct way to do so. This has now been added, so that you can use the aggregate's `id` property to access the value directly.
- **Updated** wolkenkit to use Node.js `10.13.0`
  - Now that Node.js 10.x has become the new LTS version, wolkenkit runs on Node.js `10.13.0`.
- **Updated** connection handling in application startup
  - When starting a wolkenkit application, the application immediately restarted if it was unable to connect to the infrastructure services, such as the event store. Now, the application retries things before performing a restart. This results in slightly better startup performance and stability.
- **Improved** the performance of command handling
  - In previous versions of wolkenkit commands were always executed one after the other. This could lead to slow behavior, for example when a command was blocked by a long-running action. Now commands are executed in parallel, which dramatically increases their execution speed. Only commands that refer to an identical aggregate are still executed sequentially.
- **Improved** error handling in the CLI `start` and `restart` commands
  - So far, when starting or restarting an application, an error in the application's JavaScript code led to an endless loops, what finally caused the CLI to crash. This has been improved, as the CLI now reports any errors and, after a few retries, gives up.
- **Fixed** updating an aggregate's state
  - When calling `setState`, it was impossible to reset an array to an empty array, as the current state and the new state always got merged. This has been fixed. Now any properties of the new state completely overwrite the appropriate properties of the current state.
- **Fixed** delivery of `Failed` and `Rejected` events
  - In the past when a command failed or was rejected, everyone received the related events. This has been fixed, so that now only the original sender of the command gets notified.
- **Fixed** `transferOwnership` and `authorize` in the read model
  - When transferring the ownership or authorizing a read model item, the client did not get notified correctly, which could lead to missed notifications for some users. This has been fixed.
- **Fixed** handling commands when no read model is defined
  - When sending a command without having a read model defined, the wolkenkit application crashed. While this does probably not happen in production, it happened in the getting started guides. This has been fixed.
- **Contributions** by the community
  - [@cessor](https://github.com/cessor)
  - [@domma](https://github.com/domma)
  - [@go4cas](https://github.com/go4cas)
  - [@marcusstenbeck](https://github.com/marcusstenbeck)
  - [@nelreina](https://github.com/nelreina)
  - [@nicolaisueper](https://github.com/nicolaisueper)
  - [@reneviering](https://github.com/reneviering)
  - [@radumaerza](https://github.com/radumaerza)
  - [@scherermichael](https://github.com/scherermichael)
  - [@schmuto](https://github.com/schmuto)
  - [@zibur](https://github.com/zibur)

For details on how to update to version `3.0.0` see [updating the CLI](../../../../3.0.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../3.0.0/getting-started/updating-wolkenkit/updating-an-application/).

## 2.0.0

The following significant changes have been made since wolkenkit `1.2.0`:

- **[BREAKING] Updated** APIs to use `async` and `await`
  - JavaScript code is often asynchronous. In the past, you had to use callbacks for this. Now wolkenkit supports the new `async` and `await` keywords, which allow you to write asynchronous code much more easily and legibly. This primarily affects defining commands in the write model, handling events in the read model, and reacting to events in flows. Additionally this affects writing command middleware and using services in general. See [updating an application](../../../../2.0.0/getting-started/updating-wolkenkit/updating-an-application/) for details.
- **[BREAKING] Updated** the wording of the APIs for read models and flows
  - In the past, you had to provide a `when` block in read models and in flows. Unfortunately, the distinction was not very clear, and the behavior of these blocks was not consistent. In read models these blocks are now called `projections`, in flows they are called `reactions`. This better describes what is actually happening. See [updating an application](../../../../2.0.0/getting-started/updating-wolkenkit/updating-an-application/) for details.
- **[BREAKING] Removed** `<script>` tag support for the wolkenkit SDK
  - In older wolkenkit versions, you were able to integrate the wolkenkit SDK using either a `<script>` tag in an HTML file, or by using the `require` function. From now on, wolkenkit only supports the second option. While this works on Node.js out of the box, you have to use a bundler such as webpack when building an application for the browser. See [connecting to an application](../../../../2.0.0/reference/building-a-client/connecting-to-an-application/#) for details.
- **Added** support for installing wolkenkit using Vagrant
  - So far, you had to setup Docker and Node.js before installing wolkenkit. Now there are ready-made virtual machines, available for VirtualBox and VMware, that you can run by [installing using Vagrant](../../../../2.0.0/getting-started/installing-wolkenkit/installing-using-vagrant/).
- **Added** the option to set environment variables
  - From time to time you want to configure an application at runtime, not at compile-time, e.g. to provide credentials to different environments. You can now [set environment variables](../../../../2.0.0/reference/configuring-an-application/setting-environment-variables/) using an application's `package.json` file.
- **Added** a curated list of blog posts
  - When getting started with wolkenkit, you may be interested in the thoughts and experiences of other people. That's why there now is a [curated list of blog posts](../../../../2.0.0/media/online-resources/blog-posts/) that deal with wolkenkit, DDD, event-sourcing and CQRS.
- **Added** a curated list of articles
  - When getting started with wolkenkit, you may be interested in what IT magazines think and write about it. That's why there now is a [curated list of articles](../../../../2.0.0/media/online-resources/articles/) that deal with wolkenkit, DDD, event-sourcing and CQRS.
- **Added** a `Local` authentication strategy for testing
  - Additionally to the [OpenID Connect authentication strategy](../../../../2.0.0/reference/building-a-client/using-authentication/#configuring-openid-connect) there is now a [`Local` authentication strategy](../../../../2.0.0/reference/building-a-client/using-authentication/#using-local) that you can use in tests as a custom identity provider. This way you can easily test with multiple identities.
- **Updated** installation guide for Windows
  - So far, you had to use Hyper-V and Docker Machine to setup wolkenkit on Windows. Now you only need Hyper-V which makes installing on Windows much easier. The installation instructions can be found at [installing on Windows](../../../../2.0.0/getting-started/installing-wolkenkit/installing-on-windows/).
- **Updated** `wolkenkit init` to work in non-empty directories
  - It was not yet possible to run the `wolkenkit init` command in a non-empty directory, as this could lead to existing files being overwritten accidentally. Now there is the `--force` flag to disable this check and [overwrite any existing files](../../../../2.0.0/reference/initializing-an-application/using-a-template/#overwriting-existing-files).
- **Improved** compatibility with Internet Explorer 11
  - The wolkenkit SDK now supports Internet Explorer 11 without requiring additional polyfills.
- **Fixed** OpenID Connect strict mode
  - The [OpenID Connect strict mode](../../../../2.0.0/reference/building-a-client/using-authentication/#configuring-openid-connect) didn't work, because there was a problem in verifying the JWT's nonce. This has been fixed.
- **Fixed** `transferOwnership` and `authorize` commands
  - So far, it was possible to use the commands `transferOwnership` and `authorize` as constructor commands, i.e. to create new aggregates, although this didn't make sense. This has been fixed.
- **Fixed** replaying incompatible aggregates
  - If you tried to replay an existing aggregate, but with the wrong aggregate type, the application crashed in an uncontrolled way. This has been fixed.
- **Contributions** by the community
  - [@claudiobianco](https://github.com/claudiobianco)
  - [@colorizedmind](https://github.com/colorizedmind)
  - [@lorenzleutgeb](https://github.com/lorenzleutgeb)
  - [@marcusstenbeck](https://github.com/marcusstenbeck)
  - [@reneviering](https://github.com/reneviering)
  - [@scherermichael](https://github.com/scherermichael)
  - [@schmuto](https://github.com/schmuto)

For details on how to update to version `2.0.0` see [updating the CLI](../../../../2.0.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../2.0.0/getting-started/updating-wolkenkit/updating-an-application/).

## 1.2.0

The following significant changes have been made since wolkenkit `1.1.0`:

- **Updated** wolkenkit to use Node.js `8.9.1`
  - Now that Node.js 8.x has become the new LTS version, wolkenkit now runs on Node.js `8.9.1`.
- **Rewritten** the wolkenkit CLI using Node.js
  - The wolkenkit CLI was rewritten using Node.js, so you can now install it using npm, either globally or into the local context of your application.
- **Fixed** a bug in detecting expired OpenID Connect tokens in the wolkenkit client SDK
  - When using the OpenID Connect authentication strategy, expired tokens were sometimes mistakenly regarded as valid by the wolkenkit client SDK. This has been fixed.
- **Contributions** by the community
  - [@reneviering](https://github.com/reneviering)
  - [@scherermichael](https://github.com/scherermichael)

For details on how to update to version `1.2.0` see [updating the CLI](../../../../1.2.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../1.2.0/getting-started/updating-wolkenkit/updating-an-application/).

## 1.1.0

The following significant changes have been made since wolkenkit `1.0.1`:

- **Added** support for wolkenkit on Windows
  - wolkenkit now runs on Windows 10 with Hyper-V and Docker Machine. The installation instructions can be found at [installing on Windows](../../installing-wolkenkit/installing-on-windows/).
  - See [thenativeweb/wolkenkit#3](https://github.com/thenativeweb/wolkenkit/issues/3) for details.
- **Updated** PostgreSQL to `9.6.4`
  - There was a [security issue](https://www.postgresql.org/about/news/1772/) in PostgreSQL `9.6.2`. With wolkenkit `1.1.0` PostgreSQL has been updated to `9.6.4`.
- **Fixed** compatibility with Docker `17.05` and above
  - With CLI `1.0.2`, wolkenkit is compatible with Docker backends running on Docker `17.05` and above.
  - See [thenativeweb/wolkenkit#5](https://github.com/thenativeweb/wolkenkit/issues/5) for details.
- **Fixed** invalid read query handling in HTTP API
  - There was a bug that caused invalid read queries to bring down the HTTP API. With wolkenkit `1.1.0` this has been fixed.
- **Fixed** a critical security issue in authorizing commands
  - In certain circumstances wolkenkit failed to authorize commands correctly. This has been fixed.
- **Contributions** by the community
  - [@appelgriebsch](https://github.com/appelgriebsch)
  - [@coderbyheart](https://github.com/coderbyheart)
  - [@czosel](https://github.com/czosel)
  - [@Pandaros](https://github.com/Pandaros)
  - [@reneviering](https://github.com/reneviering)

For details on how to update to version `1.1.0` see [updating the CLI](../../../../1.1.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../1.1.0/getting-started/updating-wolkenkit/updating-an-application/).

## 1.0.1

The following significant changes have been made since wolkenkit `1.0.0`:

- **Fixed** wolkenkit init
  - There was an error in the CLI that occured while initializing new wolkenkit applications. wolkenkit CLI 1.0.1 fixes this issue.
  - See [thenativeweb/wolkenkit#1](https://github.com/thenativeweb/wolkenkit/issues/1) for details.
- **Contributions** by the community
  - [@MuwuM](https://github.com/MuwuM)

For details on how to update to version `1.0.1` see [updating the CLI](../../../../1.0.1/getting-started/updating-wolkenkit/updating-the-cli/).
