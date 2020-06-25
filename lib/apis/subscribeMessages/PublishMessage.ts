export type PublishMessage = ({ channel, message }: {
  channel: string;
  message: object;
}) => void;
