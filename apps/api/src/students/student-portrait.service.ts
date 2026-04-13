import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { businessError } from '../common/errors/business-error';
import { PrismaService } from '../prisma/prisma.service';
import { STUDENT_PORTRAIT_MAX_BYTES } from './student-portrait.constants';
import { StudentPortraitStorageService } from './student-portrait-storage.service';
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class StudentPortraitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StudentPortraitStorageService,
    private readonly config: ConfigService,
  ) {}

  private assertStorage(): void {
    if (!this.storage.isConfigured()) {
      throw new ServiceUnavailableException(
        businessError('STORAGE_NOT_CONFIGURED'),
      );
    }
  }

  private signedUrlTtlSeconds(): number {
    const raw = this.config.get<string>('PORTRAIT_SIGNED_URL_TTL_SECONDS');
    const n = raw ? Number.parseInt(raw, 10) : 3600;
    if (!Number.isFinite(n) || n < 60 || n > 60 * 60 * 24) {
      return 3600;
    }
    return n;
  }

  private assertMimeAndSize(file: Express.Multer.File): string {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        businessError('STUDENT_PORTRAIT_FILE_REQUIRED'),
      );
    }
    const byteLength = file.buffer.length;
    if (byteLength > STUDENT_PORTRAIT_MAX_BYTES) {
      throw new BadRequestException(businessError('STUDENT_PORTRAIT_TOO_LARGE'));
    }
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        businessError('STUDENT_PORTRAIT_MIME_NOT_ALLOWED'),
      );
    }
    return ext;
  }

  async upload(studentId: string, file: Express.Multer.File) {
    this.assertStorage();
    const ext = this.assertMimeAndSize(file);
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, portraitPhotoObjectKey: true },
    });
    if (!student) {
      throw new NotFoundException(
        businessError('NOT_FOUND', { message: 'Aluno não encontrado.' }),
      );
    }
    const objectKey = `students/${studentId}/${randomUUID()}.${ext}`;
    try {
      await this.storage.uploadObject(objectKey, file.buffer, file.mimetype);
    } catch {
      throw new BadRequestException(
        businessError('STUDENT_PORTRAIT_UPLOAD_FAILED'),
      );
    }
    const previousKey = student.portraitPhotoObjectKey;
    const updated = await this.prisma.student.update({
      where: { id: studentId },
      data: { portraitPhotoObjectKey: objectKey },
      select: {
        id: true,
        portraitPhotoObjectKey: true,
      },
    });
    if (previousKey && previousKey !== objectKey) {
      await this.storage.deleteObject(previousKey);
    }
    return updated;
  }

  async clear(studentId: string): Promise<void> {
    this.assertStorage();
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, portraitPhotoObjectKey: true },
    });
    if (!student) {
      throw new NotFoundException(
        businessError('NOT_FOUND', { message: 'Aluno não encontrado.' }),
      );
    }
    const key = student.portraitPhotoObjectKey;
    await this.prisma.student.update({
      where: { id: studentId },
      data: { portraitPhotoObjectKey: null },
    });
    if (key) {
      await this.storage.deleteObject(key);
    }
  }

  async getSignedReadUrl(studentId: string) {
    this.assertStorage();
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, portraitPhotoObjectKey: true },
    });
    if (!student) {
      throw new NotFoundException(
        businessError('NOT_FOUND', { message: 'Aluno não encontrado.' }),
      );
    }
    if (!student.portraitPhotoObjectKey) {
      throw new BadRequestException(businessError('STUDENT_PORTRAIT_NOT_SET'));
    }
    const expiresIn = this.signedUrlTtlSeconds();
    try {
      const url = await this.storage.createSignedReadUrl(
        student.portraitPhotoObjectKey,
        expiresIn,
      );
      return {
        url,
        expiresInSeconds: expiresIn,
        objectKey: student.portraitPhotoObjectKey,
      };
    } catch {
      throw new BadRequestException(
        businessError('STUDENT_PORTRAIT_UPLOAD_FAILED', {
          message: 'Não foi possível gerar URL para visualização do retrato.',
        }),
      );
    }
  }
}
