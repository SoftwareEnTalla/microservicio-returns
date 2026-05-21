import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export interface CustomPostgresOptions extends PostgresConnectionOptions {
  name: string;
  extra: {
    max: number;
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
    application_name: string;
  };
}
