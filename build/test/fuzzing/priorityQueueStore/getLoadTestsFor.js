"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoadTestsFor = void 0;
const fs_1 = __importDefault(require("fs"));
const getShortId_1 = require("../../shared/getShortId");
const naughtyStrings_1 = __importDefault(require("../naughtyStrings"));
const PriorityQueueObserver_1 = require("../../../lib/stores/priorityQueueStore/Observer/PriorityQueueObserver");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const p_forever_1 = __importDefault(require("p-forever"));
const Observer_1 = require("../../../lib/stores/priorityQueueStore/Observer");
const lodash_1 = require("lodash");
const getLogFile = function ({ queueType }) {
    return path_1.default.join(os_1.default.tmpdir(), `pqueue-fuzzing-${queueType}-${Date.now()}.log`);
};
const generateRandomItem = function () {
    return {
        priority: Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)),
        discriminator: `${lodash_1.sample(lodash_1.range(0, 10))}`,
        item: {
            id: lodash_1.sample(naughtyStrings_1.default)
        }
    };
};
const sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
const getLoadTestsFor = function ({ createPriorityQueueStore, queueType }) {
    test('priority queue store fuzzing.', async function () {
        const overallExecutionTime = 3.6e6;
        const expirationTime = 2000;
        const maxInsertionDelay = 100;
        const workerCount = 8;
        const maxIterationCount = 4;
        const renewFailureRate = 0.2;
        const repeatAckOrDeferRate = 0.2;
        const maxSleepTime = (1 / (1 - renewFailureRate)) * expirationTime;
        this.timeout(overallExecutionTime +
            maxInsertionDelay +
            (maxSleepTime * maxIterationCount) +
            2000);
        const observedQueue = await createPriorityQueueStore({ suffix: getShortId_1.getShortId(), expirationTime });
        const priorityQueueObserver = await Observer_1.PriorityQueueObserver.create({ observedQueue });
        await priorityQueueObserver.setup();
        let stopSignal = false;
        const insertItemWorker = async () => {
            await priorityQueueObserver.enqueue(generateRandomItem());
        };
        const consumeItemWorker = async () => {
            const cases = [
                'acknowledge',
                'defer',
                'die'
            ];
            const chosenCase = lodash_1.sample(cases);
            const iterationCount = lodash_1.sample(lodash_1.range(0, maxIterationCount + 1));
            const sleepInterval = Math.random() * maxSleepTime;
            const item = await priorityQueueObserver.lockNext();
            if (item === undefined) {
                return;
            }
            for (let currentIteration = 0; currentIteration < iterationCount; currentIteration++) {
                await sleep(sleepInterval);
                await priorityQueueObserver.renewLock(item.metadata);
            }
            if (chosenCase === 'die') {
                return;
            }
            let operation;
            switch (chosenCase) {
                case 'acknowledge': {
                    operation = async () => {
                        await priorityQueueObserver.acknowledge(item.metadata);
                    };
                    break;
                }
                case 'defer': {
                    operation = async () => {
                        await priorityQueueObserver.defer({
                            priority: Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)),
                            ...item.metadata
                        });
                    };
                    break;
                }
                default: {
                    throw new Error('Invalid operation.');
                }
            }
            await operation();
            while (Math.random() < repeatAckOrDeferRate) {
                await operation();
            }
        };
        const promises = [
            p_forever_1.default(async () => {
                if (stopSignal) {
                    return p_forever_1.default.end;
                }
                try {
                    await insertItemWorker();
                }
                catch {
                    // Intentionally left blank.
                }
                await sleep(Math.random() * maxInsertionDelay);
            }),
            ...Array.from({ length: workerCount }).fill(null).map(async () => {
                await p_forever_1.default(async () => {
                    if (stopSignal) {
                        return p_forever_1.default.end;
                    }
                    try {
                        await consumeItemWorker();
                    }
                    catch {
                        // Intentionally left blank.
                    }
                    await sleep(Math.random() * maxSleepTime);
                });
            })
        ];
        const observerStreamHandler = (async () => {
            const logFileStream = fs_1.default.createWriteStream(getLogFile({ queueType }), {
                flags: 'w',
                encoding: 'utf-8'
            });
            for await (const data of priorityQueueObserver.getEvents()) {
                logFileStream.write(JSON.stringify(data), 'utf-8');
                switch (data.type) {
                    case 'error': {
                        throw new PriorityQueueObserver_1.observerErrors.ObserverError({
                            message: 'An unexpected error occurred during fuzzing. This is a potential bug!',
                            data: data.data.ex
                        });
                    }
                    default: {
                        break;
                    }
                }
            }
        })();
        setTimeout(async () => {
            stopSignal = true;
        }, overallExecutionTime);
        await Promise.all(promises);
        await priorityQueueObserver.destroy();
        await observerStreamHandler;
    });
};
exports.getLoadTestsFor = getLoadTestsFor;
//# sourceMappingURL=getLoadTestsFor.js.map