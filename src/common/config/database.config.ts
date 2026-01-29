export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface JwtConfig {
  secret: string;
  expiration: string;
}

export interface EnvConfig {
  database: DatabaseConfig;
  app: AppConfig;
  jwt: JwtConfig;
}
