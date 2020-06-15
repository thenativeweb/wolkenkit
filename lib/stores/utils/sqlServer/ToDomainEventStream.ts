import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { Transform } from 'stream';

class ToDomainEventStream extends Transform {
  protected column: string;

  public constructor ({ column = 'domainEvent' }: {
    column?: string;
  } = {}) {
    super({ objectMode: true });

    this.column = column;
  }

  // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/member-naming
  public _transform (row: any, _encoding: string, callback: Function): void {
    try {
      const domainEvent = new DomainEvent<DomainEventData>(JSON.parse(row[this.column]));

      this.push(domainEvent);

      return callback(null);
    } catch (ex) {
      return callback(ex);
    }
  }
}

export { ToDomainEventStream };
