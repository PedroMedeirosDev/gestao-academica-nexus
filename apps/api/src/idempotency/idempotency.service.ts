import { ConflictException, Injectable } from '@nestjs/common';
import { businessError } from '../common/errors/business-error';
import { PrismaService } from '../prisma/prisma.service';
import { bodySha256 } from './canonical-body';

/** Alinhado a `docs/specs/platform/api.spec.md` §6 (janela configurável). */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export type ExecuteOrReplayOptions<T> = {
  scope: string;
  userId: string;
  idempotencyKey?: string | undefined;
  requestBody: unknown;
  execute: () => Promise<T>;
  /** HTTP da resposta armazenada (útil quando não for 200). */
  successStatusCode?: number;
};

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sem header `Idempotency-Key`: executa `execute()` normalmente.
   * Com chave: mesmo usuário + escopo + chave + janela TTL → mesmo corpo = replay da resposta gravada;
   * corpo diferente → 409 `IDEMPOTENCY_KEY_CONFLICT`.
   */
  async executeOrReplay<T>(opts: ExecuteOrReplayOptions<T>): Promise<T> {
    const {
      scope,
      userId,
      idempotencyKey,
      requestBody,
      execute,
      successStatusCode = 200,
    } = opts;

    const trimmed = idempotencyKey?.trim();
    if (!trimmed) {
      return execute();
    }

    const bodyHash = bodySha256(requestBody);
    const since = new Date(Date.now() - DEFAULT_TTL_MS);

    const existing = await this.prisma.idempotencyRecord.findFirst({
      where: {
        userId,
        scope,
        key: trimmed,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if (existing.bodyHash !== bodyHash) {
        throw new ConflictException(
          businessError('IDEMPOTENCY_KEY_CONFLICT', {
            details: [{ field: 'Idempotency-Key', reason: 'BODY_MISMATCH' }],
          }),
        );
      }
      return existing.responseBody as T;
    }

    const result = await execute();
    const wireBody = JSON.parse(JSON.stringify(result));

    await this.prisma.idempotencyRecord.create({
      data: {
        userId,
        scope,
        key: trimmed,
        bodyHash,
        statusCode: successStatusCode,
        responseBody: wireBody,
      },
    });

    return result;
  }
}
