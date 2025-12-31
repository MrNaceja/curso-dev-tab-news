import { hash, compare, genSaltSync } from "bcryptjs";
import { createHmac } from "node:crypto";

const SECURE_PASSWORD_PEPPER =
  process.env.SECURE_PASSWORD_PEPPER ?? "default-pepper";
const SECURE_PASSWORD_ROUNDS = Number(
  process.env.SECURE_PASSWORD_ROUNDS ?? "4",
);

function withPepper(plainPassword) {
  return createHmac("SHA-256", SECURE_PASSWORD_PEPPER)
    .update(plainPassword)
    .digest("hex");
}

export const Security = {
  securePassword(plainPassword) {
    return hash(withPepper(plainPassword), genSaltSync(SECURE_PASSWORD_ROUNDS));
  },
  comparePassword(plainPassword, securedPasswordHash) {
    return compare(withPepper(plainPassword), securedPasswordHash);
  },
};
