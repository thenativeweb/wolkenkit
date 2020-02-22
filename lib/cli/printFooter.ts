import { buntstift } from 'buntstift';
import { emojis } from './emojis';
import { sample } from 'lodash';

const printFooter = function (): void {
  buntstift.info('If you experience any difficulties, please go to:');
  buntstift.newLine();
  buntstift.info('  https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/getting-help/');
  buntstift.newLine();
  buntstift.info(`Thank you for using wolkenkit ${sample(emojis)}`);
};

export { printFooter };
