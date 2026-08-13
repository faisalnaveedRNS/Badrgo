import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { SortType } from '@models';
import { ResponseMessage } from '@utils/enum';

export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_-]).{8,50}$/;

/**
 * Query params must carry an explicit `type` and a TypeScript annotation.
 *
 * `emitDecoratorMetadata` only records a precise `design:type` for annotated
 * properties — `page = 1` reflects as `Object`, which Swagger renders as a JSON
 * textarea instead of a number field, and swagger-ui then fails to serialise
 * the request at all.
 */
export class PaginationDto {
  @ApiPropertyOptional({ type: Number, example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ type: Number, example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SortType, default: SortType.DESC })
  @IsOptional()
  @IsEnum(SortType)
  sort: SortType = SortType.DESC;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
}

export class UuidParamDto {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @IsUUID('4', { message: ResponseMessage.INVALID_PATH_PARAM })
  id: string;
}

export class EmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class PasswordDto {
  @ApiProperty({ example: 'Passw0rd!' })
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX, { message: ResponseMessage.INVALID_PASSWORD })
  password: string;
}
