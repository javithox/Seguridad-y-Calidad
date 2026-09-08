const request = require("supertest");

jest.mock("../src/db", () => ({ pool: { query: jest.fn() } }));
jest.mock("../src/middleware/delay", () => () => (req, res, next) => next());

const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor, validPaciente } = require("./testUtils");

describe("PACIENTES - pacientes", () => {
  beforeEach(() => pool.query.mockReset());

  test("PAC-001: crear paciente sin token devuelve 401", async () => {
    const res = await request(app).post("/pacientes").send(validPaciente);
    expect(res.status).toBe(401);
  });

  test("PAC-002: paciente no puede crear otro paciente", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] });
    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });

    const res = await request(app).post("/pacientes").set("Authorization", `Bearer ${token}`).send(validPaciente);
    expect(res.status).toBe(403);
  });

  test("PAC-003: médico puede crear paciente", async () => {
    const created = { id: 1, ...validPaciente, rut: "12345678-5" };
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [created] })
      .mockResolvedValueOnce({ rows: [] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).post("/pacientes").set("Authorization", `Bearer ${token}`).send(validPaciente);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(expect.objectContaining({ id: 1 }));
  });

  test("PAC-004: datos inválidos son rechazados por Yup", async () => {
    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).post("/pacientes").set("Authorization", `Bearer ${token}`).send({
      ...validPaciente,
      rut: "rut-invalido",
      sexo: "X",
      email: "no-es-email",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Error de validación");
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("PAC-005: listar pacientes sin token devuelve 401", async () => {
    const res = await request(app).get("/pacientes");
    expect(res.status).toBe(401);
  });

  test("PAC-006: médico puede listar pacientes", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, rut: "12345678-5", primer_nombre: "Juan" }] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).get("/pacientes").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test("PAC-007: paciente no puede consultar otro paciente", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });
    const res = await request(app).get("/pacientes/8").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("PAC-008: buscar paciente por RUT devuelve 404 si no existe", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get("/pacientes/buscar/rut/12345678-5");
    expect(res.status).toBe(404);
  });
});
