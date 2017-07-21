'use strict';

const roboter = require('roboter');

roboter.
  workOn('server').
  equipWith(task => {
    // ...
  }).
  start();
