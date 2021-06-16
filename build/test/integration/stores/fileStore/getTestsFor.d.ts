import { FileStore } from '../../../../lib/stores/fileStore/FileStore';
declare const getTestsFor: ({ createFileStore }: {
    createFileStore: () => Promise<FileStore>;
}) => void;
export { getTestsFor };
