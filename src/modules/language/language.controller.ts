import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { ResponseMessage } from '@utils/enum';
import { LanguageListResponse, TranslatedMessageResponse } from './language.response';
import { LanguageService } from './language.service';

@ApiTags('Language')
@Controller('language')
export class LanguageController {
  constructor(private readonly service: LanguageService) {}

  @Get()
  @ApiOperation({ summary: 'List supported languages' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: LanguageListResponse })
  languages(@Res({ passthrough: true }) res: Response) {
    res.status(HttpStatus.OK);
    return new LanguageListResponse(this.service.supported());
  }

  /**
   * Reference implementation of a localized endpoint: send `?lang=ur` or the
   * `Accept-Language: ur` header and the same route answers in Urdu.
   */
  @Get('welcome')
  @ApiOperation({ summary: 'Localized sample message' })
  @ApiQuery({ name: 'lang', required: false, example: 'ur' })
  @ApiHeader({ name: 'Accept-Language', required: false, example: 'ur' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: TranslatedMessageResponse })
  welcome(@Query('name') name = 'there', @Res({ passthrough: true }) res: Response) {
    const translation = this.service.translate('common.welcome', { name });

    res.status(HttpStatus.OK);
    return new TranslatedMessageResponse(I18nContext.current()?.lang, translation);
  }
}
