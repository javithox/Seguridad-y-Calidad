const request = require("supertest");

jest.mock("../src/db", () => ({ pool: { query: jest.fn() } }));
jest.mock("../src/middleware/delay", () => () => (req, res, next) => next());

const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor, validExamen } = require("./testUtils");

describe("EXAMENES - exámenes médicos", () => {
  beforeEach(() => pool.query.mockReset());

  test("EXA-001: crear examen sin token devuelve 401", async () => {
    const res = await request(app).post("/examenes").send(validExamen);
    expect(res.status).toBe(401);
  });

  test("EXA-002: paciente no puede crear examen", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] });
    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).post("/examenes").set("Authorization", `Bearer ${token}`).send(validExamen);
    expect(res.status).toBe(403);
  });

  test("EXA-003: médico puede crear examen", async () => {
    const created = { id: 5, ...validExamen };
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).post("/examenes").set("Authorization", `Bearer ${token}`).send(validExamen);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 5, paciente_id: 1 }));
  });

  test("EXA-004: campos obligatorios inválidos devuelven 400", async () => {
    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).post("/examenes").set("Authorization", `Bearer ${token}`).send({
      diagnosis: "Sin IDs",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Error de validación");
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("EXA-005: listar exámenes sin token devuelve 401", async () => {
    const res = await request(app).get("/examenes");
    expect(res.status).toBe(401);
  });

  test("EXA-006: médico puede listar exámenes", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, paciente_id: 1, diagnosis: "Control" }] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).get("/examenes").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual(expect.objectContaining({ id: 5 }));
  });

  test("EXA-007: paciente solo puede listar sus propios exámenes", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, paciente_id: 7 }] });

    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).get("/examenes").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].paciente_id).toBe(7);
  });

  test("EXA-008: paciente no puede consultar exámenes de otro paciente", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).get("/examenes/paciente/8").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
