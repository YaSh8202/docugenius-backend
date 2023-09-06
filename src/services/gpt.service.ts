import axios from "axios";
import path from "path";
import fs from "fs";
import FormData from "form-data";
import OpenAI from "openai";
import config from "config";

const openai = new OpenAI({
  apiKey: config.get<string>("openaiApiKey"),
});

const BACKEND_URL = "http://localhost:8000";
const DB_INTERFACE_BEARER_TOKEN = config.get<string>("dbInterfaceToken");

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    // "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${DB_INTERFACE_BEARER_TOKEN}`,
  },
});

export const downloadAndPostFile = async ({
  url: fileUrl,
  id: docId,
}: {
  url: string;
  id: string;
}) => {
  const response = await axios.get(fileUrl, {
    responseType: "arraybuffer",
  });
  const tempFilePath: string = path.join(__dirname, "temp.pdf");
  fs.writeFileSync(tempFilePath, response.data);
  const fileContent = fs.readFileSync(tempFilePath);
  const formData = new FormData();
  //   formData.append("file", new Blob([fileContent]), "temp.pdf");

  formData.append("file", fileContent, {
    filename: "temp.pdf",
    contentType: "application/pdf",
  });

  formData.append(
    "metadata",
    JSON.stringify({ source_id: docId, url: fileUrl })
  );

  try {
    const uploadResponse = await api.post("/upsert-file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("uploadResponse", uploadResponse.data);
    // console.log("File uploaded successfully.");
    return uploadResponse.data;
  } catch (error) {
    console.log(`Error: ${error} for uploading file.`);
    throw new Error("Error in uploading file");
  } finally {
    fs.unlinkSync(tempFilePath);
  }
};

export const queryDoc = async ({
  query,
  docId,
}: {
  query: string;
  docId: string;
}) => {
  // Query vector databases to retrieven chunk with user's input question

  const body = {
    queries: [
      {
        query: query,
        top_k: 3,
        filter: {
          source_id: docId,
        },
      },
    ],
  };

  try {
    const res = await api.post("/query", body, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (res.status === 200) {
      return res.data;
    }
  } catch (err) {
    console.log("Error in querying vector database", err);
    return null;
  }
};

const applyPromptTemplate = (question: string) => {
  return `By considering the following information, answer the question below and make sure to give response in markdown format.:
    Q: ${question}
    `;
};

export async function callChatgptApi(
  userQuestion: string,
  chunks: string[]
): Promise<any> {
  const messages = chunks.map(
    (chunk) =>
      ({
        role: "user",
        content: chunk,
      } satisfies {
        role: "user";
        content: string;
      })
  );

  const question = applyPromptTemplate(userQuestion);
  messages.push({ role: "user", content: question });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response;
}
