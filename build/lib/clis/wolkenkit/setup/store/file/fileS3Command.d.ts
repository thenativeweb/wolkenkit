import { Command } from 'command-line-interface';
import { FileS3Options } from './FileS3Options';
declare const fileS3Command: () => Command<FileS3Options>;
export { fileS3Command };
