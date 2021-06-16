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
const assertthat_1 = require("assertthat");
const fs_1 = __importDefault(require("fs"));
const getTestApplicationDirectory_1 = require("../../../shared/applications/getTestApplicationDirectory");
const isolated_1 = require("isolated");
const loadApplication_1 = require("../../../../lib/common/application/loadApplication");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const errors = __importStar(require("../../../../lib/common/errors"));
suite('loadApplication', () => {
    test('throws an error if a non-existent directory is given.', async () => {
        await assertthat_1.assert.that(async () => {
            await loadApplication_1.loadApplication({ applicationDirectory: path_1.default.join(__dirname, 'does', 'not', 'exist') });
        }).is.throwingAsync((ex) => ex.code === errors.ApplicationNotFound.code);
    });
    test('throws an error if the given directory does not contain a package.json.', async () => {
        const applicationDirectory = await isolated_1.isolated();
        await assertthat_1.assert.that(async () => {
            await loadApplication_1.loadApplication({ applicationDirectory });
        }).is.throwingAsync((ex) => ex.code === errors.FileNotFound.code && ex.message === `File '<app>/package.json' not found.`);
    });
    test('throws an error if the given directory does not contain a build directory.', async () => {
        const applicationDirectory = await isolated_1.isolated();
        const packageManifestPath = path_1.default.join(applicationDirectory, 'package.json');
        await fs_1.default.promises.writeFile(packageManifestPath, JSON.stringify({
            name: 'app',
            version: '1.0.0'
        }, null, 2));
        await assertthat_1.assert.that(async () => {
            await loadApplication_1.loadApplication({ applicationDirectory });
        }).is.throwingAsync((ex) => ex.code === errors.DirectoryNotFound.code && ex.message === `Directory '<app>/build' not found.`);
    });
    test('loads the base application.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        assertthat_1.assert.that(application).is.atLeast({
            domain: {
                sampleContext: {
                    sampleAggregate: {
                        commandHandlers: {
                            execute: {}
                        },
                        domainEventHandlers: {
                            succeeded: {},
                            executed: {}
                        }
                    }
                }
            },
            flows: {
                sampleFlow: {
                    domainEventHandlers: {
                        sampleHandler: {}
                    }
                }
            },
            hooks: {},
            infrastructure: {
                ask: {},
                tell: {}
            },
            views: {
                sampleView: {
                    queryHandlers: {
                        all: {}
                    }
                }
            }
        });
    });
    test('adds system events and handlers.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'base' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        assertthat_1.assert.that(application).is.atLeast({
            domain: {
                sampleContext: {
                    sampleAggregate: {
                        domainEventHandlers: {
                            authenticateFailed: {},
                            authenticateRejected: {},
                            authorizeFailed: {},
                            authorizeRejected: {},
                            executeFailed: {},
                            executeRejected: {}
                        }
                    }
                }
            }
        });
        const userId = uuid_1.v4();
        assertthat_1.assert.that(application.domain.sampleContext.sampleAggregate.domainEventHandlers.authenticateFailed.isAuthorized({}, { metadata: { initiator: { user: { id: userId } } } }, { client: { user: { id: userId } } })).is.true();
        assertthat_1.assert.that(application.domain.sampleContext.sampleAggregate.domainEventHandlers.authenticateFailed.isAuthorized({}, { metadata: { initiator: { user: { id: userId } } } }, { client: { user: { id: uuid_1.v4() } } })).is.false();
    });
    test('applies aggregate enhancers.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withAggregateEnhancer' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        assertthat_1.assert.that(application).is.atLeast({
            domain: {
                sampleContext: {
                    sampleAggregate: {
                        commandHandlers: {
                            enhancedCommand: {}
                        },
                        domainEventHandlers: {
                            enhancedDomainEvent: {}
                        }
                    }
                }
            }
        });
    });
    test('applies flow enhancers.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withFlowEnhancer' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        assertthat_1.assert.that(application).is.atLeast({
            flows: {
                sampleFlow: {
                    domainEventHandlers: {
                        enhancedHandler: {}
                    }
                }
            }
        });
    });
    test('applies view enhancers.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withViewEnhancer' });
        const application = await loadApplication_1.loadApplication({ applicationDirectory });
        assertthat_1.assert.that(application).is.atLeast({
            views: {
                sampleView: {
                    queryHandlers: {
                        enhancedQuery: {}
                    }
                }
            }
        });
    });
    test('throws an error if the domain directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutDomainDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/domain' not found.`);
    });
    test('throws an error if the domain contains an empty aggregate directory.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withEmptyAggregateDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`No aggregate definition in '<app>/build/server/domain/sampleContext/emptyAggregate' found.`);
    });
    test('throws an error if an aggregate is malformed.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withInvalidAggregate' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Aggregate definition '<app>/build/server/domain/sampleContext/invalidAggregate' is malformed: Function 'getInitialState' is missing.`);
    });
    test('throws an error if the flows directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutFlowsDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/flows' not found.`);
    });
    test('throws an error if the flows contain an empty flow directory.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withEmptyFlowDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`No flow definition in '<app>/build/server/flows/emptyFlow' found.`);
    });
    test('throws an error if a flow is malformed.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withInvalidFlow' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Flow definition '<app>/build/server/flows/invalidFlow' is malformed: Object 'domainEventHandlers' is missing.`);
    });
    test('throws an error if the hooks directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutHooksDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/hooks' not found.`);
    });
    test('throws an error if the infrastructure directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutInfrastructureDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/infrastructure' not found.`);
    });
    test('throws an error if the notifications directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutNotificationsDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/notifications' not found.`);
    });
    test('throws an error if a notification handler in malformed.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withInvalidNotificationHandler' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Notifications definition '<app>/build/server/notifications' is malformed: Notification handler 'invalid' is malformed: Function 'isAuthorized' is missing.`);
    });
    test('throws an error if the views directory is missing.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withoutViewsDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`Directory '<app>/build/server/views' not found.`);
    });
    test('throws an error if the views contain an empty view directory.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withEmptyViewDirectory' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`No view definition in '<app>/build/server/views/emptyView' found.`);
    });
    test('throws an error if a view is malformed.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withInvalidView' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync(`View definition '<app>/build/server/views/invalidView' is malformed: Object 'queryHandlers' is missing.`);
    });
    test('throws an appropriate error if any file in the application contains a syntax error.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withSyntaxError' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync((ex) => ex.code === errors.ApplicationMalformed.code);
    });
    test('throws an appropriate error if any file in the application tries to import a non existent module.', async () => {
        const applicationDirectory = getTestApplicationDirectory_1.getTestApplicationDirectory({ name: 'withMissingModule' });
        await assertthat_1.assert.
            that(async () => loadApplication_1.loadApplication({ applicationDirectory })).
            is.throwingAsync((ex) => ex.code === errors.ApplicationMalformed.code);
    });
});
//# sourceMappingURL=loadApplicationTests.js.map