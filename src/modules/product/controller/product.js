import slugify from "slugify";
import categoryModel from "../../../../DB/models/category.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import productModel from "../../../../DB/models/product.model.js";
import { customAlphabet } from "nanoid";
import { ApiFeature } from "../../../utils/apiFeature.js";
import {
  createImg,
  deleteImg,
  GetsingleImg,
  s3Client,
} from "../../../utils/aws.s3.js";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import { pagenation } from "../../../utils/pagination.js";
const nanoid = customAlphabet("abcdefghigklmnopqwert1234567890", 7);

export const createProduct = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.query;

  // Check if categoryId exist in DB
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next(new Error("Category not found", { cause: 404 }));
  }

  // Get user info
  const user = req.user;
  const createdBy = user._id;

  // Extract data from req.body
  const { title, desc, color, size, price, appliedDiscount, stock } = req.body;
  let priceAfterDiscount = price;
  if (appliedDiscount) {
    priceAfterDiscount = price - price * (appliedDiscount / 100);
  }
  const slug = slugify(title, "_");

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return next(new Error("Please upload pictures", { cause: 400 }));
  }
  const customId = `${slug}_${nanoid()}`;
  // Upload all images to AWS S3
  let Images = [];
  const folder = `${process.env.folder_name}/products/${customId}`;
  let uploadPromises = req.files.map(async (file) => {
    const { imgName: public_id } = await createImg({
      file,
      folder,
    });
    if (!public_id) {
      return next(new Error("Image not uploaded successfully", { cause: 500 }));
    }
    Images.push({ public_id });
    return public_id;
  });
  await Promise.all(uploadPromises);

  // Create product using uploaded images
  const product = {
    title,
    slug,
    desc,
    customId: customId,
    color,
    size,
    price,
    appliedDiscount,
    priceAfterDiscount,
    stock,
    createdBy,
    Images: Images,
    categoryId: category._id,
  };

  // Create product in DB
  const createdProduct = await productModel.create(product);

  // Return success response
  return res
    .status(200)
    .json({ message: "Done", success: true, result: createdProduct });
});

//update product
export const updateProduct = asyncHandler(async (req, res, next) => {
  // get all body data
  const { title, desc, size, color, appliedDiscount, price, stock } = req.body;
  const { categoryId } = req.body;
  //get productid , subcategory , category , brand
  const { productId } = req.query;
  // chk productid
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("product not found", { cause: 404 }));
  }
  // chk if i got category id in query
  if (categoryId && categoryId.toString() != product.categoryId.toString()) {
    //chk categoryId in DB
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return next(new Error("category not found", { cause: 404 }));
    }
    //edit product
    product.categoryId = category._id;
  }

  if (appliedDiscount && price) {
    product.priceAfterDiscount = price - price * ((appliedDiscount || 0) / 100);
    product.price = price;
    product.appliedDiscount = appliedDiscount;
  } else if (appliedDiscount) {
    product.priceAfterDiscount =
      product.price - product.price * ((appliedDiscount || 0) / 100);
    product.appliedDiscount = appliedDiscount;
  } else if (price) {
    product.priceAfterDiscount =
      price - price * ((product.appliedDiscount || 0) / 100);
    product.price = price;
  }

  if (title && title !== product.title) {
    product.title = title;
    const slug = slugify(title);
    product.slug = slug;
  }
  if (size) product.size = size;
  if (color) product.color = color;
  if (desc) product.desc = desc;
  if (stock) product.stock = stock;

  await product.save();
  return res.json({ message: "Done updated", success: true, result: product });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.query;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 400 }));
  }

  const folderPath = `${process.env.folder_name}/products/${product.customId}`;

  const objectsToDelete = [{ Key: folderPath }];

  product.Images.forEach((image) => {
    objectsToDelete.push({ Key: image.public_id });
  });

  const deleteParams = {
    Bucket: process.env.Bucket_name,
    Delete: {
      Objects: objectsToDelete,
      Quiet: false,
    },
  };

  const response = await s3Client.send(new DeleteObjectsCommand(deleteParams));
  if (![200, 201, 202, 204, 203].includes(response.$metadata.httpStatusCode)) {
    return next(new Error("Error: Images not deleted successfully"));
  }
  const InfoAfterDeleted = await product.deleteOne();
  return res.status(200).json({
    message: "Product folder and images deleted successfully",
    success: true,
    response: response,
    InfoAfterDeleted,
  });
});

