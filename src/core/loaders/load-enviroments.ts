import { existsSync, readFileSync, watch } from "fs";
import { join } from "path";
import { logger } from "@core/logs/logger";

export function loadEnv(path: string): void {
  try {
    if (!existsSync(path)) {
      logger.warn(`⚠️ Archivo .env no encontrado en: ${path}`);
      return;
    }
    const envFile = readFileSync(path, "utf-8");

    envFile.split("\n").forEach((line) => {
      if (!line.trim() || line.startsWith("#")) return;

      const [key, ...values] = line.split("=");
      const value = values.join("=").trim();

      if (key && !process.env[key]) {
        process.env[key] = value.replace(/^['"]/, "").replace(/['"]$/, "");
      }
    });

    logger.log("✅ Variables de entorno cargadas correctamente");
  } catch (error: any) {
    logger.error("❌ Error cargando .env:", error.message);
  }
}

export function watchEnvChanges(path: string): void {
  const envPath = path;

  if (!existsSync(envPath)) {
    logger.warn(
      `⚠️ No se puede observar cambios - archivo .env no encontrado en: ${envPath}`
    );
    return;
  }

  const watcher = watch(envPath, (eventType) => {
    if (eventType === "change") {
      loadEnv(envPath);
      logger.log("🔁 .env recargado por cambios");
    }
  });

  watcher.on("error", (error) => {
    logger.error("❌ Error observando cambios en .env:", error);
  });

  process.on("SIGINT", () => {
    watcher.close();
    process.exit();
  });
}
