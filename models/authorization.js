import { ForbiddenError } from "infra/errors";

export const Authorization = {
  can(features, authorizedFeatures) {
    return authorizedFeatures.every((feature) => features.includes(feature));
  },
  cannot(features, authorizedFeatures) {
    return !this.can(features, authorizedFeatures);
  },
  validateFeatures(features, authorizedFeatures) {
    if (this.cannot(features, authorizedFeatures)) {
      throw new ForbiddenError({
        message: "Você não possui permissão(ões) para executar esta ação.",
        action: `Verifique se você possui a(s) feature(s) ${authorizedFeatures.map((f) => `"${f}"`).join(", ")}`,
      });
    }
  },
};
