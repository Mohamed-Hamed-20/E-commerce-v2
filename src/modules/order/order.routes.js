import { Router } from "express";
import { isAuth, roles } from "../../middleware/authentication.js";
import * as oc from "./controller/order.js";
import { valid } from "../../middleware/validation.js";
import * as orderSchema from "./controller/order.valid.js";
const router = Router();

router.use(
  "/add_order",
  valid(orderSchema.add_order),
  isAuth([roles.admin, roles.super, roles.user]),
  oc.add_order
);
router.use(
  "/cardToOrder",
  valid(orderSchema.cardToOrder),
  isAuth([roles.admin, roles.super, roles.user]),
  oc.cardToOrder
);
// ============================================================================
router.use("/success_url", oc.success_url);
router.use("/cancel_url", oc.cancel_url);
export default router;
