import { Router } from "express";
import * as CardControl from "./controller/card.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import { authorization } from "../../middleware/authorization.js";
import { valid } from "../../middleware/validation.js";
import * as schema from "./controller/card.validation.js";
const router = Router();

router.post(
  "/addToCart",
  isAuth([roles.admin, roles.super, roles.user]),
  valid(schema.addToCart),
  CardControl.addToCart
);

router.patch(
  "/deleteFromCart",
  isAuth([roles.admin, roles.super, roles.user]),
  valid(schema.deleteFromCart),
  CardControl.deleteFromCart
);
router.get(
  "/getCardInfo",
  isAuth([roles.admin, roles.super, roles.user]),
  CardControl.getCardInfo
);
export default router;
