export interface EnvSpec {
  required?: readonly string[];
  requiredInProduction?: readonly string[];
  urls?: readonly string[];
}

export declare function findEnvProblems(
  spec: EnvSpec,
  env?: Record<string, string | undefined>,
): { errors: string[]; warnings: string[] };

export declare function checkEnv(
  appName: string,
  spec: EnvSpec,
  env?: Record<string, string | undefined>,
): void;
