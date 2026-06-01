const mongoose = require("mongoose");
require("dotenv").config();

const run = async () => {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    const User = require("../src/models/users");
    const Event = require("../src/models/Event");
    const Cedula = require("../src/models/Cedula");

    const users = await User.find({});
    console.log("\n--- Users ---");
    console.log(users.map(u => ({
      id: u._id,
      numeroControl: u.numeroControl,
      correo: u.correoInstitucional,
      nombres: u.nombres,
      roles: u.roles,
      cuenta: u.cuenta
    })));

    const events = await Event.find({});
    console.log("\n--- Events ---");
    console.log(events.map(e => ({
      id: e._id,
      title: e.title,
      courseKey: e.courseKey,
      instructor: e.instructor,
      instructorName: e.instructorName,
      type: e.type
    })));

    const cedulas = await Cedula.find({});
    console.log("\n--- Cedulas ---");
    console.log(cedulas);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
