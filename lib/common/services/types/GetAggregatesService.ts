import { AggregatesService } from '../AggregatesService';
import { ApplicationDefinition } from '../../application/ApplicationDefinition';
import { Repository } from '../../domain/Repository';

export type GetAggregatesService = (parameters: {
  repository: Repository;
}) => AggregatesService;
