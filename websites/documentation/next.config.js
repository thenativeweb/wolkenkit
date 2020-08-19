'use strict';

const path = require('path');

const libraryEntryPointPath = path.resolve(__dirname, '..', '..', 'lib');

module.exports = {
  // We dont't want Next.js to create pages like components.html but components/index.html.
  trailingSlash: true,
  webpack (configuration) {
    configuration.module.rules[0].include.push(libraryEntryPointPath);

    return configuration;
  }
};
