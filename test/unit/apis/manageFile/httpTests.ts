import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getApi } from '../../../../lib/apis/manageFile/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryFileStore } from '../../../../lib/stores/fileStore/InMemory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Readable } from 'stream';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('manageFile/http', (): void => {
  const identityProviders = [ identityProvider ];

  let application: Application,
      file: { id: string; name: string; content: string };

  suite('/v2', (): void => {
    let api: ExpressApplication,
        fileStore: FileStore;

    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'withHooksForFiles' });

      application = await loadApplication({ applicationDirectory });
    });

    setup(async (): Promise<void> => {
      fileStore = await InMemoryFileStore.create({ type: 'InMemory' });

      ({ api } = await getApi({
        application,
        corsOrigin: '*',
        identityProviders,
        fileStore
      }));

      file = {
        id: v4(),
        name: v4(),
        content: 'Hello world!'
      };
    });

    suite('POST /add-file', (): void => {
      test('returns 400 if invalid headers are sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': v4(),
            'x-name': v4(),
            'content-type': 'invalid-content-type'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
      });

      test('returns 401 if the adding file hook throws a not authenticated exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': v4(),
            'x-name': 'addingFile-unauthenticated',
            'content-type': 'text/plain'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(401);
      });

      test('returns 500 if the adding file hook throws another exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': v4(),
            'x-name': 'addingFile-failure',
            'content-type': 'text/plain'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });

      test('returns 500 if the added file hook throws an exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': v4(),
            'x-name': 'addedFile-failure',
            'content-type': 'text/plain'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });

      test('adds the given file.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': file.name,
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content),
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(200);
        assert.that(await fileStore.getMetadata({ id: file.id })).is.equalTo({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          contentLength: file.content.length
        });
      });

      test('returns 409 when the file to upload already exists.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': file.name,
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': file.name,
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content),
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(409);
      });
    });

    suite('GET /file/:id', (): void => {
      test('returns 401 if the getting file hook throws a not authenticated exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'gettingFile-unauthenticated',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'get',
          url: `/v2/file/${file.id}`,
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(401);
      });

      test('returns 500 if the getting file hook throws any other exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'gettingFile-failure',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'get',
          url: `/v2/file/${file.id}`,
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });

      test('returns 200 even if the got file hook throws an exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'gotFile-failure',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'get',
          url: `/v2/file/${file.id}`,
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns 404 if the requested file does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: `/v2/file/${file.id}`,
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(404);
      });

      test('returns the requested file.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': file.name,
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status, headers, data } = await client({
          method: 'get',
          url: `/v2/file/${file.id}`,
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(200);
        assert.that(headers['x-id']).is.startingWith(file.id);
        assert.that(headers['x-name']).is.startingWith(file.name);
        assert.that(headers['content-type']).is.startingWith('text/plain');
        assert.that(headers['content-length']).is.equalTo(`${file.content.length}`);
        assert.that(data).is.equalTo(file.content);
      });
    });

    suite('POST /remove-file', (): void => {
      test('returns 415 if the content-type header is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          headers: {
            'content-type': 'invalid-content-type'
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
      });

      test('returns 401 if the removing file hook throws a not authenticated exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'removingFile-unauthenticated',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          data: { id: file.id },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(401);
      });

      test('returns 500 if the removing file hook throws another exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'removingFile-failure',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          data: { id: file.id },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });

      test('returns 500 if the removed file hook throws an exception.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': 'removedFile-failure',
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          data: { id: file.id },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
      });

      test('returns 200 and removes the given file.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/add-file',
          headers: {
            'x-id': file.id,
            'x-name': file.name,
            'content-type': 'text/plain'
          },
          data: Readable.from(file.content)
        });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          data: { id: file.id },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(200);
        await assert.that(async (): Promise<void> => {
          await fileStore.getMetadata({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileNotFound.code);
      });

      test('returns 404 if the given file does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/remove-file',
          data: { id: file.id },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(404);
      });
    });
  });
});
