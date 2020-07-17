import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Application as ExpressApplication } from 'express';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getApi } from '../../../../lib/apis/manageFile/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryFileStore } from '../../../../lib/stores/fileStore/InMemory/InMemoryFileStore';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('manageFile/http', (): void => {
  const identityProviders = [ identityProvider ];

  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'withHooksForFiles' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('POST /add-file', (): void => {
      let api: ExpressApplication,
          fileStore: FileStore;

      setup(async (): Promise<void> => {
        fileStore = await InMemoryFileStore.create();

        ({ api } = await getApi({
          application,
          corsOrigin: '*',
          identityProviders,
          fileStore
        }));
      });

      test('returns a 400 if invalid headers are sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': uuid(),
            'x-name': uuid(),
            'content-type': 'invalid-content-type'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
      });

      test('returns a 401 if the adding file hook throws a not authorized exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': uuid(),
            'x-name': 'addingFile-unauthorized',
            'content-type': 'text/plain'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(401);
      });

      test('returns a 500 if the adding file hook throws another exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': uuid(),
            'x-name': 'addingFile-failure',
            'content-type': 'text/plain'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });
    });
  });
});
