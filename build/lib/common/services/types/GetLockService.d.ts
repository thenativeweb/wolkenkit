import { LockService } from '../LockService';
import { LockStore } from '../../../stores/lockStore/LockStore';
export declare type GetLockService = (parameters: {
    lockStore: LockStore;
}) => LockService;
