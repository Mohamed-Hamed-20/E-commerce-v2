import { Router } from "express";
import * as pc from "./controller/product.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import * as allowedExtensions from "../../utils/allowedExtensions.js";
import { valid } from "../../middleware/validation.js";
import * as validschema from "./controller/product.vaild.schema.js";
import { multerCloud } from "../../utils/aws.s3.js";
const router = Router({ mergeParams: true });

router.post(
  "/createProduct",
  multerCloud(allowedExtensions.Image).array("image", 5),
  isAuth([roles.admin]),
  valid(validschema.createProductSchema),
  pc.createProduct
);

router.put(
  "/updateProduct",
  valid(validschema.updateProductSchema),
  isAuth([roles.admin]),
  pc.updateProduct
);

router.get("/getProduct", pc.getProduct);
router.delete(
  "/deleteProduct",
  valid(validschema.deleteProduct),
  isAuth([roles.admin]),
  pc.deleteProduct
);
router.post(
  "/addImgToproduct",
  multerCloud(allowedExtensions.Image).array("image", 5),
  isAuth([roles.admin]),
  valid(validschema.addImgToproduct),
  pc.addImgToproduct
);
router.patch(
  "/deleteImgfromProduct",
  valid(validschema.deleteImgfromProduct),
  isAuth([roles.admin]),
  pc.deleteImgfromProduct
);
router.get("/searchByCategoryId", pc.searchByCategoryId);
router.get(
  "/getsingleProduct",
  valid(validschema.deleteProduct),
  pc.getsingleProduct
);

export default router;
