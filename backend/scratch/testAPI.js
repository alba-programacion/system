const run = async () => {
  const BASE_URL = "http://localhost:5000/api";
  const userId = "6a0d35b889bcedca7dbb3ab6";
  const eventId = "6a0d35b889bcedca7dbb3abd";

  try {
    console.log("Testing user endpoint...");
    const userRes = await fetch(`${BASE_URL}/auth/user/${userId}`);
    console.log("User status:", userRes.status);
    console.log("User data:", await userRes.json());

    console.log("\nTesting instructor courses endpoint...");
    const coursesRes = await fetch(`${BASE_URL}/admin/events?type=course&instructor=${userId}&evidenceUploadEnabled=true`);
    console.log("Instructor courses status:", coursesRes.status);
    console.log("Instructor courses:", await coursesRes.json());

    console.log("\nTesting all events...");
    const allEventsRes = await fetch(`${BASE_URL}/admin/events?type=course`);
    console.log("All events status:", allEventsRes.status);
    console.log("All events:", await allEventsRes.json());

    console.log("\nTesting cedula endpoint...");
    const cedulaRes = await fetch(`${BASE_URL}/cedulas/user/${userId}/event/${eventId}`);
    console.log("Cedula status:", cedulaRes.status);
    console.log("Cedula data:", await cedulaRes.json());

    console.log("\nTesting opinion survey...");
    const opinionRes = await fetch(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/opinion`);
    console.log("Opinion survey status:", opinionRes.status);
    console.log("Opinion survey:", await opinionRes.json());

    console.log("\nTesting efficacy survey...");
    const efficacyRes = await fetch(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/eficacia_profesor`);
    console.log("Efficacy survey status:", efficacyRes.status);
    console.log("Efficacy survey:", await efficacyRes.json());

    console.log("\nTesting student efficacy survey...");
    const studentEfficacyRes = await fetch(`${BASE_URL}/surveys/user/${userId}/event/${eventId}/type/eficacia_estudiante`);
    console.log("Student efficacy survey status:", studentEfficacyRes.status);
    console.log("Student efficacy survey:", await studentEfficacyRes.json());

    process.exit(0);
  } catch (error) {
    console.error("API Error:", error.message);
    process.exit(1);
  }
};

run();
