#!/usr/bin/env node

'use strict';

const buntstift = require('buntstift');

const buildImages = require('../docker/buildImages');

(async () => {
  try {
    await buildImages();

    buntstift.success('Successfully built images.');

    process.exit(0);
  } catch (ex) {
    buntstift.info(ex.message);
    buntstift.error('Failed to build images.');

    process.exit(1);
  }
})();
