import { Pinecone } from "@pinecone-database/pinecone";

export const getPineconeClient = async () => {
  const pinecone = new Pinecone();

  return pinecone;
};
