import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/** Rotas acessíveis sem `Authorization: Bearer` (ex.: login, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
