import { Router } from "express";
import * as Bc from "./controller/brand.js";
import { multerCloudFunction } from "../../utils/multerCloud.js";
import * as allowedExtensions from "../../utils/allowedExtensions.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import { valid } from "../../middleware/validation.js";
import * as schema from "./controller/brand.valid.js";
const router = Router();

router.post(
  "/createBrand",
  isAuth([roles.admin, roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("logo"),
  valid(schema.Vaild_CreateB),
  Bc.createBrand
);
router.put(
  "/updateBrand",
  isAuth([roles.admin, roles.super]),
  multerCloudFunction(allowedExtensions.Image).single("logo"),
  valid(schema.Vaild_updateB),
  Bc.updateBrand
);

router.delete(
  "/deleteBrand",
  isAuth([roles.admin, roles.super]),
  valid(schema.Vaild_deleteB),
  Bc.deleteBrand
);
router.get("/searchbrand", Bc.searchbrand);
export default router;
