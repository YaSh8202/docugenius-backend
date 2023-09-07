import { NextFunction, Request, Response } from "express";
import {
  CreateDocInput,
  GetDocSchemaType,
  QueryDocInput,
} from "../schema/doc.schema";
import {
  createDoc,
  findAllUserDocs,
  findDocById,
} from "../services/doc.service";
import {
  callChatgptApi,
  downloadAndPostFile,
  queryDoc,
} from "../services/gpt.service";

export const createDocHandler = async (
  req: Request<{}, {}, CreateDocInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = res.locals.user._id;
    const { title, url } = req.body;

    const doc = await createDoc({ input: { title, url }, user_id });
    const { fileSize, status } = await downloadAndPostFile({
      url,
      id: doc._id.toString(),
    });

    doc.size = fileSize;
    await doc.save();

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

export const getDochandler = async (
  req: Request<{ docId: string }>,
  res: Response,
  next: NextFunction
) => {
  const user_id = res.locals.user._id;
  const { docId } = req.params;

  if (!docId) {
    return res.status(400).json({
      status: "fail",
      message: "Doc ID is required",
    });
  }

  const doc = await findDocById(docId);

  if (!doc) {
    return res.status(404).json({
      status: "fail",
      message: "Doc not found",
    });
  }

  // if (doc.user.toString() !== user_id) {
  //   return res.status(401).json({
  //     status: "fail",
  //     message: "You are not authorized to view this doc",
  //   });
  // }

  res.status(200).json({
    status: "success",
    data: {
      doc,
    },
  });
};

export const queryDocHandler = async (
  req: Request<GetDocSchemaType, {}, QueryDocInput>,
  res: Response,
  next: NextFunction
) => {
  const docId = req.params.docId;
  const { query } = req.body;

  const chunks_response = await queryDoc({
    docId,
    query,
  });

  if (!chunks_response) {
    return res.status(500).json({
      status: "fail",
      message: "Error in querying vector database",
    });
  }

  try {
    const chunks: string[] = [];
    chunks_response.results.forEach((result: any) => {
      result.results.forEach((inner_result: any) => {
        chunks.push(inner_result.text);
      });
    });

    const gptResponse = await callChatgptApi(query, chunks);

    const data = gptResponse.choices[0].message;

    console.log("data", data);

    res.status(200).json({
      status: "success",
      data: {
        queryResult: data,
      },
    });
  } catch (err) {}
};
