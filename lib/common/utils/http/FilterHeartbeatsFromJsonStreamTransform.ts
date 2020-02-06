import { isEqual } from 'lodash';
import { Transform, TransformCallback } from 'stream';

// Takes in a buffer stream (as returned by APIs using the
// streamNdjsonMiddleware) and filters out the heartbeat lines and transforms
// the lines into objects.
class FilterHeartbeatsFromJsonStreamTransform extends Transform {
  public constructor () {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    });
  }

  /* eslint-disable @typescript-eslint/member-naming, no-underscore-dangle, class-methods-use-this */
  public _transform (chunk: any, encoding: string, next: TransformCallback): void {
    const data = JSON.parse(chunk.toString());

    if (isEqual(data, { name: 'heartbeat' })) {
      return next();
    }

    next(null, data);
  }
  /* eslint-enable no-underscore-dangle, class-methods-use-this */
}

export {
  FilterHeartbeatsFromJsonStreamTransform
};
