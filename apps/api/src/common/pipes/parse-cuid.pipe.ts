import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isCuid } from '../validation/cuid';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isCuid(value)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Identificador inválido.',
        },
      });
    }
    return value;
  }
}
