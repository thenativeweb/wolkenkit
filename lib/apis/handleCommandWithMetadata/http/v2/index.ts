import { Application } from '../../../../common/application/Application';
import { cancelCommand } from './cancelCommand';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { getApiBase } from '../../../base/getApiBase';
import { getMiddleware as getLoggingMiddleware } from 'flaschenpost';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { postCommand } from './postCommand';

const getV2 = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  application
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  application: Application;
}): Promise<{ api: ExpressApplication }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }},
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.use(getLoggingMiddleware());

  api.post(`/${postCommand.path}`, postCommand.getHandler({
    onReceiveCommand,
    application
  }));

  api.post(`/${cancelCommand.path}`, cancelCommand.getHandler({
    onCancelCommand,
    application
  }));

  return { api };
};

export { getV2 };
