import { Router } from "express";
import * as co_c from "./controller/coupon.js";
import { valid } from "../../middleware/validation.js";
import { createCouponSchema } from "./controller/coupon.valid.js";
import { isAuth, roles } from "../../middleware/authentication.js";
const router = Router();
router.post(
  "/createCoupon",
  isAuth([roles.admin, roles.super]),
  valid(createCouponSchema),
  co_c.createCoupon
);
router.get(
  "/getallcopuons",
  isAuth([roles.admin, roles.super]),
  co_c.getCoupons
);

export default router;
