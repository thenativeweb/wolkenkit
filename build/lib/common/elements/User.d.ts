export interface User {
    id: string;
    claims: Record<string, any> & {
        sub: string;
    };
}
