import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '@common/dtos/index.dtos';
import { Language, ResponseMessage } from '@utils/enum';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNo?: string;

  @ApiPropertyOptional({ enum: Language, example: Language.EN_US })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Passw0rd!' })
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassw0rd!' })
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: ResponseMessage.INVALID_PASSWORD })
  newPassword: string;
}
