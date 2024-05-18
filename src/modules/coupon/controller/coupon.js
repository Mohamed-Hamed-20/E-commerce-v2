import couponModel from "../../../../DB/models/coupon.model.js";
import { usermodel } from "../../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const createCoupon = asyncHandler(async (req, res, next) => {
  const {
    couponCode,
    couponAmount,
    fromDate,
    toDate,
    isPercentage,
    isFixedAmount,
    couponAssginedToUsers,
  } = req.body;
  if (isFixedAmount == isPercentage) {
    return next(new Error("please select one of them"), {
      cause: 400,
    });
  }
  const chkcoupon = await couponModel.findOne({ couponCode });
  if (chkcoupon) {
    return next(new Error("couponCode name is already exist"), { cause: 400 });
  }
  if (isPercentage) {
    if (couponAmount < 1 || couponAmount > 100) {
      return next(new Error("invalid couponAmount"), { cause: 400 });
    }
  }
  couponAssginedToUsers.forEach(async (ele) => {
    const user = await usermodel.findById(ele.userId);
    if (!user) {
      return next(new Error("invalid userId"), { cause: 400 });
    }
  });
  const couponobject = {
    couponCode,
    couponAmount,
    fromDate,
    toDate,
    isPercentage,
    isFixedAmount,
    couponAssginedToUsers,
    createdBy: req.user._id,
  };
  const coupon = await couponModel.create(couponobject);
  return res.status(201).json({ message: "done", result: coupon });
});
export const getCoupons = asyncHandler(async (req, res, next) => {
  const coupons = await couponModel.find();
  return res.status(200).json({ message: "done", result: coupons });
});

export const updateCoupon = asyncHandler(async (req, res, next) => {
  const couponId = req.query.couponId;
  const {
    couponCode,
    couponAmount,
    fromDate,
    toDate,
    isPercentage,
    isFixedAmount,
    couponAssginedToUsers,
  } = req.body;

  console.log({
    couponCode,
    couponAmount,
    fromDate,
    toDate,
    isPercentage,
    isFixedAmount,
    couponAssginedToUsers,
  });

  if (isFixedAmount == isPercentage) {
    return next(
      new Error("please select one of them", {
        cause: 400,
      })
    );
  }

  if (isPercentage) {
    if (couponAmount < 1 || couponAmount > 100) {
      return next(new Error("invalid couponAmount"), { cause: 400 });
    }
  }
  const coupon = await couponModel.findById(couponId);

  if (!coupon) {
    return next(
      new Error("couponId Not found", {
        cause: 400,
      })
    );
  }

  // vaild coupon code
  if (couponCode && coupon.couponCode !== couponCode) {
    const check = await couponModel.findOne({ couponCode: couponCode });
    if (check) {
      return next(
        new Error("couponCode name is already exist", {
          cause: 400,
        })
      );
    }
    coupon.couponCode = couponCode;
  }

  if (couponAmount) coupon.couponAmount = couponAmount;
  if (fromDate) coupon.fromDate = fromDate;
  if (toDate) coupon.toDate = toDate;

  if (couponAssginedToUsers) {
    const userIds = couponAssginedToUsers.map((user) => {
      return user.userId;
    });
    console.log(userIds);
    const users = await usermodel.find({ _id: { $in: userIds } });

    if (users.length < userIds.length) {
      return next(new Error("Inaid one or more userId", { cause: 404 }));
    }

    coupon.couponAssginedToUsers = couponAssginedToUsers;
  }

  const update = await coupon.save();

  return res.json({
    message: "coupon updated successfully",
    coupon: update,
  });
});
