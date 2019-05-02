# Installing on Linux

To run wolkenkit on Linux you need to setup a few things.

## Setting up Docker

To run wolkenkit you need Docker <%= current.versions.docker %> or higher. To setup Docker on Linux, [follow the installation instructions](https://docs.docker.com/engine/installation/linux/) for the Linux distribution of your choice.

## Setting up Node.js

To run wolkenkit you need Node.js <%= current.versions.node %> or higher. We recommend installing Node.js using [nvm](https://github.com/creationix/nvm), which enables switching between different Node.js versions.

First, install nvm using this command:

```shell
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
```

Then, restart your terminal and install Node.js using the following commands:

```shell
$ nvm install <%= current.versions.node %>
$ nvm alias default <%= current.versions.node %>
$ nvm use <%= current.versions.node %>
```

## Setting up wolkenkit

To download and install wolkenkit, run the following command:

```shell
$ npm install -g wolkenkit@<%= current.versions.cli %>
```

## Verifying the installation

Verify that wolkenkit is installed correctly by running the following command:

```shell
$ wolkenkit --version
```

:::hint-congrats
> **Yay, congratulations!**
>
> You have successfully installed wolkenkit!
:::

To learn how to build and run your first application, have a look at [creating your first application](../../creating-your-first-application/setting-the-objective/) 😊!
