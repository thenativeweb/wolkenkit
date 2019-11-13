import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { postDomainEvent } from './postDomainEvent';

class V2 {
  public api: Express;

  protected applicationDefinition: ApplicationDefinition;

  public constructor ({
    onReceiveDomainEvent,
    applicationDefinition
  }: {
    onReceiveDomainEvent: OnReceiveDomainEvent;
    applicationDefinition: ApplicationDefinition;
  }) {
    this.applicationDefinition = applicationDefinition;

    this.api = express();

    this.api.post('/', postDomainEvent({
      onReceiveDomainEvent,
      applicationDefinition
    }));
  }
}

export { V2 };
