import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();

export async function connectToCluster(uri: string) {
  let mongoClient;

  try {
    mongoClient = new MongoClient(uri);
    console.log("Connecting to MongoDB Atlas cluster...");
    await mongoClient.connect();
    console.log("Successfully connected to MongoDB Atlas!");

    return mongoClient;
  } catch (error) {
    console.error("Connection to MongoDB Atlas failed!", error);
    process.exit();
  }
}

const port = 8000;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World! fasdfds");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  
});
