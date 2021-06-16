import { WolkenkitRequestHandler } from '../../../lib/apis/base/WolkenkitRequestHandler';
declare const startCatchAllServer: ({ portOrSocket, onRequest, parseJson }: {
    portOrSocket: number | string;
    onRequest: WolkenkitRequestHandler;
    parseJson?: boolean | undefined;
}) => Promise<void>;
export { startCatchAllServer };
