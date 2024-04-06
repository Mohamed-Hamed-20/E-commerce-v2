import Joi from "joi";
import { Types } from "mongoose";
import { customMessages } from "../../../middleware/validation.js";
const validationId = (value, helper) => {
  if (!Types.ObjectId.isValid(value)) {
    return helper.message("invalid object ID");
  } else {
    return true;
  }
};
export const addToCart = {
  body: Joi.object({
    productId: Joi.custom(validationId).required().messages(customMessages),
    quantity: Joi.number().min(1).max(50).required().messages(customMessages),
  }).required(),
};
export const deleteFromCart = {
  query: Joi.object({
    productId: Joi.custom(validationId).required().messages(customMessages),
  }).required(),
};
