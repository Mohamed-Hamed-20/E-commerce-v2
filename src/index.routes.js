import connectDB from "../DB/connect.js";
import cors from "cors";
import userRouter from "./modules/user/user.routes.js";
import categoryRouter from "./modules/category/category.routes.js";
import SubCategoryRouter from "./modules/subcategories/subcategory.routes.js";
import BrandRouter from "./modules/brand/brand.routes.js";
import ProductRouter from "./modules/product/product.routes.js";
import CardRouter from "./modules/card/card.routes.js";
import CouponRouter from "./modules/coupon/coupon.routes.js";
import orderRouter from "./modules/order/order.routes.js";
import { GlobalErrorHandling } from "./utils/errorHandling.js";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { hellowpage } from "./utils/welcomepage.js";

export const bootstrap = (app, express) => {
  connectDB();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable CORS for all requests
  app.use(cors());

  //Allow feaching Data
  //application
  if (process.env.MODE == "DEV") {
    app.use(morgan("dev"));
  }
  // =====================================chk rate limiter==================================================
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limit each IP to 100 requests per `window`
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  // Apply the rate limiting
  app.use(limiter);
  // API
  app.use("/user", userRouter);
  app.use("/category", categoryRouter);
  app.use("/SubCategory", SubCategoryRouter);
  app.use("/coupon", CouponRouter);
  app.use("/brand", BrandRouter);
  app.use("/product", ProductRouter);
  app.use("/card", CardRouter);
  app.use("/order", orderRouter);

  //Globale error handling
  app.use(GlobalErrorHandling);

  app.all("/", async (req, res) => {
    return res.send(await hellowpage());
  });

  //API bad
  app.all("*", (req, res) => res.send("invalid router link or method!"));
  const port = parseInt(process.env.PORT) || 7102;
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
};
