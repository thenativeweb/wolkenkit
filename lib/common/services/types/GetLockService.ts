import { LockService } from '../LockService';
import { LockStore } from '../../../stores/lockStore/LockStore';

export type GetLockService = (parameters: {
  lockStore: LockStore;
}) => LockService;
