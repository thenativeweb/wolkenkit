#!/usr/bin/env node

import { buntstift } from 'buntstift';
import { rootCommand } from '../cli/rootCommand';
import { runCli } from 'command-line-interface';

/* eslint-disable @typescript-eslint/no-floating-promises */
(async (): Promise<void> => {
  try {
    await runCli({
      rootCommand: rootCommand(),
      argv: process.argv,
      handlers: {
        commandFailed ({ ex }): void {
          if (ex.stack) {
            buntstift.verbose(ex.stack, { isVerboseModeEnabled: true });
          }
        },

        commandUnknown ({ unknownCommandName, recommendedCommandName }): void {
          buntstift.error(`Unknown command '${unknownCommandName}', did you mean '${recommendedCommandName}'?`);
        },

        optionInvalid ({ reason }): void {
          buntstift.error(reason);
        },

        optionMissing ({ optionDefinition }): void {
          buntstift.error(`Option '${optionDefinition.name}' is missing.`);
        },

        optionUnknown ({ optionName }): void {
          buntstift.error(`Unknown option '${optionName}'.`);
        }
      }
    });
  } catch (ex) {
    buntstift.info(ex.message);
    buntstift.error('Failed to build images.');

    process.exit(1);
  }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
