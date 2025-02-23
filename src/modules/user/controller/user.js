import { usermodel } from "../../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import bcrypt, { hashSync, compareSync } from "bcryptjs";
import { sendEmail } from "../../../utils/sendEmail.js";
import crypto from "crypto";
import {
  SignUpTemplet,
  restpasswordTemplet,
} from "../../../utils/generateHtml.js";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { generateToken } from "../../../utils/tokenFunctions.js";
import { storeRefreshToken } from "../../../utils/Tokens.js";
import { hashpassword, verifypass } from "../../../utils/hashpassword.js";
import TokenModel from "../../../../DB/models/Token.model.js";
import { ApiFeature } from "../../../utils/apiFeature.js";
import { roles } from "../../../middleware/authentication.js";
const nanoid = customAlphabet("1234567890", 7);

export const register = asyncHandler(async (req, res, next) => {
  const { email, gender, password, userName, lastName, firstName } = req.body;
  const chkemail = await usermodel.findOne({ email });
  if (chkemail) {
    return next(new Error("email is already exist", { cause: 400 }));
  }
  //chk username
  const chkeuserName = await usermodel.findOne({ userName });
  if (chkeuserName) {
    return next(new Error("username is already exist", { cause: 400 }));
  }

  const hashpassword = hashSync(password, parseInt(process.env.salt_Round));
  const activationCode = crypto.randomBytes(64).toString("hex");

  const result = new usermodel({
    firstName,
    lastName,
    email,
    password: hashpassword,
    userName,
    gender,
    activationCode,
  });

  //safe document
  const done1 = await result.save();
  if (!done1) {
    return next(new Error("Something went wrong!", { cause: 500 }));
  }

  res
    .status(201)
    .json({ message: "Registered successfully , Check your Email", result });

  const link = `${req.protocol}://${req.headers.host}/user/confirmEmail/${activationCode}`;
  const isSend = await sendEmail({
    to: email,
    subject: "confirm Email",
    html: `${SignUpTemplet(link)}`,
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { activationCode } = req.params;

  const findUser = await usermodel
    .findOneAndUpdate(
      { activationCode: activationCode },
      { isconfrimed: true, $unset: { activationCode: 1 } },
      { new: true }
    )
    .lean();
  if (!findUser) {
    return next(new Error("user Not found ", { cause: 404 }));
  }
  return res.status(200).json({
    message: "done Email confrimed",
    user: {
      _id: findUser._id,
      firstName: findUser.firstName,
      lastName: findUser.lastName,
      email: findUser.email,
      isconfrimed: findUser.isconfrimed,
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  //get data
  const { email, password } = req.body;
  //chk email in DB
  const user = await usermodel.findOne({ email: email });
  if (!user) {
    return next(new Error("invalid email or password", { cause: 404 }));
  }

  //chk is confirm email
  if (user.isconfrimed == false) {
    return next(new Error("please confirm ur email", { cause: 400 }));
  }

  // check password
  const matched = await verifypass({
    password: password,
    hashpassword: user.password,
  });
  if (!matched) {
    return next(new Error("Invalid Email or password", { cause: 404 }));
  }

  //generate accessToken
  const accessToken = generateToken({
    payload: { userId: user._id, role: user.role, IpAddress: req.ip },
    signature: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: process.env.accessExpireIn,
  });

  //generate refreshToken
  const refreshToken = generateToken({
    payload: { userId: user._id, role: user.role, IpAddress: req.ip },
    signature: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: process.env.REFRESH_ExpireIn,
  });

  //chk it generateed
  if (!accessToken || !refreshToken) {
    return next(new Error("invalid Token", { cause: 500 }));
  }

  /// read this to here code take time near to 344ms

  //resopnse done with token
  res.status(200).json({
    message: `welcome ${user.firstName} ${user.lastName}`,
    accessToken: accessToken,
    refreshToken: refreshToken,
    role: user.role,
  });

  // Perform the remaining tasks asynchronously
  try {
    // Save the refresh token in DB asynchronously
    await storeRefreshToken(refreshToken, user._id, next);

    // Update the user's status to online
    user.status = "online";
    await user.save();
  } catch (error) {
    // You can log this error or handle it without affecting the user experience
    console.error("Error in background tasks:", error);
  }
});

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  //chk email exist
  const user = await usermodel.findOne({ email: email });
  if (!user) {
    return next(new Error("invaild email", { cause: 404 }));
  }
  //generate forget code
  const forgetCode = nanoid();
  user.forgetCode = forgetCode;
  await user.save();
  // send this code to him by email
  sendEmail({
    to: user.email,
    subject: "Resst ur password",
    html: `${restpasswordTemplet(forgetCode)}`,
  });
  //res chk ur email
  res.json({ sucuss: true, message: "chect ur email" });
});

export const resetpassword = asyncHandler(async (req, res, next) => {
  const { forgetCode, email, password } = req.body;
  //chk email exist and forgetCode right
  const user = await usermodel.findOne({ email });

  if (!user) {
    return next(new Error("invalid email", { cause: 404 }));
  }
  if (user.forgetCode != forgetCode) {
    return next(new Error("invalid forgetCode", { cause: 400 }));
  }
  // make all token for this user is false
  const tokens = await TokenModel.findOneAndUpdate(
    { userID: user._id },
    { isvalid: false },
    { new: true }
  );

  // password using hash password
  const newpassword = await hashpassword({
    password: password,
    saltRound: process.env.salt_Round,
  });

  //update user table passwoed and forgetpass
  user.password = newpassword;
  delete user.forgetCode;
  const result = await user.save();

  if (!result) {
    return next(new Error("server Error :(", { cause: 500 }));
  }
  return res.json({ message: "Done", result, tokens });
});

export const getuser = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const result = await usermodel.findOne({ _id: user._id });
  if (!result) {
    return next(new Error("User not found"));
  }
  return res.status(200).json({ message: "done", user: result });
});
export const searchusers = asyncHandler(async (req, res, next) => {
  const allowFields = [
    "firstName",
    "lastName",
    "userName",
    "email",
    "address",
    "phone",
    "gender",
    "status",
    "role",
  ];

  const searchFieldsText = ["firstName", "lastName", "userName", "email"];
  const searchFieldsIds = ["_id"];
  const apiFeatureInstance = new ApiFeature(
    usermodel.find({ role: roles.user }),
    req.query,
    allowFields
  )
    .pagination()
    .sort()
    .select()
    .filter()
    .search({ searchFieldsIds, searchFieldsText });
  const users = await apiFeatureInstance.MongoseQuery;

  return res
    .status(200)
    .json({ message: "Done", success: true, result: users });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.query.userId;
  const userdelete = await usermodel.findOneAndDelete({
    _id: userId,
    role: roles.user,
  });

  if (!userdelete) {
    return next(new Error("user not found or not allow to delete this user"));
  }

  // response
  return res.json({ message: "deleted successfully" });
});
export const ___ = asyncHandler(async (req, res, next) => {});
