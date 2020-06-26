import { Server } from 'http';

export type InitializeGraphQlOnServer = ({ server }: {
  server: Server;
}) => Promise<void>;
