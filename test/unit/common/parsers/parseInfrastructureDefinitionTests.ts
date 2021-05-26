import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { InfrastructureDefinition } from '../../../../lib/common/application/InfrastructureDefinition';
import { parseInfrastructureDefinition } from '../../../../lib/common/parsers/parseInfrastructureDefinition';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';

suite('parseInfrastructureDefinition', (): void => {
  const infrastructureDefinition: InfrastructureDefinition<AskInfrastructure, TellInfrastructure> = {
    async setupInfrastructure (): Promise<void> {
      // Intentionally left blank.
    },
    async getInfrastructure (): Promise<AskInfrastructure & TellInfrastructure> {
      return {
        ask: {},
        tell: {}
      };
    }
  };

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({ infrastructureDefinition })
    ).is.not.anError();
  });

  test('returns an error if the given infrastructure definition is not an object.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({ infrastructureDefinition: undefined })
    ).is.anErrorWithMessage('Infrastructure definition is not an object.');
  });

  test('returns an error if setup infrastructure is missing.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          setupInfrastructure: undefined
        }
      })
    ).is.anErrorWithMessage(`Function 'setupInfrastructure' is missing.`);
  });

  test('returns an error if setup infrastructure is not a function.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          setupInfrastructure: false
        }
      })
    ).is.anErrorWithMessage(`Property 'setupInfrastructure' is not a function.`);
  });

  test('returns an error if get infrastructure is missing.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          getInfrastructure: undefined
        }
      })
    ).is.anErrorWithMessage(`Function 'getInfrastructure' is missing.`);
  });

  test('returns an error if get infrastructure is not a function.', async (): Promise<void> => {
    assert.that(
      parseInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          getInfrastructure: false
        }
      })
    ).is.anErrorWithMessage(`Property 'getInfrastructure' is not a function.`);
  });
});
