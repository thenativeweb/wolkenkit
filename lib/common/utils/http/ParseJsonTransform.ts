import { Transform, TransformCallback } from 'stream';

class ParseJsonTransform extends Transform {
  public constructor () {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    });
  }

  /* eslint-disable @typescript-eslint/member-naming, no-underscore-dangle, class-methods-use-this */
  public _transform (chunk: any, encoding: string, next: TransformCallback): void {
    const data = JSON.parse(chunk.toString());

    next(null, data);
  }
  /* eslint-enable no-underscore-dangle, class-methods-use-this */
}

export {
  ParseJsonTransform
};
