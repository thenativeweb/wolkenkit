export declare type OnReceiveMessage = ({ channel, message }: {
    channel: string;
    message: object;
}) => Promise<void>;
