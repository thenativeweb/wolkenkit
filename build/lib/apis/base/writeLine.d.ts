import { Response } from 'express';
declare const writeLine: ({ res, data }: {
    res: Response;
    data: object;
}) => void;
export { writeLine };
