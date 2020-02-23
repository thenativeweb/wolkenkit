#!/usr/bin/env node

import { buntstift } from 'buntstift';
import { getHandlers } from '../clis/getHandlers';
import { rootCommand } from '../clis/concierge/rootCommand';
import { runCli } from 'command-line-interface';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  try {
    await runCli({
      rootCommand: rootCommand(),
      argv: process.argv,
      handlers: getHandlers()
    });
  } catch (ex) {
    buntstift.info(ex.message);
    buntstift.error('An unexpected error occured.');

    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
