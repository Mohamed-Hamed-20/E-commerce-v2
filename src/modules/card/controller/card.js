import cardModel from "../../../../DB/models/card.model.js";
import productModel from "../../../../DB/models/product.model.js";
import { GetsingleImg } from "../../../utils/aws.s3.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const addToCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;
  const ChkProduct = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  });
  if (!ChkProduct) {
    return next(
      new Error("invalid product Id or quantity is not available ", {
        cause: 404,
      })
    );
  }
  let subTotal = 0;
  const card = await cardModel.findOne({ userId: userId });
  if (!card) {
    const cardObject = {
      userId: userId,
      products: [{ productId: productId, quantity: quantity }],
      subTotal: (subTotal += ChkProduct.priceAfterDiscount * quantity),
    };
    const save_Card = await cardModel.create(cardObject);
    if (!save_Card) {
      return next(new Error("server error try later", { cause: 500 }));
    }
    return res.status(200).json({ message: "done", result: save_Card });
  }

  if (card) {
    let updated = false;
    for (const product of card.products) {
      if (productId == product.productId.toString()) {
        product.quantity = quantity;
        updated = true;
      }
    }

    if (!updated) {
      card.products.push({ productId, quantity });
    }
    //==================== calculate Subtotal ===============
    for (const product of card.products) {
      const price_product = await productModel.findById({
        _id: product.productId,
      });

      subTotal +=
        parseFloat(price_product.priceAfterDiscount) *
        parseInt(product.quantity);
    }
    card.subTotal = subTotal;
    const result = await card.save();
    if (!result) {
      return next(new Error("server error try later", { cause: 500 }));
    }
    return res.status(200).json({ message: "done", result: result });
  }
});

export const deleteFromCart = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.query;

  //find card to user
  const card = await cardModel.findOne({
    userId: userId,
    "products.productId": productId,
  });
  if (!card) {
    return next(
      new Error("Card Not found or product not in card", { cause: 400 })
    );
  }
  console.log(card);
  //chk product
  const product = await productModel.findById(productId);
  //if not found
  if (!product) {
    return next(new Error("product Id Not found", { cause: 400 }));
  }
  console.log(product);
  // edit subTotal
  let subTotal = parseInt(card.subTotal) || 0;
  console.log({ before: subTotal });
  for (const productInfo of card.products) {
    console.log({ hi: productInfo });
    if (productInfo.productId.toString() == productId.toString()) {
      subTotal -=
        parseInt(product.priceAfterDiscount) * parseInt(productInfo.quantity);
    }
  }
  card.subTotal = subTotal;
  card.products = card.products.filter((element) => {
    if (element.productId == productId) {
      return false;
    }
    return true;
  });
  const result = await card.save();
  return res.status(200).json({ message: "done", success: true, result });
});

export const getCardInfo = asyncHandler(async (req, res, next) => {
  let user = req.user;
  let card = await cardModel
    .findOne({ userId: user._id })
    .populate({
      path: "userId",
      select: "firstName lastName userName email role gender phone ",
    })
    .populate({
      path: "products.productId",
      select: "-customId -createdBy -updateBy",
    });

  if (!card) {
    card = await cardModel.create({
      userId: user._id,
    });
  }

  if (card?.products?.length > 0) {
    await Promise.all(
      card?.products?.map(async (product) => {
        await Promise.all(
          product?.productId?.Images?.map(async (image) => {
            const { url } = await GetsingleImg({ ImgName: image.public_id });
            image.secure_url = url;
          })
        );
      })
    );
  }

  return res.status(200).json({ message: "Card Information", card: card });
});
export const ________ = asyncHandler(async (req, res, next) => {});
