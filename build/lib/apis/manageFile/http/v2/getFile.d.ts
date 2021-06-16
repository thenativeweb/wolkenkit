import { Application } from '../../../../common/application/Application';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getFile: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCodes: number[];
        stream: boolean;
    };
    getHandler({ application, fileStore }: {
        application: Application;
        fileStore: FileStore;
    }): WolkenkitRequestHandler;
};
export { getFile };
