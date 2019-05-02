# Creating the application

First, you need to create a new directory for your application. Call it `chat`:

```shell
$ mkdir chat
```

## Initializing the application

From inside this directory, run the following command to initialize a new wolkenkit application using a ready-made template:

```shell
$ wolkenkit init
```

## Running your application

Now run your application by using the following command, and wait for a success message:

```shell
$ wolkenkit start
```

## Running the client

To run the client for your application, you first need to install an HTTP server. We are using [http-server](https://www.npmjs.com/package/http-server) that can easily be installed by using the following command:

```shell
$ npm install -g http-server
```

Once you have done that run the client using the following command. This will automatically launch a browser and open the client:

```shell
$ http-server ./client/ -o
```

## Lets's chat!

You are now able to chat. This even works with multiple browsers concurrently:

![The chat application](chat.png)

:::hint-congrats
> **Yay, congratulations!**
>
> You have initialized and run your first wolkenkit application!
:::

All in all, this was pretty easy because you were able to use a template. If you want to learn to build a chat by yourself, have a look at [creating an application from scratch](../../creating-an-application-from-scratch/setting-the-objective/). For now, we wish you some happy chatting 😊!
