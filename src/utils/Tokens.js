import jwt from "jsonwebtoken";
import TokenModel from "../../DB/models/Token.model.js";

export const storeRefreshToken = async (refreshToken, userId, next) => {
  try {
    let token = await TokenModel.findOne({ userId: userId });
    if (token) {
      token.refreshToken = refreshToken;
    } else {
      token = new TokenModel({
        userId: userId,
        refreshToken: refreshToken,
        isValid: true,
      });
    }
    const result = await token.save();
    if (!result) {
      throw new Error("Failed to store refresh token");
    }
    return true;
  } catch (error) {
    throw new Error("Failed to store refresh token");
  }
};

export const verifyToken = ({
  token,
  signature = process.env.DEFAULT_SIGNATURE,
} = {}) => {
  try {
    // check if the payload is empty object
    if (!token) {
      throw new Error("Error in verify Token Not found");
    }
    const data = jwt.verify(token, signature);
    if (!data) {
      throw new Error("Error in verify Token");
    }
    return data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const generateToken = async ({
  payload = {},
  signature = process.env.DEFAULT_SIGNATURE,
  expiresIn = "1d",
} = {}) => {
  try {
    // check if the payload is empty object
    if (!Object.keys(payload).length) {
      throw new Error("can't generate token without payload");
    }
    const token = jwt.sign(payload, signature, { expiresIn });
    if (!token) {
      throw new Error("Faild to geneerate token");
    }
    return token;
  } catch (error) {
    throw new Error("wtf is happended");
  }
};
