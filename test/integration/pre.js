"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildImages_1 = __importDefault(require("../../docker/buildImages"));
const containers_1 = __importDefault(require("../shared/containers"));
const pre = async function () {
    await buildImages_1.default();
    await Promise.all([
        containers_1.default.mariaDb.start(),
        containers_1.default.minio.start(),
        containers_1.default.mongoDb.start(),
        containers_1.default.mySql.start(),
        containers_1.default.postgres.start(),
        containers_1.default.redis.start(),
        containers_1.default.sqlServer.start()
    ]);
};
module.exports = pre;
