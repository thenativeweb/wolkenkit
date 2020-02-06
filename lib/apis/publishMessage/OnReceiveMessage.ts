export type OnReceiveMessage = ({ message }: {
  message: object;
}) => Promise<void>;
