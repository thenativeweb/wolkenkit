# Overview

The read model is responsible for efficiently reading the application state. For that, it transforms events into data structures that are optimized for reading.

## Introducing lists

A *list* is a collection of items, and each item contains *fields*. It is tailor-made for a specific view of the client and hence contains denormalized data, so there is never a need to join data.

Lists handle events that were published by the write model. As a result, they add, update, or remove items. By default, an item can be read by anybody who is allowed to receive the event that caused adding the item initially. You may want to change this by configuring authorization.

From time to time you may need to filter or modify items dynamically while reading them. This is possible using *transformations*.
