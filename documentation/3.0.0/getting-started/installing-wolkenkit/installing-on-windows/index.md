# Installing on Windows

To run wolkenkit on Windows you need to setup a few things.

## Preparing the system for Hyper-V

As wolkenkit uses Linux-based Docker images, you have to use Hyper-V to run wolkenkit. Currently, wolkenkit does not support native Windows images.

:::hint-warning
> **Hyper-V support is experimental**
>
> Running wolkenkit on Windows using Hyper-V is experimental, and not yet officially supported.
:::

### Using hardware

To run Windows directly on hardware, i.e. without any virtualization, you do not need to take any special steps.

:::hint-warning
> **Enable VT-x**
>
> You may have to enable VT-x support in your machine's BIOS for Docker to work.
:::

### Using VMware Fusion

To run Windows using VMware Fusion, you need to enable Hypervisor applications for your virtual machine. Shutdown the virtual machine and go to *Settings > System settings > Processors and RAM > Advanced options*. Ensure that *Enable Hypervisor applications in this virtual machine* is checked. Close the settings to save your changes.

Now locate the file that represents the virtual machine on your host computer. As this file is an archive, open it, and then open the included `.vmx` file. This file contains the settings for your virtual machine. If not yet present, add the following lines to the file:

```
hypervisor.cpuid.v0 = "FALSE"
vhv.enable = "TRUE"
```

After that, start your virtual machine and boot into Windows.

## Installing Hyper-V

To install Hyper-V run PowerShell using administrative privileges. Then run the following commands:

```shell
$ Enable-WindowsOptionalFeature -Online -FeatureName containers -All
$ Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

:::hint-warning
> **Restart Windows**
>
> Don't forget to restart Windows once the commands have been completed.
:::

## Setting up Docker

To run wolkenkit you need Docker <%= current.versions.docker %> or higher. To setup Docker on Windows, [download and install Docker for Windows](https://docs.docker.com/docker-for-windows/install/).

## Setting up Node.js

To run wolkenkit you need Node.js <%= current.versions.node %> or higher. We recommend to install Node.js using [nvm-windows](https://github.com/coreybutler/nvm-windows), which enables switching between different Node.js versions.

So, [download and install nvm-windows](https://github.com/coreybutler/nvm-windows#installation--upgrades).

Restart PowerShell and install Node.js using the following command:

```shell
$ nvm install <%= current.versions.node %>
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
