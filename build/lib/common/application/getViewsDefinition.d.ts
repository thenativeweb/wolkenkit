import { ViewsDefinition } from './ViewsDefinition';
declare const getViewsDefinition: ({ viewsDirectory }: {
    viewsDirectory: string;
}) => Promise<ViewsDefinition>;
export { getViewsDefinition };
