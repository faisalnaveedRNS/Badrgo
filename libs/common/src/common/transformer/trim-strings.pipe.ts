import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Trims every string in the incoming body/query before validation runs.
 */
@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform(values: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom' || !values || typeof values !== 'object') return values;
    return this.trim(values);
  }

  private trim(values: any) {
    Object.keys(values).forEach((key) => {
      if (key === 'password') return;

      const value = values[key];
      if (typeof value === 'string') values[key] = value.trim();
      else if (value !== null && typeof value === 'object') this.trim(value);
    });

    return values;
  }
}
