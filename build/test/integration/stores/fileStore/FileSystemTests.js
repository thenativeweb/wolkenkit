"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FileSystem_1 = require("../../../../lib/stores/fileStore/FileSystem");
const getTestsFor_1 = require("./getTestsFor");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
suite('FileSystem', () => {
    getTestsFor_1.getTestsFor({
        async createFileStore() {
            const temporaryDirectory = await isolated_1.isolated();
            const storeDirectory = path_1.default.join(temporaryDirectory, 'fileStore');
            return await FileSystem_1.FileSystemFileStore.create({
                type: 'FileSystem',
                directory: storeDirectory
            });
        }
    });
});
//# sourceMappingURL=FileSystemTests.js.map