import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
declare const getTestsFor: ({ createLockStore }: {
    createLockStore: ({ suffix }: {
        suffix: string;
    }) => Promise<LockStore>;
}) => void;
export { getTestsFor };
