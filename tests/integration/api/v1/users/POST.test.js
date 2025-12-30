import { ValidationError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepare);

describe("POST on /api/v1/users", () => {
  describe("with Anonymous user", () => {
    test("passing unique and valid data", async () => {
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "naceja",
          email: "naceja@email.com",
          password: "naceja123",
        }),
      });
      const createdUser = await res.json();

      expect(res.status).toBe(201);
      expect(createdUser).toEqual(
        expect.objectContaining({
          created_at: expect.stringContaining(
            new Date(createdUser.created_at).toISOString(),
          ),
          updated_at: expect.stringContaining(
            new Date(createdUser.updated_at).toISOString(),
          ),
          id: expect.stringContaining(createdUser.id),
          username: expect.stringContaining(createdUser.username),
          email: expect.stringContaining(createdUser.email),
          password: expect.stringContaining(createdUser.password),
        }),
      );
    });
    test("when passing duplicated username", async () => {
      const res1 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "duplicado",
          email: "user1@email.com",
          password: "usuario123",
        }),
      });
      expect(res1.status).toBe(201);

      const res2 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Duplicado",
          email: "user2@email.com",
          password: "usuario123",
        }),
      });
      const errorBody = await res2.json();
      const expectedDuplicatedUsernameError = new ValidationError({
        message: "Apelido não disponível.",
        action: "Tente outro apelido.",
      });

      expect(res2.status).toBe(expectedDuplicatedUsernameError.statusCode);
      expect(errorBody).toEqual(expectedDuplicatedUsernameError.toJSON());
    });
    test("when passing duplicated email", async () => {
      const res1 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usuario1",
          email: "duplicado@email.com",
          password: "usuario123",
        }),
      });
      expect(res1.status).toBe(201);

      const res2 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usuario2",
          email: "Duplicado@email.com",
          password: "usuario123",
        }),
      });
      const errorBody = await res2.json();
      const expectedDuplicatedEmailError = new ValidationError({
        message: "Email duplicado.",
        action: "Tente outro email.",
      });

      expect(res2.status).toBe(expectedDuplicatedEmailError.statusCode);
      expect(errorBody).toEqual(expectedDuplicatedEmailError.toJSON());
    });
  });
});
