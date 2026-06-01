require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/users");
const Carrera = require("./src/models/carreras");
const Event = require("./src/models/Event");
const Cedula = require("./src/models/Cedula");
const Survey = require("./src/models/Survey");
const Attendance = require("./src/models/Attendance");
const Evidencia = require("./src/models/Evidencia");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing collections
    await User.deleteMany({});
    await Carrera.deleteMany({});
    await Event.deleteMany({});
    await Cedula.deleteMany({});
    await Survey.deleteMany({});
    await Attendance.deleteMany({});
    await Evidencia.deleteMany({});
    console.log("Cleared existing Users, Carreras, Events, Cedulas, Surveys, Attendances and Evidencias.");

    // Create Carreras
    const isc = await Carrera.create({
      nombreCarrera: "Ingeniería en Sistemas Computacionales",
      descripcion: "Carrera de sistemas",
      perfilIngreso: "Interés por la tecnología",
      perfilEgreso: "Desarrollador de software",
      campoLaboral: "Empresas de tecnología"
    });

    const ind = await Carrera.create({
      nombreCarrera: "Ingeniería Industrial",
      descripcion: "Carrera de industrial",
      perfilIngreso: "Interés por la optimización",
      perfilEgreso: "Ingeniero industrial",
      campoLaboral: "Fábricas y manufactura"
    });

    console.log("Carreras created.");

    // Create Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("admin123", salt);
    const profesorPassword = await bcrypt.hash("profesor123", salt);
    const alumnoPassword = await bcrypt.hash("alumno123", salt);
    const psicologaPassword = await bcrypt.hash("psicologa123", salt);

    await User.create([
      {
        numeroControl: "101",
        correoInstitucional: "admin@itgam.edu.mx",
        nombres: "Admin",
        apPaterno: "ITGAM",
        apMaterno: "Sistema",
        password: adminPassword,
        roles: ["admin"],
        cuenta: "activa",
        genero: "Otro"
      },
      {
        numeroControl: "201",
        correoInstitucional: "profesor@itgam.edu.mx",
        nombres: "Juan",
        apPaterno: "Pérez",
        apMaterno: "Rodríguez",
        password: profesorPassword,
        roles: ["profesor"],
        cuenta: "activa",
        genero: "Masculino",
        datosLaborales: {
          puesto: "Docente de Tiempo Completo",
          departamento: "Sistemas y Computación",
          institucion: "ITGAM"
        }
      },
      {
        numeroControl: "123456789",
        correoInstitucional: "alumno@itgam.edu.mx",
        nombres: "María",
        apPaterno: "Gómez",
        apMaterno: "López",
        password: alumnoPassword,
        roles: ["alumno"],
        cuenta: "activa",
        genero: "Femenino",
        carrera: isc._id
      },
      {
        numeroControl: "301",
        correoInstitucional: "psicologa@itgam.edu.mx",
        nombres: "Ana",
        apPaterno: "Sánchez",
        apMaterno: "Díaz",
        password: psicologaPassword,
        roles: ["psicologa"],
        cuenta: "activa",
        genero: "Femenino"
      }
    ]);

    // Create default courses (Events of type "course")
    await Event.create([
      {
        courseKey: "CURSO-101",
        title: "Desarrollo de Aplicaciones Web",
        instructorName: "Dr. Aaron Guzmán",
        period: "Del 10 al 28 de Julio de 2026",
        schedule: "08:00 a 12:00 hrs",
        duration: "30 horas",
        description: "Curso de capacitación docente en tecnologías web modernas y frameworks modernos.",
        date: "2026-07-10",
        type: "course"
      },
      {
        courseKey: "CURSO-102",
        title: "Inteligencia Artificial Aplicada a la Educación",
        instructorName: "Dra. María Velázquez",
        period: "Del 1 al 15 de Agosto de 2026",
        schedule: "14:00 a 18:00 hrs",
        duration: "40 horas",
        description: "Curso práctico sobre herramientas de IA generativa y agentes para optimización del aula.",
        date: "2026-08-01",
        type: "course"
      },
      // Create default public events (Events of type "event")
      {
        title: "Inovatec ITGAM 2026",
        description: "Feria de innovación tecnológica donde los estudiantes presentan sus prototipos y proyectos de emprendimiento ante inversionistas.",
        date: "15 OCT",
        type: "event"
      },
      {
        title: "Hackathon Halcón",
        description: "Competencia de desarrollo de software de 48 horas para resolver problemáticas de la comunidad estudiantil y del entorno local.",
        date: "22 OCT",
        type: "event"
      },
      {
        title: "Feria de Emprendimiento",
        description: "Estudiantes presentan proyectos y startups ante inversionistas reales.",
        date: "05 NOV",
        type: "event"
      }
    ]);
    console.log("Default courses and events seeded successfully.");

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seed();
