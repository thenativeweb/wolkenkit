/// <reference types="node" />
import { Transform, TransformCallback } from 'stream';
declare class FilterHeartbeatsTransform extends Transform {
    constructor();
    _transform(streamItem: any, encoding: string, next: TransformCallback): void;
}
export { FilterHeartbeatsTransform };
