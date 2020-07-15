import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { FileMetadata } from '../../../../lib/stores/fileStore/FileMetadata';
import { Hooks } from '../../../../lib/common/elements/Hooks';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';
import { uuid } from 'uuidv4';
import { validateHooksDefinition } from '../../../../lib/common/validators/validateHooksDefinition';

suite('validateHooksDefinition', (): void => {
  const hooksDefinition: Hooks<AskInfrastructure & TellInfrastructure> = {
    apis: {
      manageFile: {
        async addingFile (): Promise<FileMetadata> {
          return {
            id: uuid(),
            fileName: uuid(),
            contentLength: 23,
            contentType: 'text/plain'
          };
        },
        async addedFile (): Promise<void> {
          // Intentionally left blank.
        }
      }
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

  test('throws an error if apis is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          apis: false
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'apis' is not an object.`
    );
  });

  test('throws an error if apis.manageFile is not an object.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          apis: {
            manageFile: false
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'apis.manageFile' is not an object.`
    );
  });

  test('throws an error if apis.manageFile.addingFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          apis: {
            manageFile: {
              addingFile: false
            }
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'apis.manageFile.addingFile' is not a function.`
    );
  });

  test('throws an error if apis.manageFile.addedFile is not a function.', async (): Promise<void> => {
    assert.that((): void => {
      validateHooksDefinition({
        hooksDefinition: {
          ...hooksDefinition,
          apis: {
            manageFile: {
              addedFile: false
            }
          }
        }
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.HooksDefinitionMalformed.code &&
        ex.message === `Property 'apis.manageFile.addedFile' is not a function.`
    );
  });
});
