const LOCAL_AUTH_SECRET_FALLBACK = "sifter-local-development-secret";

type AuthSecretName = "AUTH_SECRET" | "SUPABASE_JWT_SECRET";

interface ResolveAuthRuntimeSecretsOptions {
  authSecret: string | undefined;
  supabaseJwtSecret: string | undefined;
  nodeEnv?: string | undefined;
  vercelEnv?: string | undefined;
}

interface AuthRuntimeSecrets {
  secret: string;
  supabaseJwtSecret: string;
}

const isProductionRuntime = ({
  nodeEnv,
  vercelEnv,
}: Pick<ResolveAuthRuntimeSecretsOptions, "nodeEnv" | "vercelEnv">) =>
  nodeEnv === "production" || vercelEnv === "production";

const resolveSecret = (
  value: string | undefined,
  name: AuthSecretName,
  productionRuntime: boolean,
) => {
  if (value) {
    return value;
  }

  if (productionRuntime) {
    throw new Error(`${name} is required for production auth configuration.`);
  }

  return LOCAL_AUTH_SECRET_FALLBACK;
};

export const resolveAuthRuntimeSecrets = ({
  authSecret,
  supabaseJwtSecret,
  nodeEnv = process.env.NODE_ENV,
  vercelEnv = process.env.VERCEL_ENV,
}: ResolveAuthRuntimeSecretsOptions): AuthRuntimeSecrets => {
  const productionRuntime = isProductionRuntime({ nodeEnv, vercelEnv });

  return {
    secret: resolveSecret(authSecret, "AUTH_SECRET", productionRuntime),
    supabaseJwtSecret: resolveSecret(
      supabaseJwtSecret,
      "SUPABASE_JWT_SECRET",
      productionRuntime,
    ),
  };
};
