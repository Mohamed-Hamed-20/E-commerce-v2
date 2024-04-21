import Joi from "joi";
import { Types } from "mongoose";
import {
  customMessages,
  generalFields,
} from "../../../middleware/validation.js";
const validationId = (value, helper) => {
  console.log(value);

  if (!Types.ObjectId.isValid(value)) {
    return helper.message("invalid object ID");
  } else {
    console.log(value);
    return value;
  }
};
export const addToCart = {
  body: Joi.object({
    productId: generalFields._id.required(),
    quantity: Joi.number().min(1).max(50).required().messages(customMessages),
  }).required(),
};
export const deleteFromCart = {
  query: Joi.object({
    productId: Joi.custom(validationId).required().messages(customMessages),
  }).required(),
};
