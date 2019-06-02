'use strict';

const applicationLifecycleTests = require('./shared/applicationLifecycleTests');

(async () => {
  await applicationLifecycleTests('latest');
})();
