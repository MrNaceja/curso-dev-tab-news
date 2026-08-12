import { InternalServerError } from "infra/errors";
import { Authorization } from "models/authorization";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("models/Authorization", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        Authorization.can();
      }).toThrow(InternalServerError);
    });
    test("without `user.features`", () => {
      expect(() => {
        Authorization.can({});
      }).toThrow(InternalServerError);
    });
    test("without `feature`", () => {
      expect(() => {
        Authorization.can({
          features: [],
        });
      }).toThrow(InternalServerError);
    });
    test("with unknown `feature`", () => {
      expect(() => {
        Authorization.can(
          {
            features: [],
          },
          "unknown",
        );
      }).toThrow(InternalServerError);
    });
    test("a valid calls", () => {
      expect(
        Authorization.can({ features: ["read:user"] }, "read:user"),
      ).toBeTruthy();
      expect(
        Authorization.can({ features: ["read:user"] }, "create:user"),
      ).toBeFalsy();
    });
  });
  describe(".withSecureOutput()", () => {
    test("without `feature`", () => {
      expect(() => {
        Authorization.withSecureOutput();
      }).toThrow(InternalServerError);
    });
    test("without `user`", () => {
      expect(() => {
        Authorization.withSecureOutput("read:user");
      }).toThrow(InternalServerError);
    });
    test("without `user.features`", () => {
      expect(() => {
        Authorization.withSecureOutput("read:user", {});
      }).toThrow(InternalServerError);
    });
    test("with unknown `feature`", () => {
      expect(() => {
        Authorization.withSecureOutput("unknown", { features: [] });
      }).toThrow(InternalServerError);
    });
    test("a valid call", () => {
      const user = {
        features: ["read:user"],
      };

      const resource = {
        id: 1,
        features: ["read:user"],
        username: "resource",
        email: "res@source.com",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
        password: "password",
      };

      expect(
        Authorization.withSecureOutput("read:user", user)(resource),
      ).toStrictEqual({
        id: 1,
        features: ["read:user"],
        username: "resource",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      });
    });
  });
});
