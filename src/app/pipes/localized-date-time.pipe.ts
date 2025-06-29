import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localizedDateTime',
  standalone: true,
})
export class LocalizedDateTimePipe implements PipeTransform {
  transform(value: number | bigint | null | undefined, locale?: string): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const timestamp = typeof value === 'bigint' ? Number(value) : value;
    const date = new Date(timestamp * 1000);

    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date.toLocaleString(locale);
  }
}
