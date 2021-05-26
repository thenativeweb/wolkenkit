import { AskInfrastructure } from '../../../../lib/common/elements/AskInfrastructure';
import { assert } from 'assertthat';
import { Hooks } from '../../../../lib/common/elements/Hooks';
import { parseHooks } from '../../../../lib/common/parsers/parseHooks';
import { TellInfrastructure } from '../../../../lib/common/elements/TellInfrastructure';
import { v4 } from 'uuid';

suite('parseHooks', (): void => {
  const hooksDefinition: Hooks<AskInfrastructure & TellInfrastructure> = {
    async addedFile (): Promise<void> {
      // Intentionally left blank.
    },

    async addingFile (): Promise<{ name: string; contentType: string }> {
      return {
        name: v4(),
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

  test('does not return an error if everything is fine.', async (): Promise<void> => {
    assert.that(
      parseHooks({ hooksDefinition })
    ).is.not.anError();
  });

  test('returns an error if the given hooks definition is not an object.', async (): Promise<void> => {
    assert.that(
      parseHooks({ hooksDefinition: undefined })
    ).is.anErrorWithMessage('Hooks definition is not an object.');
  });

  test('returns an error if addedFile is not a function.', async (): Promise<void> => {
    assert.that(
      parseHooks({
        hooksDefinition: {
          ...hooksDefinition,
          addedFile: false
        }
      })
    ).is.anErrorWithMessage(`Property 'addedFile' is not a function.`);
  });

  test('returns an error if addingFile is not a function.', async (): Promise<void> => {
    assert.that(
      parseHooks({
        hooksDefinition: {
          ...hooksDefinition,
          addingFile: false
        }
      })
    ).is.anErrorWithMessage(`Property 'addingFile' is not a function.`);
  });

  test('returns an error if removedFile is not a function.', async (): Promise<void> => {
    assert.that(
      parseHooks({
        hooksDefinition: {
          ...hooksDefinition,
          removedFile: false
        }
      })
    ).is.anErrorWithMessage(`Property 'removedFile' is not a function.`);
  });

  test('returns an error if removingFile is not a function.', async (): Promise<void> => {
    assert.that(
      parseHooks({
        hooksDefinition: {
          ...hooksDefinition,
          removingFile: false
        }
      })
    ).is.anErrorWithMessage(`Property 'removingFile' is not a function.`);
  });
});
