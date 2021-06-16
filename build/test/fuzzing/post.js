#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flaschenpost_1 = require("flaschenpost");
const containers_1 = require("../shared/containers");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async function () {
    const logger = flaschenpost_1.flaschenpost.getLogger();
    try {
        await Promise.all([
            containers_1.mariaDb.stop(),
            containers_1.minio.stop(),
            containers_1.mongoDb.stop(),
            containers_1.mySql.stop(),
            containers_1.postgres.stop(),
            containers_1.redis.stop(),
            containers_1.sqlServer.stop()
        ]);
    }
    catch (ex) {
        logger.fatal('An unexpected error occured.', { err: ex });
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=post.js.map