/// <reference types="node" />
import { Server } from 'http';
export declare type InitializeGraphQlOnServer = ({ server }: {
    server: Server;
}) => Promise<void>;
