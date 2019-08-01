import _ from 'lodash';
import ip from './ip';
import * as dns from 'dns';

const { isEqual, uniqWith } = _;
const { lookup } = dns.promises;

const getIpAddresses = async function (
  hostOrIp: string
): Promise<{ address: string; family: number }[]> {
  if (ip.is(hostOrIp)) {
    return [{ address: hostOrIp, family: ip.getFamily(hostOrIp) }];
  }

  const addresses = await lookup(hostOrIp, { all: true });

  const mappedAddresses = addresses.map((address): dns.LookupAddress => ({
    address: address.address,
    family: address.family
  }));

  const uniqueAddresses = uniqWith(mappedAddresses, isEqual);

  return uniqueAddresses;
};

export default getIpAddresses;
