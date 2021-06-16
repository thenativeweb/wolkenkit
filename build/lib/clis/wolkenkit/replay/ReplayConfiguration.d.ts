interface ReplayConfiguration {
    flows?: string[];
    contexts?: {
        contextName: string;
        aggregates?: {
            aggregateName: string;
            instances?: {
                aggregateId: string;
                from?: number;
                to?: number;
            }[];
        }[];
    }[];
}
export type { ReplayConfiguration };
