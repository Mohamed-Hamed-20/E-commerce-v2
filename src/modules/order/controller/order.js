import cardModel from "../../../../DB/models/card.model.js";
import orderModel from "../../../../DB/models/order.model.js";
import productModel from "../../../../DB/models/product.model.js";
import { couponValidation } from "../../../utils/couponValidation.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import Stripe from "stripe";
import { generateToken, verifyToken } from "../../../utils/tokenFunctions.js";
import couponModel from "../../../../DB/models/coupon.model.js";
import { paymentFunction, stripeCoupons } from "../../../utils/payment.js";
// import { paymentFunction } from "../../../utils/payment.js";
export const add_order = asyncHandler(async (req, res, next) => {
  //=============================== req.body ===================================
  const userId = req.user._id;
  const {
    quantity,
    productId,
    couponCode,
    address,
    phoneNumbers,
    paymentMethod,
  } = req.body;
  //=============================== product ===================================
  const product = await productModel
    .findById({ _id: productId })
    .select("title desc priceAfterDiscount Images stock");

  if (!product || product.stock < quantity) {
    return next(new Error("invalid product id or quantity Not available"), {
      cause: 400,
    });
  }

  //=============================== couponValidation ===================================
  if (couponCode) {
    const isCouponValid = await couponValidation(couponCode, userId);
    if (isCouponValid.code !== 200) {
      return next(new Error(isCouponValid.msg, { cause: 400 }));
    }
    req.coupon = isCouponValid.coupon;
  }
  //==================================== products ====================================
  let products = [];
  products.push({
    title: product.title,
    desc: product.desc,
    productId: product._id,
    quantity: quantity,
    price: product.priceAfterDiscount,
    finalPrice: product.priceAfterDiscount * quantity,
  });
  let subTotal = 0;
  subTotal = product.priceAfterDiscount * quantity;

  //=================================== paidAmount && req.coupon ==========================================
  if (req.coupon?.isFixedAmount && subTotal < req.coupon?.couponAmount) {
    return next(new Error("invalid Coupon Amount", { cause: 400 }));
  }

  let paidAmount = 0;
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100);
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount;
  } else {
    paidAmount = subTotal;
  }

  //================================== orderStatus =======================================
  let orderStatus;
  if (paymentMethod == "cash") {
    orderStatus = "placed";
  } else {
    orderStatus = "pending";
  }
  //=================================== orderOb =====================================
  const orderOb = {
    userId: req.user._id,
    products: products,
    subTotal: subTotal,
    couponId: req.coupon?._id,
    paidAmount: paidAmount,
    paymentMethod,
    orderStatus: orderStatus,
    address: address,
    phoneNumbers: [phoneNumbers],
  };

  const order = await orderModel.create(orderOb);

  if (!order) {
    return next(new Error("failed to create order", { cause: 400 }));
  }

  let paymentData;
  if (orderOb.paymentMethod == "card") {
    let stripeCoupon;
    if (req?.coupon) {
      stripeCoupon = await stripeCoupons(req?.coupon);
    }

    const token = generateToken({
      payload: { orderId: order._id },
      expiresIn: 60 * 60,
      signature: process.env.DEFAULT_SIGNATURE,
    });
    var frontEndURL = req.headers.referer;
    console.log(frontEndURL);
    paymentData = await paymentFunction({
      payment_method_types: ["card"],
      mode: "payment",
      // discounts: stripeCoupon ? { coupon: stripeCoupon.id } : null,
      customer_email: req.user.email,
      metadata: { orderId: order._id.toString() },
      success_url: `${req.protocol}://${req.headers.host}/order/successUrl?key=${token}`,
      cancel_url: `${req.protocol}://${req.headers.host}/order/cancelUrl?key=${token}`,
      line_items: products.map((prod) => {
        return {
          price_data: {
            currency: "EGP",
            unit_amount: prod.price * 100,
            product_data: {
              name: prod.title,
              description: prod.desc,
            },
          },
          quantity: prod.quantity,
        };
      }),
    });
  }

  product.stock -= parseInt(quantity);

  if (req.coupon) {
    for (const userCoupon of req.coupon.couponAssginedToUsers) {
      if (userCoupon.userId.toString() == req.user._id.toString()) {
        userCoupon.usageCount += 1;
      }
    }

    await Promise.all([req.coupon.save(), product.save()]);
  }
  return res
    .status(200)
    .json({ message: "done", order: order, paymentData: paymentData });
});

