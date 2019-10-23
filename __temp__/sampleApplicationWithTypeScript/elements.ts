import Aggregate from '../../lib/common/domain/Aggregate';
import AggregateApiForCommands from '../../lib/common/domain/AggregateApiForCommands';
import AggregateApiForReadOnly from '../../lib/common/domain/AggregateApiForReadOnly';
import Command from '../../lib/common/elements/Command';
import { CommandData } from '../../lib/common/elements/CommandData';
import { CommandHandler } from '../../lib/common/elements/CommandHandler';
import DomainEvent from '../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../lib/common/elements/DomainEventData';
import { DomainEventHandler } from '../../lib/common/elements/DomainEventHandler';
import { Schema } from '../../lib/common/elements/Schema';

export {
  Aggregate,
  AggregateApiForCommands,
  AggregateApiForReadOnly,
  Command,
  CommandData,
  CommandHandler,
  DomainEvent,
  DomainEventData,
  DomainEventHandler,
  Schema
};

/* eslint-disable class-methods-use-this, no-console */
export class Services {
  public aggregate = {
    id: '3ddbaa27-e72f-4912-a273-77a177935b67',

    exists (): boolean {
      return true;
    },

    publishEvent <TDomainEventData extends DomainEventData> (_eventName: string, _data: TDomainEventData): void {
      // ...
    }
  };

  public logger = {
    debug (message: string): void {
      console.log(message);
    },
    info (message: string): void {
      console.log(message);
    },
    warn (message: string): void {
      console.log(message);
    },
    error (message: string): void {
      console.log(message);
    },
    fatal (message: string): void {
      console.log(message);
    }
  };
}
/* eslint-enable class-methods-use-this, no-console */
