const request = require("supertest");

jest.mock("../src/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor } = require("./testUtils");

describe("ROLES - gestión de roles", () => {
  beforeEach(() => pool.query.mockReset());

  test("ROL-001: crear rol devuelve 201 y registra auditoría", async () => {
    const token = tokenFor({ usuarioId: 5, nombreUsuario: "admin" });

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre: "Admin" }] })
      .mockResolvedValueOnce({ rows: [{ id: 99 }] });

    const res = await request(app)
      .post("/roles")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Admin" });

    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe("Admin");
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      "INSERT INTO roles (nombre) VALUES ($1) RETURNING *",
      ["Admin"]
    );
    expect(pool.query).toHaveBeenNthCalledWith(2, "INSERT INTO auditoria (usuario_id, accion) VALUES ($1, $2)", [
      "admin",
      "ROLES_CREAR: creó rol Admin",
    ]);
  });

  test("ROL-002: listar roles devuelve 200", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, nombre: "admin" },
        { id: 2, nombre: "medico" },
      ],
    });

    const res = await request(app).get("/roles");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual(expect.objectContaining({ nombre: "admin" }));
  });

  test("ROL-003: obtener rol por id devuelve 404 si no existe", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/roles/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No encontrado");
  });

  test("ROL-004: actualizar rol devuelve 200 y registra auditoría", async () => {
    const token = tokenFor({ usuarioId: 8, nombreUsuario: "supervisor" });

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 4, nombre: "Coordinador" }] })
      .mockResolvedValueOnce({ rows: [{ id: 15 }] });

    const res = await request(app)
      .put("/roles/4")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Coordinador" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Coordinador");
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO auditoria (usuario_id, accion) VALUES ($1, $2)",
      ["supervisor", "ROLES_ACTUALIZAR: actualizó rol ID 4"]
    );
  });

  test("ROL-005: eliminar rol devuelve 200 y registra auditoría", async () => {
    const token = tokenFor({ usuarioId: 9, nombreUsuario: "admin" });

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 3, nombre: "Paciente" }] })
      .mockResolvedValueOnce({ rows: [{ id: 20 }] });

    const res = await request(app)
      .delete("/roles/3")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO auditoria (usuario_id, accion) VALUES ($1, $2)",
      ["admin", "ROLES_ELIMINAR: eliminó rol ID 3"]
    );
  });
});
