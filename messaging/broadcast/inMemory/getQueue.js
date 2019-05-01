'use strict';

const Queue = require('./Queue');

const queues = {};

const getQueue = function ({ exchangeName }) {
  if (!exchangeName) {
    throw new Error('Exchange name is missing.');
  }

  let queue = queues[exchangeName];

  if (!queue) {
    queues[exchangeName] = new Queue();
    queue = queues[exchangeName];
  }

  return queue;
};

module.exports = getQueue;
