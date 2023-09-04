import { NextFunction, Request, Response } from "express";
import { CreateDocInput } from "../schema/doc.schema";
import { createDoc, findAllUserDocs } from "../services/doc.service";

export const createDocHandler = async (
  req: Request<{}, {}, CreateDocInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = res.locals.user._id;
    const { title, url } = req.body;
    const doc = await createDoc({ input: { title, url }, user_id });

    res.status(201).json({
      status: "success",
      data: {
        doc,
      },
    });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({
        status: "fail",
        message: "Doc with that URL already exists",
      });
    }
    next(err);
  }
};

export const getDocshandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user_id = res.locals.user._id;

  const docs = await findAllUserDocs(user_id);

  res.status(200).json({
    status: "success",
    data: {
      docs,
    },
  });
};
