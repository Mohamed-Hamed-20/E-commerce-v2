import { Router } from "express";
import * as uc from "./controller/user.js";
import * as schema from "./controller/user.valid.schema.js";
import { valid } from "../../middleware/validation.js";
import { isAuth, roles } from "../../middleware/authentication.js";
import { multerCloudFunction } from "../../utils/multerCloud.js";
import * as allowedExtensions from "../../utils/allowedExtensions.js";
const router = Router();

router.post("/register", valid(schema.singup), uc.register);
router.get("/confirmEmail/:activationCode", uc.confirmEmail);
router.post("/login", valid(schema.login), uc.login);
router.get("/getuser", isAuth([roles.user, roles.admin]), uc.getuser);
router.delete(
  "/delete",
  valid(schema.deleteUser),
  isAuth([roles.admin, roles.super]),
  uc.deleteUser
);
router.post("/sendForgetCode", valid(schema.forgetPass), uc.sendForgetCode);
router.post("/resetpassword", valid(schema.resetpassword), uc.resetpassword);
router.get("/searchusers", isAuth([roles.admin]), uc.searchusers);

// missed login with Gmail   <<<<=====
export default router;
