'use strict';

const express = require('express');

const getHealth = require('./getHealth');

class V2 {
  constructor ({ processId }) {
    if (!processId) {
      throw new Error('Process id is missing.');
    }

    this.api = express();

    this.api.get('/', getHealth({ processId }));
  }
}

module.exports = V2;
