import { Schema, Types, model } from "mongoose";
import cardModel from "./card.model.js";

const productSchema = new Schema(
  {
    title: {
      type: String,
      lowecase: true,
      required: true,
    },
    slug: {
      type: String,
      lowecase: true,
      required: true,
    },
    desc: {
      type: String,
    },
    customId: {
      type: String,
      required: true,
      unique: true,
    },
    color: [
      {
        type: String,
        required: true,
      },
    ],
    size: [
      {
        type: String,
        required: true,
      },
    ],
    price: {
      type: Number,
      required: true,
      default: 1,
    },
    appliedDiscount: {
      type: Number,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 1,
    },
    createdBy: {
      type: Types.ObjectId,
      required: true,
      ref: "user",
    },
    updateBy: {
      type: Types.ObjectId,
      ref: "user",
    },
    Images: [
      {
        public_id: {
          required: true,
          type: String,
        },
        secure_url: {
          type: String,
        },
      },
    ],
    categoryId: {
      type: Types.ObjectId,
      ref: "category",
    },
  },
  { timestamps: true }
);

productSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    console.log(doc);
    setImmediate(async () => {
      try {
        await cardModel.updateMany(
          { "products.productId": doc._id },
          { $pull: { products: { productId: doc._id } } }
        );
      } catch (error) {
        console.error("Error updating cardModel:", error);
      }
    });
  }
});

const productModel = model("product", productSchema);

export default productModel;
