import joi from "joi";
import { Types } from "mongoose";

// import { validate } from "joi";
const req_FE = ["body", "params", "query", "file", "files", "headers"];
export const valid = (schema) => {
  return (req, res, next) => {
    const Validation_error = [];
    req_FE.forEach((key) => {
      if (schema[key]) {
        const validationResult = schema[key].validate(req[key], {
          abortEarly: false,
        });
        if (validationResult.error) {
          // إضافة كل رسالة خطأ ككائن منفصل
          validationResult.error.details.forEach((errorDetail) => {
            Validation_error.push({
              message: errorDetail.message.replace(/\"/g, ""),
              path: errorDetail?.path[0],
              label: errorDetail.context.label,
              type: errorDetail.type,
            });
          });
        }
      }
    });

    if (Validation_error.length > 0) {
      return res.status(400).json({
        message: "validation Error",
        error_Message: Validation_error,
      });
    }
    return next();
  };
};

//============================= validatioObjectId =====================
const validateObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("Invalid {#label} ");
};

export const customMessages = {
  "string.base": "{#label} must be a string",
  "string.min": "{#label} must be at least {#limit} characters",
  "string.max": "{#label} must be at most {#limit} characters",
  "number.base": "{#label} must be a number",
  "number.valid": "{#label} must be one of {#valids}",
  "boolean.base": "{#label} must be a boolean True or false",
  "array.base": "{#label} must be an array",
  "array.items": "Invalid item in {#label}",
  "_id.required": "{#label} is required",
  "_id.optional": "{#label} is optional",
  "any.only": "{#label} must be {#valids}",
  "any.required": "{#label} is required",
};
//======================general Validation Fields========================
export const generalFields = {
  email: joi.string().email({ tlds: { allow: ["com", "net", "org"] } }),
  password: joi
    .string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({
      "string.pattern.base": "Password regex fail",
    }),
  _id: joi.string().custom(validateObjectId),
  PhoneNumber: joi.string().pattern(/^[0-9]{11}$/),
  gender: joi.string().valid("male", "female"),
  department: joi.string().valid("cs", "is", "ai", "sc"),
  file: joi.object({
    size: joi.number(),
  }),
};
