import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'secretaria@escola.exemplo' })
  @IsEmail()
  email!: string;

  @ApiProperty({ format: 'password', example: 'sua-senha' })
  @IsString()
  @MinLength(1)
  password!: string;
}
