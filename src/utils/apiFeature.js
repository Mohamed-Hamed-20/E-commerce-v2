import mongoose from "mongoose";
import { pagenation } from "./pagination.js";

export class ApiFeature {
  constructor(MongoseQuery, QueryData, allowFields) {
    this.MongoseQuery = MongoseQuery;
    this.QueryData = QueryData;
    this.allowFields = allowFields;
  }

  //pagination
  pagination() {
    const { page, size } = this.QueryData;
    const { limit, skip } = pagenation({ size, page });
    this.MongoseQuery.limit(limit).skip(skip);
    return this;
  }

  //sort
  sort() {
    const { sort } = this.QueryData;
    if (sort) {
      const sortFields = sort
        .split(",")
        .filter((field) => this.allowFields.includes(field));
      this.MongoseQuery.sort(sortFields.join(" "));
    }
    return this;
  }

  //select
  select() {
    const { select } = this.QueryData;
    if (select) {
      const selectedFields = select.split(",").filter((field) => {
        return this.allowFields.includes(field);
      });
      //for if not any field right
      selectedFields.length > 0
        ? this.MongoseQuery.select(selectedFields.join(" "))
        : this.MongoseQuery.select(this.allowFields.join(" "));
    } else {
      this.MongoseQuery.select(this.allowFields.join(" "));
    }
    return this;
  }

  populate(options) {
    this.MongoseQuery.populate({
      path: options.path,
      select: options.select,
      match: options?.match,
    });
    return this;
  }

  //search
  search({ searchFieldsText, searchFieldsIds }) {
    const { search } = this.QueryData;
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        const searchQuery = {
          $or: searchFieldsIds.map((field) => ({ [field]: search })),
        };
        this.MongoseQuery.find(searchQuery);
      } else {
        const searchQuery = {
          $or: searchFieldsText.map((field) => ({
            [field]: { $regex: new RegExp(search.trim(), "i") },
          })),
        };
        this.MongoseQuery.find(searchQuery);
      }
    }
    return this;
  }

  //filter
  filter() {
    const queryInstance = { ...this.QueryData };
    const exclude = ["page", "size", "sort", "select", "search", "populate"];
    const querystring = {};
    Object.keys(queryInstance).forEach((key) => {
      if (!exclude.includes(key)) {
        querystring[key] = queryInstance[key];
      }
    });
    const query = JSON.parse(
      JSON.stringify(querystring).replace(
        /gt|lt|gte|lte|regex|in|nin|neq|eq/g,
        (match) => `$${match}`
      )
    );
    this.MongoseQuery.find(query);
    return this;
  }
}
