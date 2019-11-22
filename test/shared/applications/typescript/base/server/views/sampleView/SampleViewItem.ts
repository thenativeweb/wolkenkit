export interface SampleViewItem {
  id: string;
  createdAt: number;
  updatedAt?: number;
  strategy: 'succeed' | 'fail' | 'reject';
}
