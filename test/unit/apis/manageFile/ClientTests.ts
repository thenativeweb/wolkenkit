import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/manageFile/http/v2/Client';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
import { getApi } from '../../../../lib/apis/manageFile/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { InMemoryFileStore } from '../../../../lib/stores/fileStore/InMemory/InMemoryFileStore';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { Readable } from 'stream';
import { runAsServer } from '../../../shared/http/runAsServer';
import streamToString from 'stream-to-string';
import { v4 } from 'uuid';

suite('manageFile/http/Client', (): void => {
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
      fileStore = await InMemoryFileStore.create();

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

    suite('addFile', (): void => {
      test('throws a not authorized exception if the adding file hook throws a not authorized exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.addFile({
            id: file.id,
            name: 'addingFile-unauthorized',
            contentType: 'text/plain',
            stream: Readable.from(file.content)
          });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.NotAuthenticated.code);
      });

      test('throws an unknown error if the adding file hook throws another exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.addFile({
            id: file.id,
            name: 'addingFile-failure',
            contentType: 'text/plain',
            stream: Readable.from(file.content)
          });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.UnknownError.code);
      });

      test('throws an unknown error if the added file hook throws an exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.addFile({
            id: file.id,
            name: 'addedFile-failure',
            contentType: 'text/plain',
            stream: Readable.from(file.content)
          });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.UnknownError.code);
      });

      test('adds the given file.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        assert.that(await fileStore.getMetadata({ id: file.id })).is.equalTo({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          contentLength: file.content.length
        });
      });

      test('throws a file already exists error when the file to upload already exists.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.addFile({
            id: file.id,
            name: file.name,
            contentType: 'text/plain',
            stream: Readable.from(file.content)
          });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileAlreadyExists.code);
      });
    });

    suite('getFile', (): void => {
      test('throws a not authorized exception if the getting file hook throws a not authorized exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'gettingFile-unauthorized',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.getFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.NotAuthenticated.code);
      });

      test('throws an unknown error if the getting file hook throws any other exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'gettingFile-failure',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.getFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.UnknownError.code);
      });

      test('returns the file even if the got file hook throws an exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'gotFile-failure',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        const { stream } = await client.getFile({ id: file.id });
        const content = await streamToString(stream);

        assert.that(content).is.equalTo(file.content);
      });

      test('throws a file not found exception if the requested file does not exist.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.getFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileNotFound.code);
      });

      test('returns the requested file and its metadata.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        const { id, name, contentType, stream } = await client.getFile({ id: file.id });
        const content = await streamToString(stream);

        assert.that(id).is.equalTo(file.id);
        assert.that(name).is.equalTo(file.name);
        assert.that(contentType).is.startingWith('text/plain');
        assert.that(content).is.equalTo(file.content);
      });
    });

    suite('removeFile', (): void => {
      test('throws a not authenticated if the removing file hook throws a not authorized exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'removingFile-unauthorized',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.removeFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.NotAuthenticated.code);
      });

      test('throws an unknown error if the removing file hook throws another exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'removingFile-failure',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.removeFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.UnknownError.code);
      });

      test('throws an unknown error if the removed file hook throws an exception.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: 'removedFile-failure',
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await assert.that(async (): Promise<void> => {
          await client.removeFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.UnknownError.code);
      });

      test('removes the given file.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.addFile({
          id: file.id,
          name: file.name,
          contentType: 'text/plain',
          stream: Readable.from(file.content)
        });

        await client.removeFile({ id: file.id });

        await assert.that(async (): Promise<void> => {
          await fileStore.getMetadata({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileNotFound.code);
      });

      test('returns a file not found exception if the given file does not exist.', async (): Promise<void> => {
        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.removeFile({ id: file.id });
        }).is.throwingAsync<CustomError>((ex): boolean => ex.code === errors.FileNotFound.code);
      });
    });
  });
});
