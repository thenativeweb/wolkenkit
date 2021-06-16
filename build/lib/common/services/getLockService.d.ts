import { LockService } from './LockService';
import { LockStore } from '../../stores/lockStore/LockStore';
declare const getLockService: ({ lockStore }: {
    lockStore: LockStore;
}) => LockService;
export { getLockService };
