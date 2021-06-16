import { RouteDefinition } from './RouteDefinition';
declare const addRouteToPaths: ({ route, method, basePath, tags, paths }: {
    route: RouteDefinition;
    method: 'get' | 'post';
    basePath: string;
    tags: string[];
    paths: any;
}) => void;
export { addRouteToPaths };
