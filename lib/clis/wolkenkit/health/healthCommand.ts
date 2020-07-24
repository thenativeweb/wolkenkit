import { buntstift } from 'buntstift';
import { Client } from '../../../apis/getHealth/http/v2/Client';
import { Command } from 'command-line-interface';
import { HealthOptions } from './HealthOptions';
import { validatePort } from '../dev/validatePort';

const healthCommand = function (): Command<HealthOptions> {
  return {
    name: 'health',
    description: 'Verify the health of a wolkenkit application process.',

    optionDefinitions: [
      {
        name: 'protocol',
        description: 'set the protocol',
        parameterName: 'protocol',
        type: 'string',
        isRequired: false,
        defaultValue: 'http'
      },
      {
        name: 'host-name',
        description: 'set the host name of the server',
        parameterName: 'hostName',
        type: 'string',
        isRequired: false,
        defaultValue: 'localhost'
      },
      {
        name: 'health-port',
        alias: 'e',
        description: 'set a port for the health endpoint',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        defaultValue: 3001,
        validate: validatePort
      },
      {
        name: 'base-path',
        description: 'set the base path of the health api',
        parameterName: 'basePath',
        type: 'string',
        isRequired: false,
        defaultValue: '/health/v2/'
      }
    ],

    async handle ({ options: {
      protocol,
      'host-name': hostName,
      'health-port': healthPort,
      'base-path': basePath,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );

      buntstift.verbose(`Sending health request to ${protocol}://${hostName}:${healthPort}${basePath}.`);

      const healthClient = new Client({
        protocol,
        hostName,
        port: healthPort,
        path: basePath
      });

      try {
        const healthData = await healthClient.getHealth();

        buntstift.verbose('Health check successful.');
        buntstift.verbose(JSON.stringify(healthData, null, 2));

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      } catch (ex) {
        buntstift.verbose('Health check failed.');

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }
    }
  };
};

export { healthCommand };
