const request = require("supertest");

jest.mock("../src/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../src/db");
const app = require("../src/app");

describe("AUTH - autenticación y registro", () => {
  beforeEach(() => pool.query.mockReset());

  test("AUTH-001: login válido devuelve JWT", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre_usuario: "admin", contrasena: "secreta", correo: "admin@example.com" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre: "admin" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/autenticacion/login").send({
      nombre_usuario: "admin",
      password: "secreta",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(pool.query).toHaveBeenCalledTimes(4);
  });

  test("AUTH-002: contraseña incorrecta devuelve 401", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nombre_usuario: "admin", contrasena: "correcta", correo: "admin@example.com" }],
    });

    const res = await request(app).post("/autenticacion/login").send({
      nombre_usuario: "admin",
      password: "incorrecta",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Credenciales inválidas");
  });

  test("AUTH-003: usuario inexistente devuelve 401", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/autenticacion/login").send({
      nombre_usuario: "no-existe",
      password: "123456",
    });

    expect(res.status).toBe(401);
  });

  test("AUTH-004: login con campos vacíos devuelve 400 y no consulta DB", async () => {
    const res = await request(app).post("/autenticacion/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Error de validación");
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("AUTH-005: registro válido sin RUT devuelve 201", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10, nombre_usuario: "nuevo", correo: "nuevo@example.com", created_at: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [{ id: 3 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post("/autenticacion/registro").send({
      nombre_usuario: "nuevo",
      password: "secreto123",
      correo: "nuevo@example.com",
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Usuario registrado exitosamente");
    expect(res.body.usuario).toEqual(expect.objectContaining({ id: 10 }));
    expect(pool.query).toHaveBeenCalledTimes(5);
  });

  test("AUTH-006: registro duplicado devuelve 400", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    const res = await request(app).post("/autenticacion/registro").send({
      nombre_usuario: "existente",
      password: "secreto123",
      correo: "existente@example.com",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Usuario o correo duplicado");
  });
});
