import monngoose from "mongoose";
const connectDB = async () => {
  console.log(process.env.DB_url);

  await monngoose
    .connect(process.env.DB_url)
    .then(() => {
      console.log("DB connected");
    })
    .catch((error) => {
      console.log("error in connection :(", error);
    });
};

export default connectDB;
