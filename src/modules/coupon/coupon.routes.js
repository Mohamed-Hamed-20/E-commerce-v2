import { Router } from "express";
import * as co_c from "./controller/coupon.js";
import { valid } from "../../middleware/validation.js";
import * as vs from "./controller/coupon.valid.js";
import { isAuth, roles } from "../../middleware/authentication.js";
const router = Router();
router.post(
  "/createCoupon",
  isAuth([roles.admin, roles.super]),
  valid(vs.createCouponSchema),
  co_c.createCoupon
);

router.put(
  "/update",
  valid(vs.updateCoupon),
  isAuth([roles.admin, roles.super]),
  co_c.updateCoupon
);

router.delete(
  "/delete",
  valid(vs.deleteCoupon),
  isAuth([roles.admin, roles.super]),
  co_c.deleteCoupon
);


router.get(
  "/getallcopuons",
  isAuth([roles.admin, roles.super]),
  co_c.getCoupons
);

export default router;
