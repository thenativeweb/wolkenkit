import { Transform, TransformCallback } from 'stream';

class ParseJsonTransform extends Transform {
  public constructor () {
    super({
      readableObjectMode: true,
      writableObjectMode: false
    });
  }

  /* eslint-disable @typescript-eslint/naming-convention, no-underscore-dangle */
  public _transform (chunk: any, encoding: string, next: TransformCallback): void {
    const text = chunk.toString();

    const parts = text.split('\n');

    for (const part of parts) {
      if (part !== '') {
        const data = JSON.parse(part);

        this.push(data);
      }
    }

    next(null);
  }
  /* eslint-enable @typescript-eslint/naming-convention, no-underscore-dangle */
}

export {
  ParseJsonTransform
};
