import { User } from './User';
export interface Client {
    token: string;
    user: User;
    ip: string;
}
