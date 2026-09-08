const request = require("supertest");

jest.mock("../src/db", () => ({ pool: { query: jest.fn() } }));
const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor } = require("./testUtils");

describe("USERS - usuarios", () => {
  beforeEach(() => pool.query.mockReset());

  test("USR-001: listar usuarios sin token devuelve 401", async () => {
    const res = await request(app).get("/usuarios");
    expect(res.status).toBe(401);
  });

  test("USR-002: administrador puede listar usuarios", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "admin" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre_usuario: "admin", correo: "admin@example.com" }] });

    const token = tokenFor({ usuarioId: 1, roles: [{ id: 1, nombre: "admin" }] });
    const res = await request(app).get("/usuarios").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual(expect.objectContaining({ id: 1 }));
  });

  test("USR-003: paciente no puede listar todos los usuarios", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] });

    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).get("/usuarios").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("USR-004: crear usuario sin token devuelve 401", async () => {
    const res = await request(app).post("/usuarios").send({
      nombre_usuario: "nuevo",
      contrasena_hash: "secreto123",
      correo: "nuevo@example.com",
      rol_id: 2,
    });
    expect(res.status).toBe(401);
  });

  test("USR-005: administrador puede crear usuario", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 20, nombre_usuario: "nuevo", correo: "nuevo@example.com", created_at: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const token = tokenFor({ usuarioId: 1, roles: [{ id: 1, nombre: "admin" }] });
    const res = await request(app).post("/usuarios").set("Authorization", `Bearer ${token}`).send({
      nombre_usuario: "nuevo",
      contrasena_hash: "secreto123",
      correo: "nuevo@example.com",
      rol_id: 2,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 20, nombre_usuario: "nuevo" }));
  });

  test("USR-006: obtener usuario sin token devuelve 401", async () => {
    const res = await request(app).get("/usuarios/1");
    expect(res.status).toBe(401);
  });

  test("USR-007: usuario puede consultar su propio perfil", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, nombre_usuario: "paciente", correo: "p@example.com", rol_id: 3, rol_nombre: "paciente" }] });

    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).get("/usuarios/7").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(7);
  });
});
