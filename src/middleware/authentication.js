import { generateToken, verifyToken } from "../utils/Tokens.js";
import { asyncHandler } from "../utils/errorHandling.js";
import { usermodel } from "../../DB/models/user.model.js";
import TokenModel from "../../DB/models/Token.model.js";

export const isAuth = (roles) => {
  return asyncHandler(async (req, res, next) => {
    const accessToken = req.headers.authorization;
    const refreshToken = req.headers["refresh-token"];
    //check token send
    if (!accessToken || !refreshToken) {
      return next(
        new Error("Please login first OR refreshToken accessToken Not found ", {
          cause: 400,
        })
      );
    }

    //check token startwith
    if (!accessToken.startsWith(process.env.ACCESS_TOKEN_startwith)) {
      return next(new Error("invalid token prefix", { cause: 400 }));
    }

    //split Token
    const splitedToken = accessToken.split(
      process.env.ACCESS_TOKEN_startwith
    )[1];
    try {
      const decode = verifyToken({
        token: splitedToken,
        signature: process.env.ACCESS_TOKEN_SECRET,
      });
      if (!decode.userId || !decode.role || !decode.IpAddress) {
        return next(new Error("Invalid Token Payload", { cause: 400 }));
      }

      // if (decode.IpAddress != req.ip) {
      //   console.log({ My_IP: req.ip, IpAddress: decode.IpAddress });
      //   return next(
      //     new Error("Invalid Ip Address Login Again", { cause: 401 })
      //   );
      // }
      //if user search in usermodel if admin or instructor search in admin model

      const user = await usermodel.findById({ _id: decode.userId });
      if (!user) {
        return next(new Error("please Signup", { cause: 400 }));
      }

      // chk authorized
      if (!roles.includes(user.role)) {
        return next(new Error("Unauthorized user", { cause: 401 }));
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.message.includes("jwt expired")) {
        // verify refresh token
        const verifyreftoken = verifyToken({
          token: refreshToken,
          signature: process.env.REFRESH_TOKEN_SECRET,
        });
        if (!verifyreftoken || verifyreftoken?.IpAddress != req.ip) {
          return next(
            new Error("Invalid refresh Token or IP ", { cause: 400 })
          );
        }
        // token  => search in db
        const reftoken = await TokenModel.findOne({
          refreshToken: refreshToken,
          isvalid: true,
          userId: verifyreftoken.userId,
        });
        if (!reftoken) {
          return next(new Error("Wrong token or Not Valid", { cause: 400 }));
        }

        // generate new token

        const newaccessToken = await generateToken({
          payload: {
            userId: reftoken.userId,
            role: verifyreftoken.role,
            IpAddress: req.ip,
          },
          signature: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: process.env.accessExpireIn,
        });
        if (!newaccessToken) {
          return next(
            new Error("token generation fail, payload canot be empty", {
              cause: 400,
            })
          );
        }

        return res.status(200).json({
          message: "Token refreshed",
          accessToken: newaccessToken,
          refreshToken: refreshToken,
        });
      } else {
        throw new Error(error);
        // return next(new Error("invalid token", { cause: 500 }));
      }
    }
  });
};

export const roles = {
  super: "superAdmin",
  user: "user",
  admin: "admin",
};
