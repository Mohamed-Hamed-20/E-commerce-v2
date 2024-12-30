import cardModel from "../../../../DB/models/card.model.js";
import orderModel from "../../../../DB/models/order.model.js";
import productModel from "../../../../DB/models/product.model.js";
import { couponValidation } from "../../../utils/couponValidation.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import Stripe from "stripe";
import { generateToken, verifyToken } from "../../../utils/tokenFunctions.js";
import couponModel from "../../../../DB/models/coupon.model.js";
import { paymentFunction, stripeCoupons } from "../../../utils/payment.js";
import { ApiFeature } from "../../../utils/apiFeature.js";
import { GetsingleImg } from "../../../utils/aws.s3.js";

export const validateOrder = asyncHandler(async (req, res, next) => {
  await Promise.all([
    productVaildation(req, res, next),
    applyCoupon(req, res, next),
  ]);

  await Promise.all([makeOrder(req, res, next), paymentMethod(req, res, next)]);
});

export const productVaildation = asyncHandler(async (req, res, next) => {
  const { quantity, productId } = req.body;

  // Get product
  const product = await productModel
    .findById(productId)
    .select("title desc priceAfterDiscount stock");

  // product not found
  if (!product) {
    return next(new Error("Invaild ProductId", { cause: 404 }));
  }
  // not availabe stock
  if (product.stock < quantity) {
    return next(
      new Error(`Insufficient stock. Available quantity: ${product.stock}`, {
        cause: 400,
      })
    );
  }

  const orderPrice = product.priceAfterDiscount * quantity;

  req.product = product;
  req.orderPrice = orderPrice;
  return next();
});

export const applyCoupon = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { couponCode } = req.body;

  //=============================== couponValidation ===================================
  if (couponCode) {
    const isCouponValid = await couponValidation(couponCode, userId);
    if (isCouponValid.code !== 200) {
      return next(new Error(isCouponValid.msg, { cause: 400 }));
    }
    req.coupon = isCouponValid.coupon;
  }
  return next();
});

export const makeOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const product = req.product;
  const coupon = req.coupon;
  const orderPrice = req.orderPrice;
  const { quantity, address, phoneNumbers, paymentMethod } = req.body;

  //=================================== paidAmount && coupon ==========================================
  if (coupon?.isFixedAmount && orderPrice < coupon?.couponAmount) {
    return next(new Error("invalid Coupon Amount", { cause: 400 }));
  }

  // apply coupn in payment
  let paidAmount = 0;
  if (coupon?.isPercentage) {
    paidAmount = orderPrice * (1 - (req.coupon.couponAmount || 0) / 100);
  } else if (coupon?.isFixedAmount) {
    paidAmount = orderPrice - req.coupon.couponAmount;
  } else {
    paidAmount = orderPrice;
  }

  //================================== orderStatus =======================================
  let orderStatus;
  if (paymentMethod == "cash") {
    orderStatus = "placed";
  } else {
    orderStatus = "pending";
  }

  const products = [{ productId: product._id, quantity: quantity }];
  paidAmount = Math.round(paidAmount * 100) / 100;
  //=================================== orderOb =====================================

  const orderOb = new orderModel({
    userId: userId,
    products: products,
    subTotal: orderPrice,
    couponId: coupon._id,
    paidAmount: paidAmount,
    paymentMethod,
    orderStatus: orderStatus,
    address: address,
    phoneNumbers: [phoneNumbers],
  });

  const order = await orderOb.save();

  if (!order) {
    return next(new Error("failed to create order", { cause: 500 }));
  }

  req.order = order;
  return next();
});

