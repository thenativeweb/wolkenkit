# Overview

Basically there are two types of wolkenkit versions: On the one hand there are the stable versions, that have a version number such as `1.0.0`, `2.0.0` and so on, on the other hand there is the version `latest`.

The stable versions are intended for developers who build applications with wolkenkit, whereas `latest` is a continuously updated version which includes features that are not yet officially available. In most cases you should use a stable version and [pin the runtime](../../../reference/configuring-an-application/pinning-the-runtime/) in your application's `package.json` file. This way you ensure that your application can be run in a reproducible way.

:::hint-warning
> **Be careful with latest**
>
> Please note that the `latest` runtime is updated frequently and is therefore not guaranteed to work reliably at all times. This means that unexpected things may happen that could affect the stability and even the runability of your application. Use at your own risk.
:::

However, from time to time you may want to use the `latest` runtime of wolkenkit to evaluate new features that have not yet been officially released, but will be part of the next stable version. For this you can use `latest` as the runtime version.

This guide will walk you through the steps you need to do to use the `latest` runtime. First, let's start with [installing the latest runtime](../installing-the-latest-runtime/).
