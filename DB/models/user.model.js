import mongoose, { Schema, model } from "mongoose";
import cardModel from "./card.model.js";
import orderModel from "./order.model.js";
import couponModel from "./coupon.model.js";

const userSchema = new Schema(
  {
    firstName: { type: String, lowercase: true },
    lastName: { type: String, lowercase: true },
    userName: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 22,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: [
      {
        type: String,
        required: true,
      },
    ],
    phone: { type: String },

    profilePIC: {
      public_id: {
        type: String,
        default: "depositphotos_29387653-stock-photo-facebook-profile_npymre",
      },
      secure_url: {
        type: String,
        default:
          "https://res.cloudinary.com/dxjng5bfy/image/upload/v1692289127/Ecommerce/depositphotos_29387653-stock-photo-facebook-profile_npymre.jpg",
      },
    },

    coverImges: [
      {
        public_id: { type: String, required: true },
        secure_url: { type: String, required: true },
      },
    ],
    gender: {
      type: String,
      lowercase: true,
      enum: ["male", "female"],
      default: "male",
    },
    status: {
      type: String,
      default: "offline",
      enum: ["online", "offline"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    isconfrimed: {
      type: Boolean,
      default: false,
    },
    forgetCode: {
      type: String,
    },
    activationCode: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.post("findOneAndDelete", async (doc) => {
  try {
    if (doc) {
      const userId = doc?._id;
      const cardpromise = cardModel.findOneAndDelete({ userId: userId }).lean();
      const orderspromise = orderModel.deleteMany({ userId: userId }).lean();
      const updatecouponspromise = couponModel
        .updateMany(
          {
            "couponAssginedToUsers.userId": userId,
          },
          { $pull: { couponAssginedToUsers: { userId: userId } } }
        )
        .lean();

      const [card, orders, updatecoupons] = await Promise.all([
        cardpromise,
        orderspromise,
        updatecouponspromise,
      ]);
    }
  } catch (error) {
    throw new Error(error.message);
  }
});

export const usermodel = mongoose.models.usermodel || model("user", userSchema);
