import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { Command } from '../../../../lib/common/elements/Command';
import { CustomError } from 'defekt';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { uuid } from 'uuidv4';
import { validateCommand } from '../../../../lib/common/validators/validateCommand';

suite('validateCommand', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const command = new Command({
    contextIdentifier: { name: 'sampleContext' },
    aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
    name: 'execute',
    data: {
      strategy: 'succeed'
    }
  });

  let applicationDefinition: ApplicationDefinition;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({ command, applicationDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the command does not match the command schema.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({
        command: {
          ...command,
          name: ''
        },
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMMANDMALFORMED' &&
        ex.message === 'String is too short (0 chars), minimum 1 (at command.name).'
    );
  });

  test(`throws an error if the command's context doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({
        command: {
          ...command,
          contextIdentifier: {
            name: 'someContext'
          }
        },
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECONTEXTNOTFOUND' &&
        ex.message === `Context 'someContext' not found.`
    );
  });

  test(`throws an error if the command's aggregate doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({
        command: {
          ...command,
          aggregateIdentifier: {
            name: 'someAggregate',
            id: uuid()
          }
        },
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATENOTFOUND' &&
        ex.message === `Aggregate 'sampleContext.someAggregate' not found.`
    );
  });

  test(`throws an error if the command doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({
        command: {
          ...command,
          name: 'someCommand'
        },
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMMANDNOTFOUND' &&
        ex.message === `Command 'sampleContext.sampleAggregate.someCommand' not found.`
    );
  });

  test(`throws an error if the command's data doesn't match its schema.`, async (): Promise<void> => {
    assert.that((): void => {
      validateCommand({
        command: {
          ...command,
          data: {
            foo: ''
          }
        },
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMMANDMALFORMED' &&
        ex.message === `Missing required property: strategy (at command.data.strategy).`
    );
  });
});
