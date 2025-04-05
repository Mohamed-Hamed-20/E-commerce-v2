import { connectDB, closeDBConnection } from "../DB/connect.js";
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
import mongoose from "mongoose";
import redis from "./utils/redis.js";

export const bootstrap = async (app, express) => {
  connectDB();

  //redis
  redis;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Enable CORS for all requests
  app.use(cors());

  // Logging for DEV environment
  if (process.env.NODE_ENV === "DEV") {
    app.use(morgan("dev"));
  }

  // Rate limiting to avoid excessive requests
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // Limit each IP to 300 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // API Routes
  app.use("/user", userRouter);
  app.use("/category", categoryRouter);
  app.use("/SubCategory", SubCategoryRouter);
  app.use("/coupon", CouponRouter);
  app.use("/brand", BrandRouter);
  app.use("/product", ProductRouter);
  app.use("/card", CardRouter);
  app.use("/order", orderRouter);

  // Global Error Handling
  app.use(GlobalErrorHandling);

  // Welcome page route
  app.all("/", async (req, res) => {
    return res.send(await hellowpage());
  });

  // Handle invalid routes
  app.all("*", (req, res) => res.send("Invalid router link or method!"));

  // Close DB connection
  process.on("SIGINT", () => {
    console.log("Closing DB connection...");
    mongoose.connection.close(() => {
      console.log("Connection to DB is closed");
      process.exit(0);
    });
  });

  // Start the server on specified port
  const port = parseInt(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`App listening on port ${port}!`));
};
