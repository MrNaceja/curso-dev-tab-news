import { ForbiddenError } from "infra/errors";

export const Authorization = {
  can(user, feature, resource) {
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
};
