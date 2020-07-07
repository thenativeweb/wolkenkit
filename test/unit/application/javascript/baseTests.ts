import { assert } from 'assertthat';
import { ExecuteData } from '../../../shared/applications/typescript/base/server/domain/sampleContext/sampleAggregate/commands/execute';
import { ExecutedData } from '../../../shared/applications/typescript/base/server/domain/sampleContext/sampleAggregate/domainEvents/executed';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { createSandbox as sandbox } from '../../../../lib/common/utils/test/sandbox/createSandbox';
import { SucceededData } from '../../../shared/applications/typescript/base/server/domain/sampleContext/sampleAggregate/domainEvents/succeeded';
import { uuid } from 'uuidv4';

suite('javascript/base', (): void => {
  test('runs a command on a pristine aggregate.', async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
    const application = await loadApplication({ applicationDirectory });

    const contextIdentifier = { name: 'sampleContext' };
    const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

    await sandbox().
      withApplication({ application }).
      forAggregate({ contextIdentifier, aggregateIdentifier }).
      when<ExecuteData>({ name: 'execute', data: { strategy: 'succeed' }}).
      then(({ state, domainEvents }): void => {
        assert.that(domainEvents[0].name).is.equalTo('succeeded');
        assert.that(domainEvents[1].name).is.equalTo('executed');
        assert.that(state).is.equalTo({ domainEventNames: [ 'succeeded', 'executed' ]});
      });
  });

  test('runs a command on a non-pristine aggregate.', async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
    const application = await loadApplication({ applicationDirectory });

    const contextIdentifier = { name: 'sampleContext' };
    const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

    await sandbox().
      withApplication({ application }).
      forAggregate({ contextIdentifier, aggregateIdentifier }).
      given<SucceededData>({ name: 'succeeded', data: {}}).
      and<ExecutedData>({ name: 'executed', data: { strategy: 'succeed' }}).
      when<ExecuteData>({ name: 'execute', data: { strategy: 'succeed' }}).
      then(({ state, domainEvents }): void => {
        assert.that(domainEvents[0].name).is.equalTo('succeeded');
        assert.that(domainEvents[1].name).is.equalTo('executed');
        assert.that(state).is.equalTo({ domainEventNames: [ 'succeeded', 'executed', 'succeeded', 'executed' ]});
      });
  });
});
