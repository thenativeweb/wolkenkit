import Application from '../../../../src/common/application/Application';
import assert from 'assertthat';
import CommandExternal from '../../../../src/common/elements/CommandExternal';
import path from 'path';
import uuid from 'uuidv4';

suite('CommandExternal', (): void => {
  suite('create', (): void => {
    test('returns a command.', async (): Promise<void> => {
      const aggregateId = uuid();

      const command = CommandExternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: aggregateId
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      // assert.that(command).is.instanceOf(CommandExternal); // TODO
      assert.that(command.contextIdentifier.name).is.equalTo('sampleContext');
      assert.that(command.aggregateIdentifier.name).is.equalTo('sampleAggregate');
      assert.that(command.aggregateIdentifier.id).is.equalTo(aggregateId);
      assert.that(command.name).is.equalTo('sampleCommand');
      assert.that(command.id).is.ofType('string');
      assert.that(uuid.is(command.id)).is.true();
      assert.that(command.data).is.equalTo({ foo: 'bar' });
      assert.that(command.metadata.timestamp).is.ofType('number');
      assert.that(command.metadata.correlationId).is.equalTo(command.id);
      assert.that(command.metadata.causationId).is.equalTo(command.id);
    });
  });

  suite('deserialize', (): void => {
    test('returns a real command object.', async (): Promise<void> => {
      const command = CommandExternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandExternal.deserialize(deserializedCommand);

      assert.that(actual).is.equalTo(deserializedCommand);
    });

    test('throws an error when the original metadata are malformed.', async (): Promise<void> => {
      const command = CommandExternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      deserializedCommand.metadata.timestamp = 'malformed';

      assert.that((): void => {
        CommandExternal.deserialize(deserializedCommand);
      }).is.throwing('Invalid type: string should be number (at command.metadata.timestamp).');
    });

    test('does not change original metadata.', async (): Promise<void> => {
      const command = CommandExternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandExternal.deserialize(deserializedCommand);

      assert.that(actual.id).is.equalTo(command.id);
      assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
    });
  });

  suite('validate', (): void => {
    let application: Application;

    setup(async (): Promise<void> => {
      const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

      application = await Application.load({ directory });
    });

    test('throws an error if command is malformed.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({ command: {}, application });
      }).is.throwing('Malformed command.');
    });

    test('throws an error if context name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({
          command: CommandExternal.create({
            contextIdentifier: { name: 'nonExistent' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute'
          }),
          application
        });
      }).is.throwing('Invalid context name.');
    });

    test('throws an error if aggregate name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({
          command: CommandExternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'nonExistent', id: uuid() },
            name: 'execute'
          }),
          application
        });
      }).is.throwing('Invalid aggregate name.');
    });

    test('throws an error if command name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({
          command: CommandExternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'nonExistent'
          }),
          application
        });
      }).is.throwing('Invalid command name.');
    });

    test('throws an error if the schema does not match.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({
          command: CommandExternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute',
            data: { strategy: 'nonExistent' }
          }),
          application
        });
      }).is.throwing('No enum match (nonExistent), expects: succeed, fail, reject (at command.data.strategy).');
    });

    test('does not throw an error if the schema matches.', async (): Promise<void> => {
      assert.that((): void => {
        CommandExternal.validate({
          command: CommandExternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute',
            data: { strategy: 'succeed' }
          }),
          application
        });
      }).is.not.throwing();
    });
  });
});
