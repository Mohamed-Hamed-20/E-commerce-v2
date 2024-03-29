import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    isvalid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const TokenModel = mongoose.model("Token", tokenSchema);

export default TokenModel;
