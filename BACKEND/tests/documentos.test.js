const request = require("supertest");

jest.mock("../src/db", () => ({ pool: { query: jest.fn() } }));
jest.mock("../src/middleware/delay", () => () => (req, res, next) => next());

const { pool } = require("../src/db");
const app = require("../src/app");
const { tokenFor } = require("./testUtils");

describe("DOCUMENTOS - documentos de exámenes", () => {
  beforeEach(() => pool.query.mockReset());

  test("DOC-001: subir documento sin token devuelve 401", async () => {
    const res = await request(app)
      .post("/documentos")
      .field("examen_medico_id", "1")
      .field("paciente_id", "1")
      .attach("documento", Buffer.from("PDF de prueba"), "prueba.pdf");

    expect(res.status).toBe(401);
  });

  test("DOC-002: paciente no puede subir documentos", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "paciente" }] });
    const token = tokenFor({ usuarioId: 7, roles: [{ id: 3, nombre: "paciente" }] });

    const res = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${token}`)
      .field("examen_medico_id", "1")
      .field("paciente_id", "1")
      .attach("documento", Buffer.from("PDF de prueba"), "prueba.pdf");

    expect(res.status).toBe(403);
  });

  test("DOC-003: médico puede subir PDF", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, nombre_archivo: "prueba.pdf", created_at: new Date().toISOString() }] })
      .mockResolvedValueOnce({ rows: [] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${token}`)
      .field("examen_medico_id", "1")
      .field("paciente_id", "1")
      .attach("documento", Buffer.from("PDF de prueba"), "prueba.pdf");

    expect(res.status).toBe(201);
    expect(res.body.documento).toEqual(expect.objectContaining({ id: 30, nombre_archivo: "prueba.pdf" }));
  });

  test("DOC-004: documento sin archivo devuelve 400", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ nombre: "medico" }] });
    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });

    const res = await request(app)
      .post("/documentos")
      .set("Authorization", `Bearer ${token}`)
      .field("examen_medico_id", "1")
      .field("paciente_id", "1");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Error de validación");
  });

  test("DOC-005: listar documentos sin token devuelve 401", async () => {
    const res = await request(app).get("/documentos/examen/1");
    expect(res.status).toBe(401);
  });

  test("DOC-006: médico puede listar documentos de un examen", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, nombre_archivo: "prueba.pdf" }] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).get("/documentos/examen/1").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual(expect.objectContaining({ id: 30 }));
  });

  test("DOC-007: descarga un documento PDF con Content-Type correcto", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ nombre: "medico" }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, nombre_archivo: "prueba.pdf", documento: Buffer.from("PDF de prueba"), paciente_id: 1, usuario_id: 7 }] });

    const token = tokenFor({ usuarioId: 2, roles: [{ id: 2, nombre: "medico" }] });
    const res = await request(app).get("/documentos/30").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    expect(res.headers["content-disposition"]).toContain("prueba.pdf");
  });
});
