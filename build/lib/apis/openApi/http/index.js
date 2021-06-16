"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const addRouteToPaths_1 = require("../addRouteToPaths");
const getApiBase_1 = require("../../base/getApiBase");
const http_1 = require("../../getStatic/http");
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const withLogMetadata_1 = require("../../../common/utils/logging/withLogMetadata");
const flaschenpost_1 = require("flaschenpost");
const logger = flaschenpost_1.flaschenpost.getLogger();
const getApi = async function ({ corsOrigin, application, title, version, description, schemes = ['https'], basePath = '/', tags = [], apis }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: { sizeLimit: 100000 } },
            query: { parser: { useJson: false } }
        },
        response: {
            headers: { cache: false }
        }
    });
    const paths = {};
    for (const apiDefinition of apis) {
        for (const route of apiDefinition.routes.get) {
            addRouteToPaths_1.addRouteToPaths({ route, method: 'get', basePath: apiDefinition.basePath, tags: apiDefinition.tags, paths });
        }
        for (const route of apiDefinition.routes.post) {
            addRouteToPaths_1.addRouteToPaths({ route, method: 'post', basePath: apiDefinition.basePath, tags: apiDefinition.tags, paths });
        }
    }
    const openApiDefinition = {
        openapi: '3.0.3',
        info: {
            title,
            version,
            description
        },
        schemes,
        basePath,
        tags: tags.map((tag) => ({ name: tag })),
        paths
    };
    logger.debug('Constructed openApi definition for documentation route.', withLogMetadata_1.withLogMetadata('api', 'openApi', { openApiDefinition }));
    const { api: staticApi } = await http_1.getApi({
        directory: path_1.default.join(__dirname, '..', '..', '..', '..', 'assets'),
        corsOrigin
    });
    api.use(flaschenpost_1.getMiddleware());
    api.use('/assets', staticApi);
    api.use('/', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDefinition, {
        customfavIcon: 'assets/favicon.png',
        customSiteTitle: `${application.packageManifest.name} | API documentation`,
        customCssUrl: 'assets/style.css'
    }));
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=index.js.map