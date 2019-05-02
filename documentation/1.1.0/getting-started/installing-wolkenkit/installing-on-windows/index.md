# Installing on Windows

To run wolkenkit on Windows you need to setup a few things.

## Preparing the system for Hyper-V

As wolkenkit uses Linux-based Docker images, you have to use Hyper-V and Docker Machine to run wolkenkit. Currently, wolkenkit does not support native Windows images.

:::hint-warning
> **Hyper-V support is experimental**
>
> Running wolkenkit on Windows using Hyper-V and Docker Machine is experimental, and not yet officially supported.
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

### Setting up the network

By default, Hyper-V virtual machines are not accessible from the outside. To change this you need to set up an external network switch. For details on how to do this, please [refer to the Docker documentation](https://docs.docker.com/machine/drivers/hyper-v/#2-set-up-a-new-external-network-switch-optional)

:::hint-warning
> **Restart Windows**
>
> From time to time Windows has problems with its routing tables after creating a new network switch. Hence it is recommended to restart Windows.
:::

## Setting up Docker

To run wolkenkit you need Docker <%= current.versions.docker %> or higher. To setup Docker on Windows, [download and install Docker for Windows](https://docs.docker.com/docker-for-windows/install/).

### Creating a virtual machine

Now you need to setup a virtual machine using Hyper-V and Docker Machine. Make sure to provide the name of the Hyper-V network switch that you created a few steps ago:

```shell
$ docker-machine create --driver hyperv --hyperv-virtual-switch "..." wolkenkit
```

### Setting up environment variables

Finally, you need to setup the environment variables `DOCKER_HOST`, `DOCKER_TLS_VERIFY` and `DOCKER_CERT_PATH`.

For that, first run the following command to get the values for the environment variables:

```shell
$ docker-machine env --shell cmd wolkenkit
```

Then you have to set the environment variables using the appropriate values:

```shell
$ [Environment]::SetEnvironmentVariable("DOCKER_TLS_VERIFY", "1", "User")
$ [Environment]::SetEnvironmentVariable("DOCKER_HOST", "...", "User")
$ [Environment]::SetEnvironmentVariable("DOCKER_CERT_PATH", "...", "User")
```

:::hint-warning
> **Restart PowerShell**
>
> Since the environment variables are only available after a restart of the shell, now close and reopen PowerShell again, still using administrative privileges.
:::

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

## Setting up local.wolkenkit.io

When developing wolkenkit applications you will usually run them on the domain `local.wolkenkit.io`. This means that you need to set up this domain inside your `C:\Windows\System32\drivers\etc\hosts` file and make it point to the Docker server running on your previously created virtual machine. So, run the following command:

```shell
$ Add-Content C:\Windows\System32\drivers\etc\hosts "$(docker-machine ip wolkenkit)`tlocal.wolkenkit.io"
```

:::hint-warning
> **Restart Windows**
>
> Finally, restart Windows one last time.
:::

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

To learn how to build and run your first application, have a look at [creating your first application](../../../guides/creating-your-first-application/setting-the-objective/) 😊!
