'use strict';

const Application = require('./Application'),
      ApplicationCache = require('./ApplicationCache'),
      extendEntries = require('./extendEntries'),
      getEntries = require('./getEntries'),
      validateDirectory = require('./validateDirectory'),
      validateEntries = require('./validateEntries');

const applicationCache = new ApplicationCache();

const applicationManager = {
  async validate ({ directory }) {
    if (!directory) {
      throw new Error('Directory is missing.');
    }

    await validateDirectory({ directory });
  },

  async load ({ directory }) {
    if (!directory) {
      throw new Error('Directory is missing.');
    }

    const cachedApplication = applicationCache.get({ directory });

    if (cachedApplication) {
      return cachedApplication;
    }

    await validateDirectory({ directory });

    const entries = await getEntries({ directory });

    await validateEntries({ entries });

    const extendedEntries = extendEntries({ entries });
    const application = new Application({ entries: extendedEntries });

    applicationCache.set({ directory, application });

    return application;
  }
};

module.exports = applicationManager;
