import axios from "axios";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import OpenAI from "openai";
import config from "config";
import { getPineconeClient } from "../utils/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const openai = new OpenAI({
  apiKey: config.get<string>("openaiApiKey"),
});

const BACKEND_URL = "https://docugenius-gpt.onrender.com";
const DB_INTERFACE_BEARER_TOKEN = config.get<string>("dbInterfaceToken");

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    // "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${DB_INTERFACE_BEARER_TOKEN}`,
  },
});

export const storeDocEmbeddings = async ({
  fileUrl,
  docId,
}: {
  fileUrl: string;
  docId: string;
}) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const loader = new PDFLoader(blob);
    const pageLevelDocs = await loader.load();

    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("gpt-pdf-ai");
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });

    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      namespace: docId,
    });

    return {
      fileSize: blob.size,
      status: "SUCCESS",
    };
  } catch (err) {
    return {
      status: "ERROR",
      fileSize: 0,
    };
  }
};

export const queryDoc = async ({
  query: message,
  docId,
}: {
  query: string;
  docId: string;
}) => {
  // Query vector databases to retrieven chunk with user's input question

  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("gpt-pdf-ai");

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: docId,
    });

    const results = await vectorStore.similaritySearch(message, 4);


    return results;
  } catch (err) {
    console.log("Error in querying vector database", err);
    return null;
  }
};

const applyPromptTemplate = (question: string, context: string) => {
  return `Use the following pieces of context (delimtited in triple quotes) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.

  CONTEXT: """
  ${context}
  """

  Q: """
  ${question}
  """
    `;
};

export async function callChatgptApi(
  userQuestion: string,
  context: string
): Promise<any> {
  const question = applyPromptTemplate(userQuestion, context);

  const messages: {
    role: "user" | "system";
    content: string;
  }[] = [{ role: "user", content: question }];

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 1024,
    temperature: 0.7,
    messages: messages,
  });

  return response;
}
