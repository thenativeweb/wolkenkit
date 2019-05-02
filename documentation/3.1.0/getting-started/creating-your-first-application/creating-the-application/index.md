# Creating the application

First, you need to create a new directory for your application. Call it `chat`:

```shell
$ mkdir chat
```

## Initializing the application

From inside this directory, run the following command to initialize a new wolkenkit application. When asked to select a template, choose `Chat (sample application)`:

```shell
$ wolkenkit init
```

## Running your application

Now run your application by using the following command, and wait for a success message:

```shell
$ wolkenkit start
```

## Running the client

To run the client for your application, you first have to set it up. Therefore, run the following commands to switch to the `client` directory and install the client's dependencies:

```shell
$ cd client
$ npm install
```

Once you have done that run the client using the following command from inside the `client` directory. This will automatically launch a browser and open the client:

```shell
$ npm run serve
```

## Lets's chat!

You are now able to chat. This even works with multiple browsers concurrently:

![The chat application](chat.png)

:::hint-congrats
> **Yay, congratulations!**
>
> You have initialized and run your first wolkenkit application!
:::

All in all, this was pretty easy because you were able to use a template. If you want to learn to build a chat by yourself, have a look at [creating an application from scratch](../../../guides/creating-an-application-from-scratch/setting-the-objective/). For now, we wish you some happy chatting 😊!
