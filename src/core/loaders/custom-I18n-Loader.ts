import { Injectable } from "@nestjs/common";
import { I18nLoader, I18nTranslation } from "nestjs-i18n";
import { readFileSync } from "fs";
import { join } from "path";
import { Observable, of } from "rxjs";
import { TranslocoWrapperService } from "../services/transloco-wrapper.service";
@Injectable()
export class CustomI18nLoader implements I18nLoader {
  private currentLanguage: string;

  constructor(private readonly translocoWrapper: TranslocoWrapperService) {
    this.currentLanguage = this.translocoWrapper
      .getTranslocoService()
      .getActiveLang();
    this.setupLanguageListener();
  }

  private setupLanguageListener() {
    this.translocoWrapper.getTranslocoService().langChanges$.subscribe({
      next: (lang) => {
        this.currentLanguage = lang;
        console.log(`Language changed to: ${lang}`);
      },
      error: (err) => console.error("Language change error:", err),
    });
  }

  async languages(): Promise<string[] | Observable<string[]>> {
    return of(
      this.translocoWrapper
        .getTranslocoService()
        .getAvailableLangs() as string[]
    );
  }

  async load(): Promise<I18nTranslation | Observable<I18nTranslation>> {
    try {
      const translations = await this.translocoWrapper
        .getTranslocoService()
        .load(this.currentLanguage)
        .toPromise();

      return translations || {};
    } catch (error) {
      console.error(
        `Error loading translations for ${this.currentLanguage}:`,
        error
      );
      return {};
    }
  }
}
