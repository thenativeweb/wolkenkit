import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { uuid } from 'uuidv4';
import { validateCommandWithMetadata } from '../../../../lib/common/validators/validateCommandWithMetadata';

suite('validateCommandWithMetadata', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
  const commandId = uuid();

  const user = {
    id: 'jane.doe',
    claims: { sub: 'jane.doe' }
  };

  const command = new CommandWithMetadata({
    contextIdentifier: { name: 'sampleContext' },
    aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
    name: 'execute',
    data: {
      strategy: 'succeed'
    },
    id: commandId,
    metadata: {
      causationId: commandId,
      correlationId: commandId,
      client: { ip: '127.0.0.0', token: 'some-token', user },
      initiator: { user },
      timestamp: Date.now()
    }
  });

  let applicationDefinition: ApplicationDefinition;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandWithMetadata({ command, applicationDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the command does not match the commandWithMetadata schema.', async (): Promise<void> => {
    assert.that((): void => {
      validateCommandWithMetadata({
        command: ({
          ...command,
          name: ''
        }) as any,
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
      validateCommandWithMetadata({
        command: ({
          ...command,
          contextIdentifier: {
            name: 'someContext'
          }
        }) as any,
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
      validateCommandWithMetadata({
        command: ({
          ...command,
          aggregateIdentifier: {
            name: 'someAggregate',
            id: uuid()
          }
        }) as any,
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
      validateCommandWithMetadata({
        command: ({
          ...command,
          name: 'someCommand'
        }) as any,
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
      validateCommandWithMetadata({
        command: ({
          ...command,
          data: {
            foo: ''
          }
        }) as any,
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECOMMANDMALFORMED' &&
        ex.message === `Missing required property: strategy (at command.data.strategy).`
    );
  });
});
