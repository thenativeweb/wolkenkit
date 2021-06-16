import { Claims } from 'limes';
import { Request } from 'express';
declare class ClientMetadata {
    token: string;
    user: {
        id: string;
        claims: Claims;
    };
    ip: string;
    constructor({ req }: {
        req: Request;
    });
}
export { ClientMetadata };
