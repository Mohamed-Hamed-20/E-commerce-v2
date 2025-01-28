import { Router } from "express";
import * as cc from "./controller/category.js";
import { multerCloudFunction } from "../../utils/multerCloud.js";
import * as allowedExtensions from "../../utils/allowedExtensions.js";
import { valid } from "../../middleware/validation.js";
import * as schemaV from "./controller/category.validation.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import productRouter from "../product/product.routes.js";
const router = Router();
router.use("/:categoryId/products", productRouter);
router.post(
  "/createCategory",
  isAuth([roles.admin, roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("imgcategory"),
  valid(schemaV.createSchemaCategory),
  cc.createCategory
);

router.put(
  "/UpdateCategory",
  isAuth([roles.admin, roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("imgcategory"),
  valid(schemaV.UpdateSchemaCategory),
  cc.UpdateCategory
);

router.delete(
  "/deleteCategory",
  isAuth([roles.admin, roles.super]),
  valid(schemaV.deleteSchemaCategory),
  cc.deleteCategory
);

router.get("/Get_all_Category_with_SubC", cc.Get_all_Category_with_SubC);
router.get("/searchCategory", cc.searchCategory);

export default router;
