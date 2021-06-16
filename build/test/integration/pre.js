#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildImages_1 = require("../../docker/buildImages");
const flaschenpost_1 = require("flaschenpost");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const containers_1 = require("../shared/containers");
const errors = __importStar(require("../../lib/common/errors"));
/* eslint-disable @typescript-eslint/no-floating-promises */
(async function () {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        const { code, stdout, stderr } = shelljs_1.default.exec('npx roboter build', { cwd: path_1.default.join(__dirname, '..', '..') });
        if (code !== 0) {
            throw new errors.CompilationFailed({ message: 'Failed to build wolkenkit.', data: { stdout, stderr } });
        }
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', { err: ex });
        process.exit(1);
    }
    try {
        await buildImages_1.buildImages();
        await Promise.all([
            containers_1.mariaDb.start(),
            containers_1.minio.start(),
            containers_1.mongoDb.start(),
            containers_1.mySql.start(),
            containers_1.postgres.start(),
            containers_1.redis.start(),
            containers_1.sqlServer.start()
        ]);
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', { err: ex });
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=pre.js.map