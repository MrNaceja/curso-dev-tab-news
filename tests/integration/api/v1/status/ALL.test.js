import { MethodNotAllowedError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("ALL another methods (exept GET) on /api/v1/status", () => {
  describe("with Anonymous user", () => {
    test("should receive error method not allowed", async () => {
      const methodsNotAllowed = ["POST", "PUT", "DELETE", "PATCH"];

      const expectedError = new MethodNotAllowedError();

      for (const method of methodsNotAllowed) {
        const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
          method,
        });
        expect(res.status).toBe(expectedError.statusCode);

        const errorBody = await res.json();
        expect(errorBody).toEqual(expectedError.toJSON());
      }
    });
  });
});
