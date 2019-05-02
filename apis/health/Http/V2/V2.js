'use strict';

const express = require('express');

const getHealth = require('./getHealth');

class V2 {
  constructor () {
    this.api = express();

    this.api.get('/', getHealth());
  }
}

module.exports = V2;
