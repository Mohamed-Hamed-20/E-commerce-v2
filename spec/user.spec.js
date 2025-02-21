import request from "supertest";
import app from "../index.js";
import { deleteDB, deleteUser } from "../DB/connect.js";

describe("User API Endpoints", () => {
  let userId;
  afterAll(async () => {
    if (userId) {
      await deleteUser(userId);
    }
  });

  describe("POST -- /user/register", () => {
    const user = {
      firstName: "Mohamed",
      lastName: "Hamed",
      userName: "Hamoo2020",
      email: "mh674281@gmail.com",
      password: "MH2020salah",
      cpassword: "MH2020salah",
      gender: "male",
    };
    it("User registers successfully", async () => {
      const res = await request(app)
        .post("/user/register")
        .send(user)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(res.body.message.toLowerCase()).toContain(
        "registered successfully"
      );
      userId = res.body.result._id;
    });

    it("Email is already Exist", async () => {
      const res = await request(app)
        .post("/user/register")
        .send(user)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.message).toContain("email is already exist");
    });

    it("Username is already exist", async () => {
      const newUser = { ...user, email: "newEmail@gmail.com" };
      const res = await request(app)
        .post("/user/register")
        .send(newUser)
        .expect("Content-Type", /json/)
        .expect(400);
      expect(res.body.message).toContain("username is already exist");
    });

    it("Missing required fields", async () => {
      const invalidUser = { ...user };
      delete invalidUser.email;
      delete invalidUser.cpassword;

      const res = await request(app)
        .post("/user/register")
        .send(invalidUser)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(res.body.message).toContain("validation Error");
    });
  });

  describe("POST -- /user/login", () => {
    const login = {
      email: "malak@gmail.com",
      password: "MH2020salah",
    };
    it("✅ Successful Login", async () => {
      const res = await request(app)
        .post("/user/login")
        .send(login)
        .expect(200);

      expect(res.body.message).toContain("welcome");
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it("❌ 2. Invalid Email", async () => {
      const res = await request(app)
        .post("/user/login")
        .send({ email: "invaild@gmail.com", password: "MH2020salah" });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("invalid email or password");
    });

    it("❌ 5. Missing Email or Password", async () => {
      const res = await request(app).post("/user/login").send();

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("validation Error");
    });
  });
});
