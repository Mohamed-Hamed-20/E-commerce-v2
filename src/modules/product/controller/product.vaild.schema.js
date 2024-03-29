import joi from "joi";
import { Types } from "mongoose";
import {
  customMessages,
  generalFields,
} from "../../../middleware/validation.js";

const validationId = (value, helper) => {
  if (!Types.ObjectId.isValid(value)) {
    return helper.message("invalid object ID");
  } else {
    return true;
  }
};
export const createProductSchema = {
  body: joi
    .object({
      title: joi.string().required().messages(customMessages),
      desc: joi.string().optional().messages(customMessages),
      price: joi.number().required().messages(customMessages),
      color: joi
        .alternatives()
        .try(joi.string(), joi.array())
        .required()
        .messages(customMessages),
      size: joi
        .alternatives()
        .try(joi.string(), joi.array())
        .required()
        .messages(customMessages),
      appliedDiscount: joi
        .number()
        .min(0)
        .max(100)
        .optional()
        .messages(customMessages),
      stock: joi.number().required().messages(customMessages),
      image: joi.string().optional().messages(customMessages),
    })
    .required(),
  query: joi
    .object({
      categoryId: generalFields._id.required().messages(customMessages),
    })
    .required(),
};

export const updateProductSchema = {
  body: joi.object({
    title: joi.string().optional().messages(customMessages),
    desc: joi.string().optional().messages(customMessages),
    price: joi.number().optional().messages(customMessages),
    appliedDiscount: joi
      .number()
      .min(0)
      .max(100)
      .optional()
      .messages(customMessages),
    color: joi.array().optional().messages(customMessages),
    size: joi.array().optional().messages(customMessages),
    stock: joi.number().optional().messages(customMessages),
    categoryId: generalFields._id.optional().messages(customMessages),
  }),
  query: joi
    .object({
      productId: generalFields._id.required().messages(customMessages),
    })
    .required(),
};
export const deleteProduct = {
  query: joi
    .object({
      productId: generalFields._id.required().messages(customMessages),
    })
    .required(),
};

export const addImgToproduct = {
  body: joi
    .object({
      productId: generalFields._id.required().messages(customMessages),
    })
    .required(),
};
export const deleteImgfromProduct = {
  body: joi
    .object({
      productId: generalFields._id.required().messages(customMessages),
      ImgName: joi.string().min(4).required().messages(customMessages),
    })
    .required(),
};
