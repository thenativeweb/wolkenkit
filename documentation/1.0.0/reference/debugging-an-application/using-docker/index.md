# Using Docker

From time to time you may need to have a look at the internal workings of wolkenkit. As wolkenkit is built on Docker it helps to be familiar with it. Anyway, there are a few recurring situations you will probably find yourself in, so it is useful to have the following commands at hand.

## Listing containers

If you need to verify the status of the containers of an application, e.g. to verify whether they are actually running, run:

```shell
$ docker ps
```

## Monitoring containers

If you want to continuously monitor which containers are being started and stopped use one of the following commands, depending on your operating system.

### On macOS

Run the following command:

```shell
$ while :; do clear; docker ps; sleep 1; done
```

### On Linux

Run the following command:

```shell
$ watch -n 1 docker ps
```

## Entering a running container

Sometimes it is useful to be able to enter a running container, e.g. to inspect the files within the container. Depending on which container you want to enter, run one of the following commands:

```shell
# Write model
$ docker exec -it <application>-core sh

# Read model
$ docker exec -it <application>-broker sh

# Flows
$ docker exec -it <application>-flows sh
```

To exit from a container, just type `exit`.

## Freeing disk space

If you are using Docker on a virtual machine, the virtual machine may run out of disk space eventually. To free disk space run the following command:

```shell
$ docker system prune
```
