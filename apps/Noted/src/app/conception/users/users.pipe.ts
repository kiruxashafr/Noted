import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class UsersPipe
  implements PipeTransform<string | undefined, number | undefined>
{
  transform(value: string | undefined): number | undefined {
    console.log('Pipe value:', value);

    if (value === undefined || value === '') {
      return undefined;
    }

    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
