import { isEqual } from 'lodash';
import { Transform, TransformCallback } from 'stream';

class FilterHeartbeatsTransform extends Transform {
  public constructor () {
    super({
      objectMode: true
    });
  }

  /* eslint-disable @typescript-eslint/naming-convention, no-underscore-dangle, class-methods-use-this */
  public _transform (streamItem: any, encoding: string, next: TransformCallback): void {
    if (isEqual(streamItem, { name: 'heartbeat' })) {
      return next();
    }

    next(null, streamItem);
  }
  /* eslint-enable no-underscore-dangle, class-methods-use-this */
}

export {
  FilterHeartbeatsTransform
};
