import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '@common/dtos/index.dtos';
import { ResponseMessage } from '@utils/enum';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: ResponseMessage.INVALID_PASSWORD })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsNotEmpty()
  password: string;
}
