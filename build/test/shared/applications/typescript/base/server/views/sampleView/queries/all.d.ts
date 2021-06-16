import { Infrastructure } from '../../../infrastructure';
import { QueryHandler, QueryResultItem } from 'wolkenkit';
export interface AllResultItem extends QueryResultItem {
    id: string;
    createdAt: number;
    updatedAt: number;
    strategy: 'succeed' | 'fail' | 'reject';
}
export declare const all: QueryHandler<AllResultItem, Infrastructure>;
