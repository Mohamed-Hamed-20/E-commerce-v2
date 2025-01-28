import { Router } from "express";
import * as sc from "./controller/subcategory.js";
import { multerCloudFunction } from "../../utils/multerCloud.js";
import * as allowedExtensions from "../../utils/allowedExtensions.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import { valid } from "../../middleware/validation.js";
import * as vc from "./controller/Subcategory.valid.schema.js";
const router = Router();

router.post(
  "/CreateSubCategory",
  isAuth([roles.admin, roles.super, roles.user]),
  multerCloudFunction(allowedExtensions.Image).single("ImgSubCategory"),
  valid(vc.CreateSubCategory),
  sc.CreateSubCategory
);

router.put(
  "/update",
  isAuth([roles.admin , roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("ImgSubCategory"),
  valid(vc.Update_SubCategory),
  sc.Update_SubCategory
);
router.get("/GetallSubCategory", sc.GetallSubCategory);
router.delete(
  "/delete",
  isAuth([roles.admin, roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("ImgSubCategory"),
  valid(vc.delete_SubCategory),
  sc.delete_SubCategory
);
router.get("/searchsubCategory", sc.searchsubCategory);
export default router;
