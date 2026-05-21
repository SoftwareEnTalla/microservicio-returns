import { TranslocoConfig, AvailableLangs } from "@jsverse/transloco";

// Extiende la interfaz original
declare module "@jsverse/transloco" {
  interface TranslocoConfig {
    defaultStrategy?: "prefix" | "exclude";
    scopeStrategy?: "shared" | "isolated";
  }
}

export const getTranslocoConfig = (): TranslocoConfig => ({
  /**
   * Idioma predeterminado de la aplicación
   */
  defaultLang: "es",

  /**
   * Vuelve a renderizar los componentes cuando cambia el idioma
   */
  reRenderOnLangChange: true,

  /**
   * Modo producción (deshabilita logs y advertencias)
   */
  prodMode: process.env.NODE_ENV === "production",

  /**
   * Idioma de respaldo cuando falta una traducción
   */
  fallbackLang: ["es", "en"], // Puede ser string o array

  /**
   * Número de intentos fallidos antes de usar el idioma de respaldo
   */
  failedRetries: 2,

  /**
   * Idiomas disponibles en la aplicación
   */
  availableLangs: ["es", "en", "fr"] as AvailableLangs,

  /**
   * Configuración para aplanar las traducciones
   */
  flatten: {
    aot: process.env.NODE_ENV === "production", // Aplanar para AOT
  },

  /**
   * Manejo de claves faltantes
   */
  missingHandler: {
    logMissingKey: process.env.NODE_ENV !== "production",
    useFallbackTranslation: true,
    allowEmpty: false,
  },

  /**
   * Delimitadores para interpolación (ej: {{ key }})
   */
  interpolation: ["{{", "}}"],

  /**
   * Configuración de alcances (scopes)
   */
  scopes: {
    keepCasing: true, // Mantener mayúsculas/minúsculas en los scopes
  },
});
