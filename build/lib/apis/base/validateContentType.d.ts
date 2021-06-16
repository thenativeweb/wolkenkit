import { Request } from 'express';
declare const validateContentType: ({ expectedContentType, req }: {
    expectedContentType: string;
    req: Request;
}) => void;
export { validateContentType };
