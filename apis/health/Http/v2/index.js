'use strict';

const express = require('express');

const getStatus = require('./getStatus');

const v2 = function () {
  const api = express();

  api.get('/status', getStatus());

  return api;
};

module.exports = v2;
