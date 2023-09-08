require("dotenv").config();
import cookieParser from "cookie-parser";
import path from "path";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import config from "config";
import cors from "cors";
import connectDB from "./utils/connectDB";
import userRouter from "./routes/user.route";
import authRouter from "./routes/auth.route";
// import postRouter from "./routes/post.route";
import sessionRouter from "./routes/session.route";
import docRouter from "./routes/doc.route";

// import nodemailer from 'nodemailer';
// (async function () {
//   const credentials = await nodemailer.createTestAccount();
//   console.log(credentials);
// })();

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use("/api/static", express.static(path.join(__dirname, "../public")));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:1420"],
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "http://localhost:1420");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,UPDATE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  next();
});

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/docs", docRouter);

app.get(
  "/api/healthChecker",
  (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
      message: "Welcome to CodevoWeb😂😂👈👈",
    });
  }
);

// UnKnown Routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  err.status = err.status || "error";
  err.statusCode = err.statusCode || 500;

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

const port = process.env.PORT || config.get("port");
app.listen(port, () => {
  console.log(`Server started on port: ${port}`);
  connectDB();
});
