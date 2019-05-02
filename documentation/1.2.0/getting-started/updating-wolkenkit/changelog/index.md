# Changelog

Read what has changed in wolkenkit.

## <%= current.version %>

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

For details on how to update to version `<%= current.version %>` see [updating the CLI](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).

## 1.1.0

The following significant changes have been made since wolkenkit `1.0.1`:

- **Added** support for wolkenkit on Windows
  - wolkenkit now runs on Windows 10 with Hyper-V and Docker Machine. The installation instructions can be found at [Installing on Windows](../../installing-wolkenkit/installing-on-windows/).
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
