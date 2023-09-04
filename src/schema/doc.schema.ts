import { TypeOf, object, string } from "zod";

export const createDocSchema = object({
  body: object({
    title: string({
      required_error: "Title is required",
    }),
    url: string({
      required_error: "URL is required",
    }).url({
      message: "Please enter a valid URL",
    }),
  }),
});

const params = {
  params: object({
    docId: string({
      required_error: "Doc ID is required",
    }),
  }),
};


export const deleteDocSchema = object({
    ...params,
});

export const getDocSchema = object({
    ...params,
});

export type GetDocSchemaType = TypeOf<typeof getDocSchema>["params"];
export type DeleteDocSchemaType = TypeOf<typeof deleteDocSchema>["params"];
export type CreateDocInput = TypeOf<typeof createDocSchema>["body"];