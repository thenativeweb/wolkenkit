import { assert } from 'assertthat';
import path from 'path';
import { SampleCommandData } from '../../../server/domain/sampleContext/sampleAggregate/commands/sampleCommand';
import { uuid } from 'uuidv4';
import { ApplicationDefinition, getApplicationDefinition, sandbox } from 'wolkenkit';

suite('sampleAggregate', (): void => {
  let applicationDefinition: ApplicationDefinition;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({
      applicationDirectory: path.join(__dirname, '..', '..', '..')
    });
  });

  suite('sampleCommand', (): void => {
    test('publishes a sample domain event.', async (): Promise<void> => {
      const contextIdentifier = { name: 'sampleContext' };
      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

      await sandbox().
        withApplicationDefinition({ applicationDefinition }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        when<SampleCommandData>({ name: 'sampleCommand', data: {}}).
        then(({ domainEvents, state }): void => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sampleDomainEvent');
          assert.that(domainEvents[0].data).is.equalTo({});
          assert.that(state).is.equalTo({ domainEventNames: [ 'sampleDomainEvent' ]});
        });
    });
  });
});
