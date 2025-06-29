import { Pipe, PipeTransform } from '@angular/core';
import { bigIntToAddrHex } from '../utils/eth-utils';

@Pipe({
  name: 'bigIntToEthAddress'
})
export class BigIntToEthAddressPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return bigIntToAddrHex(value);
    } else {
      return value;
    }
  }
}
