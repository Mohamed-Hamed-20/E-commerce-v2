// test/user.test.js

import request from "supertest";
import app from "./index.js"; // استبدل هذا بالمسار إلى تطبيق Express الخاص بك
import fs from "fs";

// user register In our system
describe("POST /user/register", () => {
  it("responds with json", async () => {
    // user data to send
    const userData = {
      firstName: "Mohamed",
      lastName: "Hamed",
      userName: "Mohamed-salah-V2",
      email: "mosalah1@gmail.com",
      password: "MH2020salah",
      cpassword: "MH2020salah",
      gender: "male",
    };

    // send request to register in Nodejs
    const response = await request(app).post("/user/register").send(userData);

    // check response if code with 200
    expect(response.statusCode).toBe(201);
    expect(response.headers["content-type"]).toEqual(
      expect.stringContaining("application/json")
    );
  }, 10000);
});

// user or admin login In our system
describe("POST /login", () => {
  it("respond with json", async () => {
    const login = {
      email: "mh674281@gmail.com",
      password: "MH2020salah",
    };

    let response;

    response = await request(app).post("/user/login").send(login);

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toEqual(
      expect.stringContaining("application/json")
    );
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body).toHaveProperty("role");
    expect(response.body.role).toEqual(
      expect.stringMatching(/^(admin|user|superAdmin)$/)
    );
  }, 10000);
});

// create product and uploads images
describe("POST /product/createProduct", () => {
  it("should create a product with images and return success message", async () => {
    // form data to create product
    const form = new FormData();
    form.append("title", "Test Product");
    form.append("desc", "This is a test product");
    form.append("color", "red");
    form.append("size", "small");
    form.append("price", "50");
    form.append("stock", "100");

    // add image to request
    form.append(
      "image",
      fs.createReadStream("./premium_photo-1678565869434-c81195861939.jpg")
    );
    form.append("image", fs.createReadStream("./T shirt.png"));

    const response = await request(app)
      .post("/product/createProduct?categoryId=660629bf3d64149cdd1b7e28")
      .set("Content-Type", `multipart/form-data; boundary=${form._boundary}`)
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTMzNTUsImV4cCI6MTcxNDI1Njk1NX0.wGN87qmTqYFUaSpTBhTLtMw-ICsqosH5rDvHkgaSzVA"
      )
      .set(
        "refresh-token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTMzNTUsImV4cCI6MTcxNDY4NTM1NX0.HIlIiChu6M3EDRWuy8xutGRd7N3ZcV14TrVCF-9x_fk"
      )
      .field("title", "Test Product")
      .field("desc", "This is a test product")
      .field("color", "red")
      .field("size", "small")
      .field("price", "50")
      .field("stock", "100")
      .attach("image", "./premium_photo-1678565869434-c81195861939.jpg")
      .attach("image", "./T shirt.png");

    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Done");
  }, 10000);
});

// make search and pagaination in our products
describe("GET /product/getProduct", () => {
  it("Get product Information", async () => {
    const resopnse = await request(app).get(
      "/product/getProduct?page=0&size=10&sort=price,-stock&select=price,title,categoryId,appliedDiscount,priceAfterDiscount,size,color,createdBy"
    );
    console.log(resopnse.body);
    expect(resopnse.status).toBe(200);
    expect(resopnse.body.success).toBe(true);
    expect(resopnse.body.message).toBe("Done");
  });
});

// add product to my card
describe("POST /card/addToCart", () => {
  it("Add product to my card ", async () => {
    const Info = {
      productId: "661324a531d9ff4d16ef5e51",
      quantity: 5,
    };

    const response = await request(app)
      .post("/card/addToCart")
      .send(Info)
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTgxMDEsImV4cCI6MTcxNDI2MTcwMX0.KbB8LFkHWHI11fF5FLWvp46k8wEtDITRh3Wu6yPvX6k"
      )
      .set(
        "refresh-token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTgxMDEsImV4cCI6MTcxNDY5MDEwMX0.GEMx1F7aTEIhcsL1x7nSHxcxTmWll88oxTtBo31Fgik"
      );
    // console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("done");
  });
});

// get my card Information
describe("GET /card/getCardInfo", () => {
  it("GET card Information ", async () => {
    const response = await request(app)
      .get("/card/getCardInfo")
      .set(
        "Authorization",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTgxMDEsImV4cCI6MTcxNDI2MTcwMX0.KbB8LFkHWHI11fF5FLWvp46k8wEtDITRh3Wu6yPvX6k"
      )
      .set(
        "refresh-token",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWY5ZTVkOTZkZTA2ZDQzZjU4ZmQ1MDgiLCJyb2xlIjoiYWRtaW4iLCJJcEFkZHJlc3MiOiI6OjEiLCJpYXQiOjE3MTQyNTgxMDEsImV4cCI6MTcxNDY5MDEwMX0.GEMx1F7aTEIhcsL1x7nSHxcxTmWll88oxTtBo31Fgik"
      );
    // console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Card Information");
    expect(response.body.card);
  });
});
