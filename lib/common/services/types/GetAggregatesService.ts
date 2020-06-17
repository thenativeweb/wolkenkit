import { AggregatesService } from '../AggregatesService';
import { Repository } from '../../domain/Repository';

export type GetAggregatesService = (parameters: {
  repository: Repository;
}) => AggregatesService;
