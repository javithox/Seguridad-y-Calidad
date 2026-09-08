const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "inseguro";

function tokenFor({ usuarioId = 1, nombreUsuario = "tester", roles = [] } = {}) {
  const rol = roles[0] || null;
  return jwt.sign(
    {
      usuarioId,
      nombreUsuario,
      rolId: rol?.id ?? null,
      rolNombre: rol?.nombre ?? null,
      pacienteId: null,
      roles,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

const validPaciente = {
  rut: "12.345.678-5",
  primer_nombre: "Juan",
  apellido_paterno: "Pérez",
  apellido_materno: "Gómez",
  fecha_nacimiento: "1990-01-10",
  sexo: "M",
  email: "juan@example.com",
};

const validExamen = {
  tipo_examen_medico_id: 1,
  paciente_id: 1,
  diagnosis: "Control preventivo",
  tratamiento: "Ninguno",
  observaciones: "Sin hallazgos relevantes",
  notas: "Control anual",
};

module.exports = { tokenFor, validPaciente, validExamen };