export const paymentMethod = asyncHandler(async (req, res, next) => {
  const order = req.order;
  const coupon = req.coupon;
  const { quantity } = req.body;

  let paymentData;
  if (order.paymentMethod == "card") {
    let stripeCoupon;
    if (req?.coupon) {
      stripeCoupon = await stripeCoupons(coupon);
    }

    const token = generateToken({
      payload: { orderId: order._id },
      expiresIn: 60 * 60,
      signature: process.env.DEFAULT_SIGNATURE,
    });

    var frontEndURL = req.headers.referer;

    const product = {
      title: req.product.title,
      desc: req.product.desc,
      priceAfterDiscount: req.product.priceAfterDiscount,
      quantity: quantity,
    };

    paymentData = await paymentFunction({
      user: req.user,
      products: [product],
      order: order,
      discounts: stripeCoupon ? [{ coupon: stripeCoupon.id }] : [],
      success_url: `${frontEndURL}order/success_url?key=${token}`,
      cancel_url: `${frontEndURL}order/cancel_url?key=${token}`,
    });
  }

  req.product.stock -= parseInt(quantity);

  if (req.coupon) {
    for (const userCoupon of req.coupon.couponAssginedToUsers) {
      if (userCoupon.userId.toString() == req.user._id.toString()) {
        userCoupon.usageCount += 1;
      }
    }

    await Promise.all([req.coupon.save(), req.product.save()]);
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

  const card = await cardModel
    .findOne({ _id: cartId, userId: userId })
    .populate({
      path: "products.productId",
      select: "title priceAfterDiscount desc stock",
    });
  if (!card) {
    return next(new Error("invalid card or not to user", { cause: 400 }));
  }

  if (card.products.length <= 0) {
    return next(new Error("you dont have product to buy", { cause: 400 }));
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
    products.push({
      productId: product.productId._id,
      quantity: product.quantity,
      title: product.productId.title,
      desc: product.productId.desc,
      priceAfterDiscount: product.productId.priceAfterDiscount,
      finalPrice: product.productId.priceAfterDiscount * product.quantity,
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

  paidAmount = Math.round(paidAmount * 100) / 100;
  //======================================== OrderObject =======================================
  const orderOb = {
    userId,
    products,
    subTotal,
    couponId: req?.coupon?._id,
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

  let paymentData;
  if (order.paymentMethod == "card") {
    let stripeCoupon;
    if (req?.coupon) {
      stripeCoupon = await stripeCoupons(req.coupon);
    }

    const token = generateToken({
      payload: { orderId: order._id },
      expiresIn: 60 * 60,
      signature: process.env.DEFAULT_SIGNATURE,
    });

    var frontEndURL = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    paymentData = await paymentFunction({
      user: req.user,
      products: products,
      order: order,
      discounts: stripeCoupon ? [{ coupon: stripeCoupon.id }] : [],
      success_url: `${frontEndURL}/order/success_url?key=${token}`,
      cancel_url: `${frontEndURL}/order/cancel_url?key=${token}`,
    });
  }

  const promises = products.map(async (product) => {
    return await productModel.findByIdAndUpdate(
      product._id,
      { $inc: { stock: -product.quantity } },
      { new: true }
    );
  });

  if (req.coupon) {
    for (const userCoupon of req.coupon.couponAssginedToUsers) {
      if (userCoupon.userId.toString() == req.user._id.toString()) {
        userCoupon.usageCount += 1;
      }
    }
  }

  card.products = [];
  card.subTotal = 0;

  const [coupon, product, carddelete] = await Promise.all([
    req?.coupon?.save(),
    promises,
    card.save(),
  ]);

  return res
    .status(201)
    .json({ message: "done", order: order, payment: paymentData });
});

export const success_url = asyncHandler(async (req, res, next) => {
  const { key } = req.query;
  const decode = verifyToken({ token: key });
  if (!decode?.orderId) {
    return next(new Error("Invalid token"), { cause: 400 });
  }
  const order = await orderModel
    .findByIdAndUpdate(
      {
        _id: decode.orderId,
        orderStatus: "pending",
      },
      { orderStatus: "confirmed" },
      { new: true, lean: true }
    )
    .select("-cancelledBy -updatedBy");

  if (!order) {
    return next(new Error("faild"));
  }
  return res.json({ message: "order Updated successfully", order });
});

export const cancel_url = asyncHandler(async (req, res, next) => {
  const { key } = req.query;
  const decode = verifyToken({ token: key });
  if (!decode) {
    return next(new Error("Invalid token"), { cause: 400 });
  }

  try {
    const order = await orderModel.findByIdAndDelete(
      {
        _id: decode.orderId,
        orderStatus: "pending",
      },
      { new: true }
    );

    if (!order) {
      return next(new Error("Error occurred while deleting order"));
    }

    // Array to store promises for updating products
    const productUpdatePromises = [];

    // Update products stock
    for (const product of order.products) {
      const updateProductPromise = productModel.findByIdAndUpdate(
        { _id: product.productId },
        { $inc: { stock: parseInt(product.quantity) } }
      );
      productUpdatePromises.push(updateProductPromise);
    }

    // Update coupons if applicable
    if (order.couponId) {
      const coupon = await couponModel.findById(order.couponId);

      // Array to store promises for updating coupons
      const couponUpdatePromises = [];

      for (const user of coupon.couponAssginedToUsers) {
        if (user.userId.toString() === order.userId.toString()) {
          user.usageCount -= 1;
          const updateCouponPromise = coupon.save();
          couponUpdatePromises.push(updateCouponPromise);
          break; // No need to continue once the user is found
        }
      }

      // Wait for all coupon updates to complete
      await Promise.all(couponUpdatePromises);
    }

    // Wait for all product updates to complete
    await Promise.all(productUpdatePromises);

    return res.json({ message: "Order cancellation successful", order });
  } catch (error) {
    return next(new Error("Error occurred while processing cancellation"));
  }
});

export const searchOrders = asyncHandler(async (req, res, next) => {
  const allowFields = [
    "userId",
    "products",
    "subTotal",
    "couponId",
    "paidAmount",
    "address",
    "phoneNumbers",
    "orderStatus",
    "paymentMethod",
  ];

  // إعداد الـ pipeline للعمل مع aggregate
  const pipeline = [
    { $match: { orderStatus: "pending" } }, // تحديد حالة الطلب
    {
      $lookup: {
        from: "users", // تأكد من أن هذا هو اسم مجموعة المستخدمين في قاعدة البيانات
        localField: "userId", // حقل الـ userId في الطلب
        foreignField: "_id", // حقل الـ _id في مجموعة المستخدمين
        as: "userId", // سيتم تخزين البيانات المسترجعة هنا
      },
    },
    {
      $unwind: "$userId", // فك التفاف المصفوفة الناتجة من الـ lookup
    },
    {
      $lookup: {
        from: "products", // تأكد من أن هذا هو اسم مجموعة المنتجات في قاعدة البيانات
        localField: "products.productId", // حقل الـ productId في الطلب
        foreignField: "_id", // حقل الـ _id في مجموعة المنتجات
        as: "products", // سيتم تخزين البيانات المسترجعة هنا
      },
    },
    {
      $project: {
        "userId.firstName": 1,
        "userId.lastName": 1,
        "userId.userName": 1,
        "userId.email": 1,
        "userId.gender": 1,
        "userId.role": 1,
        "products.title": 1,
        "products.desc": 1,
        "products.price": 1,
        "products.appliedDiscount": 1,
        "products.priceAfterDiscount": 1,
        "products.Images": 1,
        "products.categoryId": 1,
        subTotal: 1,
        orderStatus: 1,
        paymentMethod: 1,
        address: 1,
        phoneNumbers: 1,
      },
    },
  ];

  // تنفيذ الـ aggregate
  const orders = await orderModel.aggregate(pipeline);

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: "No orders found", success: false });
  }

  for (const order of orders) {
    for (const product of order.products) {
      if (product.Images && product?.Images?.length > 0) {
        for (const Image of product.Images) {
          const { url } = await GetsingleImg({ ImgName: Image.public_id });
          Image.secure_url = url;
        }
      }
    }
  }

  return res.status(200).json({ message: "Done", success: true, orders });
});
