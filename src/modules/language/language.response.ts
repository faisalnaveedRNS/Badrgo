import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { Language } from '@utils/enum';

export class LanguageListResponse extends Response {
  @ApiProperty({ enum: Language, isArray: true, example: [Language.EN_US, Language.UR] })
  data: Language[];

  constructor(languages: Language[]) {
    super();
    this.data = languages;
  }
}

export class TranslatedMessageResponse extends Response {
  @ApiProperty({ example: 'en-us' })
  language: string;

  @ApiProperty({ example: 'Welcome to Badrgo, John.' })
  translation: string;

  constructor(language: string, translation: string) {
    super();
    this.language = language;
    this.translation = translation;
  }
}
