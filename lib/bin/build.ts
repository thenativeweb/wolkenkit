#!/usr/bin/env node

import { buildImages } from '../../docker/buildImages';
import { buntstift } from 'buntstift';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  try {
    await buildImages();

    buntstift.success('Successfully built images.');

    process.exit(0);
  } catch (ex) {
    buntstift.info(ex.message);
    buntstift.error('Failed to build images.');

    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
