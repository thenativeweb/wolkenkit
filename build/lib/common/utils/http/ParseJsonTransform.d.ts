/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
declare class ParseJsonTransform extends Transform {
    constructor();
    _transform(chunk: any, encoding: string, next: TransformCallback): void;
}
export { ParseJsonTransform };
