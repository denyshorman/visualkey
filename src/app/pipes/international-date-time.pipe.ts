import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'internationalDateTime',
})
export class InternationalDateTimePipe implements PipeTransform {
  transform(value: number | bigint | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const epochMillis = typeof value === 'bigint' ? Number(value) * 1000 : value * 1000;
    const date = new Date(epochMillis);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes} UTC`;
  }
}
