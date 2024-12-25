import joi from "joi";
import { isValidObject } from "../../subcategories/controller/Subcategory.valid.schema.js";

export const createSchemaCategory = {
  body: joi
    .object({
      name: joi.string().min(4).max(25).required(),
    })
    .required()
    .optional({ presence: "required" }),
};

export const UpdateSchemaCategory = {
  body: joi
    .object({
      name: joi.string().min(4).max(13).optional(),
    })
    .required(),
  query: joi
    .object({
      categoryId: joi.custom(isValidObject).required(),
    })
    .required(),
};

export const deleteSchemaCategory = {
  query: joi
    .object({
      categoryId: joi.custom(isValidObject).required(),
    })
    .required(),
};
