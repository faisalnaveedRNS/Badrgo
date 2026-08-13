import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '@modules/common/dtos/index.dtos';
import { ResponseMessage } from '@utils/enum';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@badrgo.dev' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsNotEmpty()
  password: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'jane@badrgo.dev' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@12345' })
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: ResponseMessage.INVALID_PASSWORD })
  password: string;

  @ApiProperty({ example: 'Jane Admin' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;
}
