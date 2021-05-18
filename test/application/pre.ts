#!/usr/bin/env node

import { flaschenpost } from 'flaschenpost';
import path from 'path';
import shell from 'shelljs';
import * as errors from '../../lib/common/errors';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async function (): Promise<void> {
  const logger = flaschenpost.getLogger();

  try {
    const { code, stdout, stderr } = shell.exec('npx roboter build', { cwd: path.join(__dirname, '..', '..') });

    if (code !== 0) {
      throw new errors.CompilationFailed({ message: 'Failed to build wolkenkit.', data: { stdout, stderr }});
    }
  } catch (ex: unknown) {
    logger.fatal('An unexpected error occured.', { err: ex });
    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
