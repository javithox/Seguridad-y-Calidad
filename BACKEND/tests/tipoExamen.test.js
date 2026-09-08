const request = require("supertest");

jest.mock("../src/db", () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require("../src/db");
const app = require("../src/app");

describe("TIPO EXAMEN - tipos de examen médico", () => {
  beforeEach(() => pool.query.mockReset());

  test("TIPO-001: listar tipos de examen devuelve 200 y lista ordenada", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, nombre: "Radiografía" },
        { id: 2, nombre: "Laboratorio" },
      ],
    });

    const res = await request(app).get("/tipo-examen");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toEqual(expect.objectContaining({ nombre: "Radiografía" }));
  });

  test("TIPO-002: obtener tipo de examen por id devuelve 200", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 7, nombre: "Ecografía" }] });

    const res = await request(app).get("/tipo-examen/7");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ id: 7, nombre: "Ecografía" }));
  });

  test("TIPO-003: obtener tipo de examen inexistente devuelve 404", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/tipo-examen/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No encontrado");
  });
});
