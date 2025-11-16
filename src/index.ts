import config from "config";
import app from "./app";
import connectDB from "./utils/connectDB";

const port = process.env.PORT || config.get("port");

app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
  connectDB();
});
