import { ip } from './ip';
import { promises as dns, LookupAddress } from 'dns';
import { isEqual, uniqWith } from 'lodash';

const { lookup } = dns;

const getIpAddresses = async function (
  hostOrIp: string
): Promise<{ address: string; family: number }[]> {
  if (ip.is(hostOrIp)) {
    return [{ address: hostOrIp, family: ip.getFamily(hostOrIp) }];
  }

  const addresses = await lookup(hostOrIp, { all: true });

  const mappedAddresses = addresses.map((address): LookupAddress => ({
    address: address.address,
    family: address.family
  }));

  const uniqueAddresses = uniqWith(mappedAddresses, isEqual);

  return uniqueAddresses;
};

export { getIpAddresses };
