import { errors } from '../../../../common/errors';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { flaschenpost } from 'flaschenpost';
import { isUuid } from 'uuidv4';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postAddFile = {
  description: 'Adds a file.',
  path: 'add-file',

  request: {},
  response: {
    statusCodes: [ 200, 400, 401, 409 ],
    body: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    }
  },

  getHandler ({ fileStore }: {
    fileStore: FileStore;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(postAddFile.response.body);

    return async function (req, res): Promise<any> {
      // const { user } = req;
      //
      // if (!user) {
      //   throw new errors.InvalidOperation();
      // }
      //
      // let metadata;
      //
      // try {
      //   metadata = JSON.parse(req.headers['x-metadata'] as string);
      // } catch {
      //   return res.status(400).send('Header x-metadata is malformed.');
      // }
      //
      // const {
      //   id,
      //   fileName,
      //   contentType = 'application/octet-stream'
      // } = metadata;
      //
      // if (!id) {
      //   return res.status(400).send('Id is missing.');
      // }
      // if (!isUuid(id)) {
      //   return res.status(400).send('Id is malformed.');
      // }
      // if (!fileName) {
      //   return res.status(400).send('File name is missing.');
      // }
      //
      // try {
      //   await fileStore.addFile({ id, fileName, contentType, stream: req });
      //
      //   res.status(200).end();
      // } catch (ex) {
      //   logger.error('Failed to add file.', { err: ex });
      //
      //   if (ex.code === 'EFILEALREADYEXISTS') {
      //     return res.status(409).end();
      //   }
      //
      //   res.status(500).end();
      // }

      try {
        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { postAddFile };
