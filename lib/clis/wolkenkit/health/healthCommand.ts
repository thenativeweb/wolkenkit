import { buntstift } from 'buntstift';
import { Client } from '../../../apis/getHealth/http/v2/Client';
import { Command } from 'command-line-interface';
import { errors } from '../../../common/errors';
import { HealthOptions } from './HealthOptions';
import { validatePort } from '../dev/validatePort';
import { validateSocket } from '../dev/validateSocket';

const healthCommand = function (): Command<HealthOptions> {
  return {
    name: 'health',
    description: 'Verify the health of a wolkenkit application process.',

    optionDefinitions: [
      {
        name: 'protocol',
        alias: 'r',
        description: 'set the protocol',
        parameterName: 'protocol',
        type: 'string',
        isRequired: false,
        defaultValue: 'http'
      },
      {
        name: 'host-name',
        alias: 'n',
        description: 'set the host name',
        parameterName: 'hostName',
        type: 'string',
        isRequired: false,
        defaultValue: 'localhost'
      },
      {
        name: 'health-port',
        alias: 'p',
        description: 'set the health port',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        validate: validatePort
      },
      {
        name: 'health-socket',
        alias: 's',
        description: 'set the health socket',
        parameterName: 'path',
        type: 'string',
        isRequired: false,
        validate: validateSocket
      },
      {
        name: 'base-path',
        alias: 'b',
        description: 'set the health base path',
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
      'health-socket': healthSocket,
      'base-path': basePath,
      verbose
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );

      if (healthPort && healthSocket) {
        buntstift.info('Health port and health socket must not be set at the same time.');
        throw new errors.ParameterInvalid();
      }

      const healthPortOrSocket = healthPort ?? healthSocket ?? 3_001;

      buntstift.info(`Sending health request to '${protocol}://${hostName}:${healthPort}${basePath}'.`);

      const healthClient = new Client({
        protocol,
        hostName,
        portOrSocket: healthPortOrSocket,
        path: basePath
      });

      try {
        const healthData = await healthClient.getHealth();

        buntstift.success('Health check successful.');
        buntstift.verbose(JSON.stringify(healthData, null, 2));

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      } catch {
        buntstift.error('Health check failed.');

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }
    }
  };
};

export { healthCommand };
