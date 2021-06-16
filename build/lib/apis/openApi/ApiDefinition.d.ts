import { RouteDefinition } from './RouteDefinition';
export interface ApiDefinition {
    basePath: string;
    routes: {
        get: RouteDefinition[];
        post: RouteDefinition[];
    };
    tags: string[];
}
