import app from "../index.js";
import request from "supertest";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Product API Testing", () => {
  let products;
  let accessToken, refreshToken;

  // Get tokens
  beforeAll(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; // 20 ثانية

    const data = {
      email: "malak@gmail.com",
      password: "MH2020salah",
    };

    const res = await request(app).post("/user/login").send(data).expect(200);

    expect(res.body).toEqual(
      jasmine.objectContaining({
        message: jasmine.any(String),
        accessToken: jasmine.any(String),
        refreshToken: jasmine.any(String),
      })
    );

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  // create product api
  describe("POST /create/Product", () => {
    it("should create product successfully", async () => {
      const productData = {
        title: "product title",
        desc: "product description",
        price: 122,
        color: ["red", "black"],
        size: ["2x", "xl"],
        appliedDiscount: 20,
        stock: 34,
        categoryId: "6647e33f27462c5dcde67708",
      };

      const res = await request(app)
        .post("/product/createProduct")
        .set("Content-Type", "multipart/form-data")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("refresh-token", refreshToken)
        .field("title", productData.title)
        .field("desc", productData.desc)
        .field("price", productData.price.toString())
        .field("appliedDiscount", productData.appliedDiscount.toString())
        .field("stock", productData.stock.toString())
        .query({ categoryId: productData.categoryId })
        .field("color", productData.color[0])
        .field("color", productData.color[1])
        .field("size", productData.size[0])
        .field("size", productData.size[1])
        .attach(
          "image",
          path.join(__dirname, "./images/51YoyXbUgtL._AC_UL320_.jpg")
        )
        .attach(
          "image",
          path.join(__dirname, "./images/51yoZXCzDdL._AC_UL320_.jpg")
        )
        .expect(200);

      expect(res.body.message).toContain("Done");
      expect(res.body.success).toBeTrue();
      expect(res.body.result).toEqual(
        jasmine.objectContaining({
          _id: jasmine.any(String),
          title: productData.title,
          desc: productData.desc,
          price: productData.price,
          appliedDiscount: productData.appliedDiscount,
          stock: productData.stock,
          color: productData.color,
          size: productData.size,
          categoryId: productData.categoryId,
        })
      );

      expect(res.body.result.Images.length).toBe(2);
      expect(res.body.result.Images[0]).toEqual(
        jasmine.objectContaining({
          public_id: jasmine.any(String),
        })
      );
    });
  });

  describe("GET /Products", () => {
    it("should return products data successfully", async () => {
      const res = await request(app).get("/product/getProduct").expect(200);

      expect(res.body.message).toContain("Done");
      expect(res.body.success).toBeTrue();

      products = res.body.result;

      expect(Array.isArray(products)).toBeTrue();
      expect(products.length).toBeGreaterThan(0);

      products.forEach(async (product) => {
        expect(product).toEqual(
          jasmine.objectContaining({
            _id: jasmine.any(String),
            title: jasmine.any(String),
            slug: jasmine.any(String),
            desc: jasmine.any(String),
            color: jasmine.any(Array),
            size: jasmine.any(Array),
            price: jasmine.any(Number),
            appliedDiscount: jasmine.any(Number),
            priceAfterDiscount: jasmine.any(Number),
            stock: jasmine.any(Number),
          })
        );
      });
      expect(products.length).toBeGreaterThan(0);
    });
  });
});
