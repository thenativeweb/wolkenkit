# Changelog

Read what has changed in wolkenkit.

## <%= current.version %>

The following significant changes have been made since wolkenkit `1.0.1`:

- **Added** support for wolkenkit on Windows
  - wolkenkit now runs on Windows 10 with Hyper-V and Docker Machine. The installation instructions can be found at [Installing on Windows](../../installing-wolkenkit/installing-on-windows/).
  - See [thenativeweb/wolkenkit#3](https://github.com/thenativeweb/wolkenkit/issues/3) for details.
- **Updated** PostgreSQL to `9.6.4`
  - There was a [security issue](https://www.postgresql.org/about/news/1772/) in PostgreSQL `9.6.2`. With wolkenkit <%= current.version %> PostgreSQL has been updated to `9.6.4`.
- **Fixed** compatibility with Docker `17.05` and above
  - With CLI `1.0.2`, wolkenkit is compatible with Docker backends running on Docker `17.05` and above.
  - See [thenativeweb/wolkenkit#5](https://github.com/thenativeweb/wolkenkit/issues/5) for details.
- **Fixed** invalid read query handling in HTTP API
  - There was a bug that caused invalid read queries to bring down the HTTP API. With wolkenkit <%= current.version %> this has been fixed.
- **Fixed** a critical security issue in authorizing commands
  - In certain circumstances wolkenkit failed to authorize commands correctly. This has been fixed.
- **Contributions** by the community
  - [@appelgriebsch](https://github.com/appelgriebsch)
  - [@coderbyheart](https://github.com/coderbyheart)
  - [@czosel](https://github.com/czosel)
  - [@Pandaros](https://github.com/Pandaros)
  - [@reneviering](https://github.com/reneviering)

For details on how to update to version `<%= current.version %>` see [updating the CLI](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).

## 1.0.1

The following significant changes have been made since wolkenkit `1.0.0`:

- **Fixed** wolkenkit init
  - There was an error in the CLI that occured while initializing new wolkenkit applications. wolkenkit CLI 1.0.1 fixes this issue.
  - See [thenativeweb/wolkenkit#1](https://github.com/thenativeweb/wolkenkit/issues/1) for details.
- **Contributions** by the community
  - [@MuwuM](https://github.com/MuwuM)

For details on how to update to version `1.0.1` see [updating the CLI](../../../../1.0.1/getting-started/updating-wolkenkit/updating-the-cli/).
