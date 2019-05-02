# Installing using Vagrant

To run wolkenkit using Vagrant you need to setup a few things.

## Setting up Vagrant

To run wolkenkit you need Vagrant <%= current.versions.vagrant %> or higher. To setup Vagrant, follow the installation guide provided in the [Vagrant documentation](https://www.vagrantup.com/intro/getting-started/install.html).

### Using VirtualBox

To use VirtualBox as virtualization engine, you also have to install the `vagrant-vbguest` plugin. The plugin will ensure that the guest additions in the virtual machine will match the version of VirtualBox that is installed on your machine:

```shell
$ vagrant plugin install vagrant-vbguest
```

## Setting up wolkenkit

To download and install wolkenkit, create an empty directory, and copy the file `Vagrantfile` from the GitHub repository [thenativeweb/wolkenkit-vagrant](https://github.com/thenativeweb/wolkenkit-vagrant) to this directory. Then, from within this directory, run the following command:

```shell
$ vagrant up
```

## Verifying the installation

Verify that wolkenkit is installed correctly by entering the virtual machine and then running the following command:

```shell
$ vagrant ssh
$ wolkenkit --version
```

:::hint-congrats
> **Yay, congratulations!**
>
> You have successfully installed wolkenkit!
:::

To learn how to build and run your first application, have a look at [creating your first application](../../creating-your-first-application/setting-the-objective/) 😊!
