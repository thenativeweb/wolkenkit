/// <reference types="node" />
import { Transform } from 'stream';
declare class ToDomainEventStream extends Transform {
    protected column: string;
    constructor({ column }?: {
        column?: string;
    });
    _transform(row: any, _encoding: string, callback: (error: any) => void): void;
}
export { ToDomainEventStream };
