import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import {
  createDocHandler,
  getDochandler,
  getDocshandler,
  queryDocHandler,
} from "../controllers/doc.controller";
import { validate } from "../middleware/validate";
import { createDocSchema, queryDocSchema } from "../schema/doc.schema";

const router = express.Router();

router.use(deserializeUser, requireUser);

router.post("/", validate(createDocSchema), createDocHandler);

router.get("/", getDocshandler);

router.get("/:docId", getDochandler);

router.post("/:docId/query", validate(queryDocSchema), queryDocHandler);

export default router;
