'use strict';

const semver = require('semver');

const switchSemver = async function (version, handlers) {
  if (!version) {
    throw new Error('Version is missing.');
  }
  if (!handlers) {
    throw new Error('Handlers are missing.');
  }
  if (!handlers.default) {
    throw new Error('Default is missing.');
  }

  if (!semver.valid(version)) {
    return await handlers.default();
  }

  for (const [ range, handler ] of Object.entries(handlers)) {
    if (semver.satisfies(version, range)) {
      return await handler();
    }
  }

  await handlers.default();
};

module.exports = switchSemver;
