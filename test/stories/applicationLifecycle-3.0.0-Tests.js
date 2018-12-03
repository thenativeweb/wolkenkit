'use strict';

const applicationLifecycleTests = require('./shared/applicationLifecycleTests');

(async () => {
  await applicationLifecycleTests('3.0.0');
})();
