export interface S3FileStoreOptions {
    type: 'S3';
    hostName?: string;
    port?: number;
    encryptConnection?: boolean;
    accessKey: string;
    secretKey: string;
    region?: string;
    bucketName: string;
}
