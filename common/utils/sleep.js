'use strict';

const sleep = async function ({ ms }) {
  if (!ms) {
    throw new Error('Ms is missing.');
  }

  await new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = sleep;