// ============================    new        ========================
export const cardToOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { cartId, couponCode, address, phoneNumbers, paymentMethod } = req.body;
  //============================ check cart ===============================
  const card = await cardModel.findOne({ _id: cartId, userId: userId });
  if (!card) {
    return next(new Error("invalid card or not to user", { cause: 400 }));
  }
  //============================ check coupon Code ===============================
  if (couponCode) {
    const isCouponValid = await couponValidation(couponCode, userId);
    if (isCouponValid.code !== 200) {
      return next(new Error(isCouponValid.msg), { cause: 400 });
    }
    req.coupon = isCouponValid.coupon;
  }
  //==================================orderStatus , paymentMethod ================================
  let orderStatus = "";
  if (paymentMethod == "cash") {
    orderStatus = "placed";
  } else {
    orderStatus = "pending";
  }
  //======================================== products =============================================
  let products = [];
  for (const product of card.products) {
    const productExist = await productModel.findById(product.productId);
    products.push({
      productId: productExist._id,
      quantity: product.quantity,
      title: productExist.title,
      price: productExist.priceAfterDiscount,
      finalPrice: productExist.priceAfterDiscount * product.quantity,
    });
  }
  //===================================== subTotal ==============================================
  let subTotal = 0;
  subTotal = card.subTotal;
  //================================= check coupon isFixedAmount amount ========================================
  if (req.coupon?.isFixedAmount && subTotal < req.coupon?.couponAmount) {
    return next(new Error("invalid Coupon Amount", { cause: 400 }));
  }
  //================================== paidAmount ================================================
  let paidAmount = 0;
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal * (1 - (req.coupon.couponAmount || 0) / 100);
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount;
  } else {
    paidAmount = subTotal;
  }
  //======================================== OrderObject =======================================
  const orderOb = {
    userId,
    products,
    subTotal,
    couponId: req.coupon._id,
    paidAmount,
    orderStatus: orderStatus,
    address,
    phoneNumbers,
    paymentMethod,
  };
  //==================================store in DB =====================================
  const order = await orderModel.create(orderOb);
  if (!order) {
    return next(new Error("failed to create order", { cause: 400 }));
  }
  return res.status(201).json({ message: "done", order: order });
});

export const success_url = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decode = verifyToken({ token: token });
  if (!decode?.orderId) {
    return next(new Error("Invalid token"), { cause: 400 });
  }
  const order = await orderModel.findByIdAndUpdate(
    {
      _id: decode.orderId,
      orderStatus: "pending",
    },
    { orderStatus: "confirmed" },
    { new: true }
  );
  if (!order) {
    return next(new Error("faild"));
  }
  return res.json({ message: "done", order });
});

export const cancel_url = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decode = verifyToken({ token: token });
  if (!decode) {
    return next(new Error("Invalid token"), { cause: 400 });
  }
  const order = await orderModel.findByIdAndUpdate(
    {
      _id: decode.orderId,
      orderStatus: "pending",
    },
    { orderStatus: "canceled" },
    { new: true }
  );
  for (const product of order.products) {
    await productModel.findByIdAndUpdate(
      { _id: product.productId },
      { $inc: { stock: parseInt(product.quantity) } }
    );
  }
  if (order?.couponId) {
    const coupon = await couponModel.findById({ _id: order.couponId });
    for (const user of coupon.couponAssginedToUsers) {
      if (user.userId.toString() == order.userId.toString()) {
        user.usageCount -= 1;
      }
    }
    await coupon.save();
  }

  if (!order) {
    return next(new Error("error fiald"));
  }
  return res.json({ message: "done", order, coupon });
});
