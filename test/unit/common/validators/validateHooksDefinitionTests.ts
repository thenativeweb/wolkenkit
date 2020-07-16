import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Hooks } from '../../../../lib/common/elements/Hooks';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';
import { uuid } from 'uuidv4';
import { validateHooksDefinition } from '../../../../lib/common/validators/validateHooksDefinition';

suite('validateHooksDefinition', (): void => {
  const hooksDefinition: Hooks<AskInfrastructure & TellInfrastructure> = {
    async addedFile (): Promise<void> {
      // Intentionally left blank.
    },

    async addingFile (): Promise<{ name: string; contentType: string }> {
      return {
        name: uuid(),
        contentType: 'text/plain'
      };
    },

    async removedFile (): Promise<void> {
      // Intentionally left blank.
    },

    async removingFile (): Promise<void> {
      // Intentionally left blank.
    }
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({ hooksDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the given hooks definition is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({ hooksDefinition: undefined });
    }).is.throwing((ex): boolean =>
      (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
      ex.message === 'Hooks definition is not an object.');
  });

  test('throws an error if addedFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          addedFile: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'addedFile' is not a function.`
    );
  });

  test('throws an error if addingFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          addingFile: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'addingFile' is not a function.`
    );
  });

  test('throws an error if removedFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          removedFile: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'removedFile' is not a function.`
    );
  });

  test('throws an error if removingFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          removingFile: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'removingFile' is not a function.`
    );
  });
});
