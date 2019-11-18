import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { postCommandWithMetadata } from './postCommandWithMetadata';

class V2 {
  public api: Express;

  protected applicationDefinition: ApplicationDefinition;

  public constructor ({
    onReceiveCommand,
    applicationDefinition
  }: {
    onReceiveCommand: OnReceiveCommand;
    applicationDefinition: ApplicationDefinition;
  }) {
    this.applicationDefinition = applicationDefinition;

    this.api = express();

    this.api.post('/', postCommandWithMetadata({
      onReceiveCommand,
      applicationDefinition
    }));
  }
}

export { V2 };
