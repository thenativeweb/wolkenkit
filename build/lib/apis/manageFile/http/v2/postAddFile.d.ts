import { Application } from '../../../../common/application/Application';
import { FileStore } from '../../../../stores/fileStore/FileStore';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const postAddFile: {
    description: string;
    path: string;
    request: {
        headers: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ application, fileStore }: {
        application: Application;
        fileStore: FileStore;
    }): WolkenkitRequestHandler;
};
export { postAddFile };
