import { FilterQuery, QueryOptions } from "mongoose";
import docModel, { Doc } from "../models/doc.model";

export const createDoc = async ({
  input,
  user_id,
}: {
  input: Partial<Doc>;
  user_id: string;
}) => {
  return await docModel.create({
    ...input,
    user: user_id,
  });
};

export const findAllUserDocs = async (user_id: string) => {
  return await docModel.find({ user: user_id });
};

export const findOneAndDelete = async (
  query: FilterQuery<Doc>,
  options: QueryOptions = {}
) => {
  return await docModel.findOneAndDelete(query, options);
};
