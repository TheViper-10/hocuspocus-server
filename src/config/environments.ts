// Environment configuration
export interface EnvironmentConfig {
  port: number;
  devrevEndpoint: string;
}

export interface AppConfig {
  active_env: string;
  environments: Record<string, EnvironmentConfig>;
}

export const config: AppConfig = {
  // Set the active environment here
  active_env: process.env.ACTIVE_ENV || 'dev',

  // Environment-specific configurations
  environments: {
    dev: {
      port: 3000,
      devrevEndpoint: 'https://api.dev.devrev-eng.ai',
    },
    qa: {
      port: 3000,
      devrevEndpoint: 'https://api.qa.devrev-eng.ai',
    },
    prod: {
      port: 3000,
      devrevEndpoint: 'https://api.devrev.ai',
    },
  },
};

/**
 * Get the active environment configuration
 */
export function getActiveConfig(): EnvironmentConfig {
  const activeEnv = config.active_env;

  if (!config.environments[activeEnv]) {
    const availableEnvs = Object.keys(config.environments).join(', ');
    throw new Error(`Invalid active_env "${activeEnv}". Available environments: ${availableEnvs}`);
  }

  const envConfig = config.environments[activeEnv];
  console.log(`Using configuration for environment: ${activeEnv}`);
  console.log(`- Port: ${envConfig.port}`);
  console.log(`- DevRev Endpoint: ${envConfig.devrevEndpoint}`);

  return envConfig;
}
