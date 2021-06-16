"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const connectionOptions_1 = require("../../../../shared/containers/connectionOptions");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const uuid_1 = require("uuid");
const rootPath = path_1.default.join(__dirname, '..', '..', '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup store lock redis', function () {
    this.timeout(30000);
    test(`sets up a redis database for a lock store.`, async () => {
        const { hostName, port, password, database } = connectionOptions_1.connectionOptions.redis;
        const listNameLocks = uuid_1.v4();
        const setupPostgresLockStoreCommand = `node ${cliPath} --verbose setup store lock redis --host-name ${hostName} --port ${port} --password ${password} --database ${database} --list-name-locks ${listNameLocks}`;
        const { stdout } = shelljs_1.default.exec(setupPostgresLockStoreCommand, { silent: false });
        assertthat_1.assert.that(stdout).is.containing('Successfully set up the Redis lock store.');
        // There is nothing to test here, since the redis setup does not prepare anything.
    });
});
//# sourceMappingURL=redisTests.js.map