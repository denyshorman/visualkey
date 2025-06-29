import { Pipe, PipeTransform } from '@angular/core';
import { formatEther } from 'viem';

@Pipe({
  name: 'weiToEth',
})
export class WeiToEthPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return formatEther(value);
    } else {
      return value;
    }
  }
}
