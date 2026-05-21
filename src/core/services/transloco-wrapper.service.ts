import { Injectable, OnModuleInit } from "@nestjs/common";
import { HashMap, Translation, TranslocoService } from "@jsverse/transloco";
import { getTranslocoConfig } from "../configs/transloco.config";
import { ServiceRegistry } from "@core/service-registry";

// Define interfaces locales para evitar imports problemáticos
interface TranslocoConfig {
  defaultLang: string;
  fallbackLang: string | string[];
  reRenderOnLangChange: boolean;
  prodMode: boolean;
}

@Injectable()
export class TranslocoWrapperService implements OnModuleInit {
  private readonly config = getTranslocoConfig();

  constructor(private translocoService: TranslocoService) {}

  async onModuleInit() {
    //await this.initializeTransloco();
    ServiceRegistry.getInstance().registry(this);
  }

  getTranslocoService() {
    return this.translocoService;
  }
  private async initializeTransloco() {
    // Importación dinámica de los módulos ESM
    const {
      TranslocoService,
      DefaultTranspiler,
      DefaultMissingHandler,
      DefaultInterceptor,
    } = await import("@jsverse/transloco");

    const loader = {
      getTranslation: (lang: string) => this.loadTranslationFile(lang),
    };

    const fallbackStrategy = {
      getNextLangs: (failedLang: string) => this.getFallbackLangs(failedLang),
    };

    this.translocoService = new TranslocoService(
      loader,
      new DefaultTranspiler(),
      new DefaultMissingHandler(),
      new DefaultInterceptor(),
      this.config,
      fallbackStrategy
    );

    await this.verifyInitialTranslation();
  }

  private getFallbackLangs(failedLang: string): string[] {
    const defaultFallback = Array.isArray(this.config.fallbackLang)
      ? this.config.fallbackLang
      : [this.config.fallbackLang || "en"];
    return [failedLang, ...defaultFallback].filter(
      (lang) => lang !== undefined
    );
  }

  private async loadTranslationFile(lang: string): Promise<Translation> {
    const filePath = `${process.cwd()}/dist/i18n/${lang}.json`;
    const fileContent = await require(filePath);
    return fileContent;
  }

  private async verifyInitialTranslation() {
    try {
      const initialLang = this.translocoService.getActiveLang();
      const translations = await this.translocoService
        .load(initialLang)
        .toPromise();

      if (!translations || Object.keys(translations).length === 0) {
        throw new Error(`No translations found for ${initialLang}`);
      }
    } catch (error) {
      console.error("Initial translation verification failed:", error);
      throw error;
    }
  }

  public translate(key: string): string {
    return this.translocoService?.translate(key) || key;
  }
}
