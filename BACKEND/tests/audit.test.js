const request = require("supertest");

jest.mock("../src/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor } = require("./testUtils");

describe("AUDIT - auditoría", () => {
  beforeEach(() => pool.query.mockReset());

  test("AUD-001: crear auditoría sin token devuelve 401", async () => {
    const res = await request(app).post("/auditoria").send({
      accion: "TEST",
      detalles: "registro sin token",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  test("AUD-002: crear auditoría con token devuelve 201", async () => {
    const token = tokenFor({ usuarioId: 7, nombreUsuario: "admin" });

    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, usuario_id: 7, accion: "TEST: registro sin token" }],
    });

    const res = await request(app)
      .post("/auditoria")
      .set("Authorization", `Bearer ${token}`)
      .send({ accion: "TEST", detalles: "registro sin token" });

    expect(res.status).toBe(201);
    expect(res.body.accion).toBe("TEST: registro sin token");
    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO auditoria (usuario_id, accion) VALUES ($1, $2) RETURNING *",
      [7, "TEST: registro sin token"]
    );
  });

  test("AUD-003: listar auditoría sin token devuelve 401", async () => {
    const res = await request(app).get("/auditoria");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  test("AUD-004: administrador puede listar auditoría del sistema", async () => {
    const token = tokenFor({ usuarioId: 1, nombreUsuario: "admin", roles: [{ nombre: "admin" }] });

    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "admin" }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, accion: "LOGIN: admin", nombre_usuario: "admin" }],
      });

    const res = await request(app)
      .get("/auditoria")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toEqual(expect.objectContaining({ accion: "LOGIN: admin" }));
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  test("AUD-005: usuario sin permisos no puede listar auditoría del sistema", async () => {
    const token = tokenFor({ usuarioId: 2, nombreUsuario: "medico", roles: [{ nombre: "medico" }] });

    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "medico" }] });

    const res = await request(app)
      .get("/auditoria")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.glosa).toContain("Solo los administradores");
  });
});
