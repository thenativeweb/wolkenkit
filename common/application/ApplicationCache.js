'use strict';

class ApplicationCache {
  constructor () {
    this.applications = {};
  }

  set ({ directory, application }) {
    if (!directory) {
      throw new Error('Directory is missing.');
    }
    if (!application) {
      throw new Error('Application is missing.');
    }

    this.applications[directory] = application;
  }

  get ({ directory }) {
    if (!directory) {
      throw new Error('Directory is missing.');
    }

    return this.applications[directory];
  }
}

module.exports = ApplicationCache;
