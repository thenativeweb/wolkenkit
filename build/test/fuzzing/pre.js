#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buildImages_1 = require("../../docker/buildImages");
const flaschenpost_1 = require("flaschenpost");
const containers_1 = require("../shared/containers");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async function () {
    const logger = flaschenpost_1.flaschenpost.getLogger();
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