import { Application } from 'express';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { cancelCommand } from './cancelCommand';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { OnCancelCommand } from '../../OnCancelCommand';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { postCommand } from './postCommand';

const getV2 = async function ({
  corsOrigin,
  onReceiveCommand,
  onCancelCommand,
  applicationDefinition
}: {
  corsOrigin: CorsOrigin;
  onReceiveCommand: OnReceiveCommand;
  onCancelCommand: OnCancelCommand;
  applicationDefinition: ApplicationDefinition;
}): Promise<{ api: Application }> {
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

  api.post(`/${postCommand.path}`, postCommand.getHandler({
    onReceiveCommand,
    applicationDefinition
  }));

  api.post(`/${cancelCommand.path}`, cancelCommand.getHandler({
    onCancelCommand,
    applicationDefinition
  }));

  return { api };
};

export { getV2 };
