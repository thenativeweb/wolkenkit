'use strict';

const path = require('path');

const buntstift = require('buntstift'),
      draw = require('terminal-img');

const showLogo = async function () {
  const logo = path.join(__dirname, '..', '..', 'images', 'logo.png');

  buntstift.newLine();
  await draw(logo, { width: Math.floor(process.stdout.columns * 0.4) });
  buntstift.newLine();
};

module.exports = showLogo;
