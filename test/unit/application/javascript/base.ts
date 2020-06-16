import { assert } from 'assertthat';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { sandbox } from '../../../../lib/common/utils/test/sandbox';
import { uuid } from 'uuidv4';

suite('javascript/base', (): void => {
  test('something something.', async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
    const applicationDefinition = await getApplicationDefinition({ applicationDirectory });

    const contextIdentifier = { name: 'sampleContext' };
    const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

    await sandbox().
      withApplicationDefinition({ applicationDefinition }).
      forAggregate({
        contextIdentifier,
        aggregateIdentifier
      }).
      when({
        name: 'execute',
        data: { strategy: 'succeed' }
      }).
      then(({ state, domainEvents }): void => {
        assert.that(domainEvents[0].name).is.equalTo('succeeded');
        assert.that(domainEvents[1].name).is.equalTo('executed');
        assert.that(state).is.equalTo({ domainEventNames: [ 'succeeded', 'executed' ]});
      });
  });
});
