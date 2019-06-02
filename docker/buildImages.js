'use strict';

const path = require('path');

const fs = require('fs-extra'),
      { oneLine } = require('common-tags'),
      shell = require('shelljs');

const buildImages = async function () {
  const entries = await fs.readdir(__dirname);

  await Promise.all(entries.map(async entry => {
    const imageDirectory = path.join(__dirname, entry);
    const stat = await fs.stat(imageDirectory);

    if (!stat.isDirectory()) {
      return;
    }

    const dockerfile = path.join(imageDirectory, 'Dockerfile');
    const context = path.join(__dirname, '..');

    const { code } = shell.exec(oneLine`
      docker build
        -t thenativeweb/${entry}:latest
        -f ${dockerfile}
        ${context}
    `);

    if (code !== 0) {
      throw new Error(`Failed to build ${entry}:latest.`);
    }
  }));
};

module.exports = buildImages;
