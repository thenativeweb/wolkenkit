import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { DocumentationOptions } from './DocumentationOptions';
import { flaschenpost } from 'flaschenpost';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { getApi as getStaticApi } from '../../../apis/getStatic/http';
import http from 'http';
import path from 'path';
import { printFooter } from '../printFooter';
import { validatePort } from './validatePort';

const logger = flaschenpost.getLogger();

const documentationCommand = function (): Command<DocumentationOptions> {
  return {
    name: 'documentation',
    description: 'Start the wolkenkit documentation.',

    optionDefinitions: [
      {
        name: 'port',
        alias: 'p',
        description: 'set a port',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        defaultValue: 4000,
        validate: validatePort
      }
    ],

    async handle ({ options: {
      verbose,
      port
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        buntstift.info('Starting the documentation...');
        buntstift.info('To stop the documentation, press <Ctrl>+<C>.');
        buntstift.newLine();
        buntstift.info(`  Port  ${port}`);

        const applicationRoot = await getApplicationRoot({ directory: __dirname });

        const { api: staticApi } = await getStaticApi({
          corsOrigin: '*',
          directory: path.join(applicationRoot, 'build', 'websites', 'documentation')
        });

        http.createServer(staticApi).listen(port, (): void => {
          buntstift.newLine();
          printFooter();
          buntstift.newLine();
          buntstift.line();
          logger.info('Documentation server started.', {
            port,
            url: `http://localhost:${port}`
          });
        });
      } catch (ex) {
        buntstift.error('Failed to start the documentation.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { documentationCommand };
