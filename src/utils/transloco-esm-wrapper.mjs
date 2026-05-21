import { 
    TranslocoService,
    DefaultTranspiler,
    DefaultMissingHandler,
    DefaultInterceptor
  } from '@jsverse/transloco';
  
  export function createTranslocoService(config, loader, fallbackStrategy) {
    return new TranslocoService(
      loader,
      new DefaultTranspiler(),
      new DefaultMissingHandler(),
      new DefaultInterceptor(),
      config,
      fallbackStrategy
    );
  }