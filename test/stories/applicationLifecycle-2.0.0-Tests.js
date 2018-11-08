'use strict';

const applicationLifecycleTests = require('./shared/applicationLifecycleTests');

(async () => {
  await applicationLifecycleTests('2.0.0');
})();
