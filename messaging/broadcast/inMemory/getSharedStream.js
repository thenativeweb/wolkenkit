'use strict';

const { PassThrough } = require('stream');

const sharedStreams = {};

const getSharedStream = function ({ exchangeName }) {
  let sharedStream = sharedStreams[exchangeName];

  if (sharedStream) {
    return sharedStream;
  }

  sharedStream = new PassThrough({ objectMode: true });
  sharedStreams[exchangeName] = sharedStream;

  return sharedStream;
};

module.exports = getSharedStream;
