import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { businessError } from '../errors/business-error';

function walkErrors(
  errors: ValidationError[],
  prefix = '',
): { field: string; reason: string }[] {
  const out: { field: string; reason: string }[] = [];
  for (const e of errors) {
    const field = prefix ? `${prefix}${e.property}` : e.property;
    if (e.constraints && Object.keys(e.constraints).length > 0) {
      out.push({
        field,
        reason: Object.values(e.constraints).join('; '),
      });
    }
    if (e.children?.length) {
      out.push(...walkErrors(e.children, `${field}.`));
    }
  }
  return out;
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const details = walkErrors(errors);
  return new BadRequestException(
    businessError('VALIDATION_ERROR', {
      details: details.map((d) => ({
        field: d.field,
        reason: d.reason,
      })),
    }),
  );
}
