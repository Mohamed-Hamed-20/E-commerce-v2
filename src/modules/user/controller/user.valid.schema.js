import joi from "joi";
import {
  customMessages,
  generalFields,
} from "../../../middleware/validation.js";
export const singup = {
  body: joi
    .object({
      firstName: joi.string().min(3).max(10).messages(customMessages),
      lastName: joi.string().min(3).max(10).messages(customMessages),
      userName: joi.string().min(3).max(20).required().messages(customMessages),
      email: generalFields.email.required().messages(customMessages),
      password: generalFields.password.required().messages(customMessages),
      cpassword: joi
        .string()
        .valid(joi.ref("password"))
        .required()
        .messages(customMessages),
      gender: joi.string().valid("male", "female").messages(customMessages),
    })
    .required()
    .messages(customMessages),
  // paramas: joi.object().required(),
  // query: joi.object().required(),
  // file: joi.object().required(),
};

export const login = {
  body: joi
    .object({
      email: generalFields.email.required().messages(customMessages),
      password: generalFields.password.required().messages(customMessages),
    })
    .required(),
};

export const forgetPass = {
  body: joi
    .object({
      email: generalFields.email.required().messages(customMessages),
    })
    .required(),
};

export const resetpassword = {
  body: joi
    .object({
      email: generalFields.email.required().messages(customMessages),
      password: generalFields.password.required().messages(customMessages),
      confirmPassword: joi
        .string()
        .valid(joi.ref("password"))
        .required()
        .messages(customMessages),
      forgetCode: joi
        .string()
        .min(7)
        .max(7)
        .required()
        .messages(customMessages),
    })
    .required()
    .messages(customMessages),
};

export const deleteUser = {
  query: joi.object({
    userId: generalFields._id.required(),
  }),
};
