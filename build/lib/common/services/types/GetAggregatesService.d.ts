import { AggregatesService } from '../AggregatesService';
import { Repository } from '../../domain/Repository';
export declare type GetAggregatesService = (parameters: {
    repository: Repository;
}) => AggregatesService;
