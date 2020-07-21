import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { InfrastructureDefinition } from '../../../../lib/common/application/InfrastructureDefinition';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';
import { validateInfrastructureDefinition } from '../../../../lib/common/validators/validateInfrastructureDefinition';

suite('validateInfrastructureDefinition', (): void => {
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

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({ infrastructureDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given infrastructure definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({ infrastructureDefinition: undefined });
    }).is.throwing((ex): boolean =>
      (ex as CustomError).code === errors.InfrastructureDefinitionMalformed.code &&
      ex.message === 'Infrastructure definition is not an object.');
  });

  test('throws an error if setup infrastructure is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          setupInfrastructure: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.InfrastructureDefinitionMalformed.code &&
        ex.message === `Function 'setupInfrastructure' is missing.`
    );
  });

  test('throws an error if setup infrastructure is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          setupInfrastructure: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.InfrastructureDefinitionMalformed.code &&
        ex.message === `Property 'setupInfrastructure' is not a function.`
    );
  });

  test('throws an error if get infrastructure is missing.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          getInfrastructure: undefined
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.InfrastructureDefinitionMalformed.code &&
        ex.message === `Function 'getInfrastructure' is missing.`
    );
  });

  test('throws an error if get infrastructure is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateInfrastructureDefinition({
        infrastructureDefinition: {
          ...infrastructureDefinition,
          getInfrastructure: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.InfrastructureDefinitionMalformed.code &&
        ex.message === `Property 'getInfrastructure' is not a function.`
    );
  });
});
