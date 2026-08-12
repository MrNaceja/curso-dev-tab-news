import { ForbiddenError, InternalServerError } from "infra/errors";

const availableFeatures = new Set([
  "create:session",
  "read:session",
  "read:user",
  "read:user:self",
  "update:user",
  "invalidate:session",
  "renew:session",
  "activate:user",
  "create:user",
  "read:system-status",
  "read:migration",
  "create:migration",
  "read:system-status:postgres-version",
]);

function validateUser(user) {
  if (!user || !("features" in user)) {
    throw new InternalServerError({
      cause: "Usuário não informado ou não contém features.",
    });
  }
}

function validateFeature(feature) {
  const features =
    feature === undefined ? [] : !Array.isArray(feature) ? [feature] : feature;
  if (!features.some((feature) => availableFeatures.has(feature))) {
    throw new InternalServerError({
      cause: "Feature informada não é conhecida.",
    });
  }
}

export const Authorization = {
  can(user, feature, resource) {
    validateUser(user);
    validateFeature(feature);

    const features = !Array.isArray(feature) ? [feature] : feature;
    let authorized = false;

    for (const feature of features) {
      authorized = user.features.includes(feature);

      if (resource) {
        authorized &= user.id === resource;
      }
    }

    return authorized;
  },
  cannot(user, feature, resource) {
    return !this.can(user, feature, resource);
  },
  async validate(user, feature, resource) {
    const features = !Array.isArray(feature) ? [feature] : feature;

    if (this.cannot(user, features, resource)) {
      if (!resource) {
        throw new ForbiddenError({
          message: "Você não possui permissão(ões) para executar esta ação.",
          action: `Verifique se você possui a(s) feature(s) ${features.map((f) => `"${f}"`).join(", ")}`,
        });
      }
      if (user.id !== resource) {
        for (const feature of features) {
          const superFeature = `${feature}:super`;
          if (!user.features.includes(superFeature)) {
            throw new ForbiddenError({
              message:
                "Usuário não possui permissão(ões) para gerenciar este recurso.",
              action: "Verifique as permissão(ões) concedidas.",
            });
          }
        }
      }
    }
  },

  withSecureOutput(feature, user) {
    validateFeature(feature);
    validateUser(user);

    return (resource) => {
      if (feature === "read:user") {
        return {
          id: resource?.id,
          username: resource?.username,
          features: resource?.features || [],
          created_at: resource?.created_at,
          updated_at: resource?.updated_at,
        };
      }

      if (feature === "read:session") {
        return {
          id: resource?.id,
          expires_at: resource?.expires_at,
          created_at: resource?.created_at,
          updated_at: resource?.updated_at,
          ...(user?.id === resource?.user_id && { user_id: resource?.user_id }),
        };
      }

      if (feature === "read:system-status") {
        const output = {
          updated_at: new Date().toISOString(),
          dependencies: {
            database: {
              max_connections:
                resource?.dependencies?.database?.max_connections,
              opened_connections:
                resource?.dependencies?.database?.opened_connections,
            },
          },
        };

        if (Authorization.can(user, "read:system-status:postgres-version")) {
          return {
            ...output,
            dependencies: {
              ...output.dependencies,
              database: {
                ...output.dependencies.database,
                postgres_version:
                  resource?.dependencies?.database?.postgres_version,
              },
            },
          };
        }

        return output;
      }

      if (feature === "read:migration") {
        return (resource ?? []).map((res) => ({
          path: res.path,
          name: res.name,
          timestamp: res.timestamp,
        }));
      }

      return null;
    };
  },
};
