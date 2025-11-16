import axios from "axios";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import OpenAI from "openai";
import config from "config";
import { getPineconeClient } from "../utils/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const openai = new OpenAI({
  apiKey: config.get<string>("openaiApiKey"),
  baseURL: config.get<string>("openaiApiBaseUrl") || undefined,
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
    const indexName = process.env.PINECONE_INDEX || "gpt-pdf-ai-index";
    const pineconeIndex = pinecone.Index(indexName);

    // Extract text content from documents
    const texts = pageLevelDocs.map((doc) => doc.pageContent);

    // Generate embeddings using Pinecone's inference API
    const model = "multilingual-e5-large";
    const embeddingsResponse = await pinecone.inference.embed(model, texts, {
      inputType: "passage",
      truncate: "END",
    });

    // Prepare vectors for upserting to Pinecone
    const vectors = pageLevelDocs.map((doc, i) => {
      const embedding = embeddingsResponse.data[i];
      // Handle both dense and sparse embeddings
      const values = "values" in embedding ? embedding.values : [];

      return {
        id: `${docId}-page-${i}`,
        values: values,
        metadata: {
          text: doc.pageContent,
          pageNumber: i + 1,
          docId: docId,
        },
      };
    });

    // Upsert vectors to Pinecone index
    await pineconeIndex.namespace(docId).upsert(vectors);

    return {
      fileSize: blob.size,
      status: "SUCCESS",
    };
  } catch (err) {
    console.log("🚀 ~ storeDocEmbeddings ~ err:", err);
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
  // Query vector databases to retrieve chunk with user's input question

  try {
    const pinecone = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || "gpt-pdf-ai-index";
    const pineconeIndex = pinecone.Index(indexName);

    // Generate query embedding using Pinecone's inference API
    const model = "multilingual-e5-large";
    const queryEmbedding = await pinecone.inference.embed(model, [message], {
      inputType: "query",
      truncate: "END",
    });

    // Extract the embedding values
    const embedding = queryEmbedding.data[0];
    const queryVector = "values" in embedding ? embedding.values : [];

    // Query the index
    const queryResponse = await pineconeIndex.namespace(docId).query({
      vector: queryVector,
      topK: 4,
      includeMetadata: true,
    });

    // Transform results to match expected format
    const results =
      queryResponse.matches?.map((match) => ({
        pageContent: (match.metadata?.text as string) || "",
        metadata: match.metadata || {},
      })) || [];

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
    model: "gpt-4.1-mini",
    max_tokens: 1024,
    temperature: 0.7,
    messages: messages,
  });

  return response;
}
