# Changelog

Read what has changed in wolkenkit.

## <%= current.version %>

The following significant changes have been made since wolkenkit `1.2.0`:

- **[BREAKING] Updated** APIs to use `async` and `await`
  - JavaScript code is often asynchronous. In the past, you had to use callbacks for this. Now wolkenkit supports the new `async` and `await` keywords, which allow you to write asynchronous code much more easily and legibly. This primarily affects defining commands in the write model, handling events in the read model, and reacting to events in flows. Additionally this affects writing command middleware and using services in general. See [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/) for details.
- **[BREAKING] Updated** the wording of the APIs for read models and flows
  - In the past, you had to provide a `when` block in read models and in flows. Unfortunately, the distinction was not very clear, and the behavior of these blocks was not consistent. In read models these blocks are now called `projections`, in flows they are called `reactions`. This better describes what is actually happening. See [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/) for details.
- **[BREAKING] Removed** `<script>` tag support for the wolkenkit SDK
  - In older wolkenkit versions, you were able to integrate the wolkenkit SDK using either a `<script>` tag in an HTML file, or by using the `require` function. From now on, wolkenkit only supports the second option. While this works on Node.js out of the box, you have to use a bundler such as webpack when building an application for the browser. See [connecting to an application](../../../../<%= current.version %>/reference/building-a-client/connecting-to-an-application/#) for details.
- **Added** support for installing wolkenkit using Vagrant
  - So far, you had to setup Docker and Node.js before installing wolkenkit. Now there are ready-made virtual machines, available for VirtualBox and VMware, that you can run by [installing using Vagrant](../../../../<%= current.version %>/getting-started/installing-wolkenkit/installing-using-vagrant/).
- **Added** the option to set environment variables
  - From time to time you want to configure an application at runtime, not at compile-time, e.g. to provide credentials to different environments. You can now [set environment variables](../../../../<%= current.version %>/reference/configuring-an-application/setting-environment-variables/) using an application's `package.json` file.
- **Added** a curated list of blog posts
  - When getting started with wolkenkit, you may be interested in the thoughts and experiences of other people. That's why there now is a [curated list of blog posts](../../../../<%= current.version %>/media/online-resources/blog-posts/) that deal with wolkenkit, DDD, event-sourcing and CQRS.
- **Added** a curated list of articles
  - When getting started with wolkenkit, you may be interested in what IT magazines think and write about it. That's why there now is a [curated list of articles](../../../../<%= current.version %>/media/online-resources/articles/) that deal with wolkenkit, DDD, event-sourcing and CQRS.
- **Added** a `Local` authentication strategy for testing
  - Additionally to the [OpenID Connect authentication strategy](../../../../<%= current.version %>/reference/building-a-client/using-authentication/#configuring-openid-connect) there is now a [`Local` authentication strategy](../../../../<%= current.version %>/reference/building-a-client/using-authentication/#using-local) that you can use in tests as a custom identity provider. This way you can easily test with multiple identities.
- **Updated** installation guide for Windows
  - So far, you had to use Hyper-V and Docker Machine to setup wolkenkit on Windows. Now you only need Hyper-V which makes installing on Windows much easier. The installation instructions can be found at [installing on Windows](../../../../<%= current.version %>/getting-started/installing-wolkenkit/installing-on-windows/).
- **Updated** `wolkenkit init` to work in non-empty directories
  - It was not yet possible to run the `wolkenkit init` command in a non-empty directory, as this could lead to existing files being overwritten accidentally. Now there is the `--force` flag to disable this check and [overwrite any existing files](../../../../<%= current.version %>/reference/initializing-an-application/using-a-template/#overwriting-existing-files).
- **Improved** compatibility with Internet Explorer 11
  - The wolkenkit SDK now supports Internet Explorer 11 without requiring additional polyfills.
- **Fixed** OpenID Connect strict mode
  - The [OpenID Connect strict mode](../../../../<%= current.version %>/reference/building-a-client/using-authentication/#configuring-openid-connect) didn't work, because there was a problem in verifying the JWT's nonce. This has been fixed.
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

For details on how to update to version `<%= current.version %>` see [updating the CLI](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).

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
