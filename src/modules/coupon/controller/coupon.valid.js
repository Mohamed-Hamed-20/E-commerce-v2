import joi from "joi";
import { generalFields } from "../../../middleware/validation.js";

export const createCouponSchema = {
  body: joi
    .object({
      couponCode: joi.string().min(4).max(10).required(),
      couponAmount: joi.number().required(),
      isPercentage: joi.boolean(),
      isFixedAmount: joi.boolean(),
      fromDate: joi
        .date()
        .greater(Date.now() - 24 * 60 * 60 * 1000)
        .required(),
      toDate: joi.date().greater(joi.ref("fromDate")).required(),
      couponAssginedToUsers: joi
        .array()
        .items(
          joi.object({
            userId: generalFields._id.required(),
            maxUsage: joi.number().required(),
          })
        )
        .required(),
    })
    .required(),
};

export const updateCoupon = {
  body: joi
    .object({
      couponCode: joi.string().min(4).max(10).optional(),
      couponAmount: joi.number().optional(),
      isPercentage: joi.boolean(),
      isFixedAmount: joi.boolean(),
      fromDate: joi
        .date()
        .greater(Date.now() - 24 * 60 * 60 * 1000)
        .optional(),
      toDate: joi.date().greater(joi.ref("fromDate")).optional(),
      couponAssginedToUsers: joi
        .array()
        .items(
          joi.object({
            userId: generalFields._id.required(),
            maxUsage: joi.number().required(),
          })
        )
        .optional(),
    })
    .required(),

  query: joi
    .object({
      couponId: generalFields._id.required(),
    })
    .required(),
};

export const deleteCoupon = {
  query: joi
    .object({
      couponId: generalFields._id.required(),
    })
    .required(),
};
