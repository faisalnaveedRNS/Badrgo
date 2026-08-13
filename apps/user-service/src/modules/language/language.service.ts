import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Language } from '@utils/enum';

@Injectable()
export class LanguageService {
  constructor(private readonly i18n: I18nService) {}

  supported(): Language[] {
    return Object.values(Language);
  }

  /**
   * Resolves a key against the language of the current request. The language
   * comes from `?lang=` or the `Accept-Language` header — see `I18nModule` in
   * app.module.ts — and falls back to FALLBACK_LANGUAGE.
   */
  translate(key: string, args?: Record<string, unknown>): string {
    return this.i18n.t(key, { lang: I18nContext.current()?.lang, args });
  }
}
