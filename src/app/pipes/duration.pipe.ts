import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
})
export class DurationPipe implements PipeTransform {
  transform(seconds: unknown): unknown {
    if (typeof seconds === 'bigint') {
      if (seconds < 60n) {
        const value = seconds;
        const unit = value === 1n ? 'second' : 'seconds';
        return `${value} ${unit}`;
      } else if (seconds < 3600n) {
        const value = seconds / 60n;
        const unit = value === 1n ? 'minute' : 'minutes';
        return `${value} ${unit}`;
      } else if (seconds < 86400n) {
        const value = seconds / 3600n;
        const unit = value === 1n ? 'hour' : 'hours';
        return `${value} ${unit}`;
      } else if (seconds < 31536000n) {
        const value = seconds / 86400n;
        const unit = value === 1n ? 'day' : 'days';
        return `${value} ${unit}`;
      } else {
        const value = seconds / 31536000n;
        const unit = value === 1n ? 'year' : 'years';
        return `${value} ${unit}`;
      }
    } else {
      return seconds;
    }
  }
}
