# Changelog

Read what has changed in wolkenkit.

## <%= current.version %>

The following significant changes have been made since wolkenkit `0.11.0`:

- **Improved** browser compatibility
  - The wolkenkit SDK now uses web sockets to communicate with wolkenkit applications. It now runs on all major browsers, such as Chrome, Firefox, Safari, Opera, Edge, and Internet Explorer.
- **Improved** authentication strategy
  - The wolkenkit SDK now includes a generic [OpenID Connect compliant authentication strategy](../../../../<%= current.version %>/reference/building-a-client/using-authentication/).
  - This replaces the previous authentication plugin that was specific to Auth0. This plugin is not needed any more.
- **Updated** wolkenkit SDK to work universally
  - The wolkenkit SDK now runs in browsers and on Node.js in the same way.
  - The previous differences in how to configure a wolkenkit application are gone.
- **Updated** the client API
  - The client API has been partially rewritten: [Connecting to an application](../../../../<%= current.version %>/reference/building-a-client/connecting-to-an-application/), [handling application events](../../../../<%= current.version %>/reference/building-a-client/handling-application-events/), and [using authentication](../../../../<%= current.version %>/reference/building-a-client/using-authentication/).
- **Removed** plugin support from the client API
  - The client API does no longer support plugins.

For details on how to update to version `<%= current.version %>` see [updating the CLI](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../<%= current.version %>/getting-started/updating-wolkenkit/updating-an-application/).

## 0.11.0

The following significant changes have been made since wolkenkit `0.9.0`:

- **Added** crash recovery
  - When the write model crashes after events have been stored to the event store, but before they have been sent to the read model and the flows, crash recovery now takes care to deliver those events once the write model is back up.
- **Added** documentation on data structures
  - The documentation now contains information on the structure of [commands](../../../../0.11.0/reference/data-structures/commands/) and [events](../../../../0.11.0/reference/data-structures/events/).
- **Updated** terminology
  - To improve compatibility with the terminology of domain-driven design (DDD) we renamed `topic` to `aggregate`. You will have to [update your applications](../../../../0.11.0/getting-started/updating-wolkenkit/updating-an-application/) accordingly.
- **Updated** documentation
  - The documentation now includes basics on wolkenkit and a few guides on how to create applications. Additionally, the navigation has been improved.

For details on how to update to version `0.11.0` see [updating the CLI](../../../../0.11.0/getting-started/updating-wolkenkit/updating-the-cli/) and [updating an application](../../../../0.11.0/getting-started/updating-wolkenkit/updating-an-application/).