export const addImgToproduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }
  if (!req.files || req.files.length == 0) {
    return next(new Error("please upload images", { cause: 400 }));
  }

  // Upload all images to AWS S3
  let Images = [];
  const folder = `${process.env.folder_name}/products/${product.customId}`;
  let uploadPromises = req.files.map(async (file) => {
    const { imgName: public_id } = await createImg({
      file,
      folder,
    });
    if (!public_id) {
      return next(new Error("Image not uploaded successfully", { cause: 500 }));
    }
    Images.push({ public_id });
    return public_id;
  });
  await Promise.all(uploadPromises);

  product.Images.push(...Images);
  const result = await product.save();
  return res
    .status(200)
    .json({ message: "done images uploaded successfully", result });
});

export const deleteImgfromProduct = asyncHandler(async (req, res, next) => {
  const { productId, ImgName } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  if (!product.Images.toString().includes(ImgName.toString())) {
    return next(new Error("Invaild ImgName", { cause: 400 }));
  }
  const { response } = await deleteImg({ imgName: ImgName });
  if (![200, 201, 202, 204, 203].includes(response.$metadata.httpStatusCode)) {
    return next(new Error("Error: Images not deleted successfully"));
  }

  return res
    .status(200)
    .json({ message: "Image Deleted successfully", response });
});

export const getProduct = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.query;
  const filters = {};

  if (categoryId) {
    if (!Types.ObjectId.isValid(categoryId)) {
      return next(new Error("invalid categoryId", { cause: 400 }));
    }
    filters.categoryId = categoryId;
  }

  const allowFields = [
    "title",
    "slug",
    "desc",
    "color",
    "size",
    "price",
    "priceAfterDiscount",
    "appliedDiscount",
    "stock",
    "Images",
    "categoryId",
  ];

  const optionsCategory = {
    path: "categoryId",
    select: "name slug Images createdBy",
  };

  const searchFieldsText = ["title", "desc", "slug"];
  const searchFieldsIds = ["categoryId", "_id", "categoryId._id"];
  const apiFeatureInstance = new ApiFeature(
    productModel.find(filters).lean(),
    req.query,
    allowFields
  )
    .pagination()
    .sort()
    .select()
    .filter()
    .search({ searchFieldsIds, searchFieldsText })
    .populate(optionsCategory);
  const products = await apiFeatureInstance.MongoseQuery;

  for (const product of products) {
    if (product.Images && product?.Images?.length > 0) {
      for (const Image of product.Images) {
        const { url } = await GetsingleImg({ ImgName: Image.public_id });
        Image.secure_url = url;
      }
    }
  }
  return res
    .status(200)
    .json({ message: "Done", success: true, result: products });
});

export const searchByCategoryId = asyncHandler(async (req, res, next) => {
  const { categoryId, page, size } = req.params;
  const { limit, skip } = pagenation({ size, page });

  const products = await productModel
    .find({ categoryId })
    .populate("categoryId")
    .limit(limit)
    .skip(skip);

  for (const product of products) {
    if (product.Images && product?.Images?.length > 0) {
      for (const Image of product.Images) {
        const { url } = await GetsingleImg({ ImgName: Image.public_id });
        Image.secure_url = url;
      }
    }
  }
  return res
    .status(200)
    .json({ message: "Done", success: true, result: products });
});

export const getsingleProduct = asyncHandler(async (req, res, next) => {
  // productId
  const { productId } = req.query;

  const product = await productModel.findById(productId).populate({
    path: "categoryId",
    select: "name slug Images createdBy",
  });

  if (!product) {
    return next(new Error("Product not found", { cause: 404 }));
  }

  const updatedImages = await Promise.all(
    product?.Images?.map(async (image) => {
      const { url } = await GetsingleImg({ ImgName: image.public_id });
      return { ...image.toObject(), secure_url: url };
    })
  );

  product.Images = updatedImages;

  return res.status(200).json({ message: "Done", product: product });
});
