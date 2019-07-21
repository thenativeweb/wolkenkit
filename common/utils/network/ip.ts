import isIp from 'is-ip';

const ip = {
  is (text: string): boolean {
    return isIp(text);
  },

  isV4 (text: string): boolean {
    return isIp.v4(text);
  },

  isV6 (text: string): boolean {
    return isIp.v6(text);
  },

  getFamily (text: string): number {
    if (!isIp(text)) {
      throw new Error('Invalid IP address.');
    }

    if (isIp.v4(text)) {
      return 4;
    }
    if (isIp.v6(text)) {
      return 6;
    }

    throw new Error('Unknown family.');
  }
};

export default ip;
