import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import type { ApiErrorEnvelope } from '../types/api-error.types';

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
  const body: ApiErrorEnvelope = {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Dados de entrada inválidos.',
      details: details.map((d) => ({
        field: d.field,
        reason: d.reason,
      })),
    },
  };
  return new BadRequestException(body);
}
