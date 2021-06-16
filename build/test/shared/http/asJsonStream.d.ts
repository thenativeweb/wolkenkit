import { Writable } from 'stream';
declare const asJsonStream: <TItem>(handleJson: ((item: TItem) => void)[], objectMode?: boolean) => Writable;
export { asJsonStream };
