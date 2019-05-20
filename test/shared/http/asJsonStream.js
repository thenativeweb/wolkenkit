'use strict';

const { Writable } = require('stream');

const asJsonStream = function (...handleJson) {
  let counter = 0;

  return new Writable({
    write (chunk, encoding, callback) {
      const data = JSON.parse(chunk.toString());

      if (!handleJson[counter]) {
        return callback(new Error(`Received ${counter + 1} items (${JSON.stringify(data)}), but only expected ${handleJson.length}.`));
      }

      handleJson[counter](data);

      counter += 1;
      callback();
    }
  });
};

module.exports = asJsonStream;
