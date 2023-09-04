import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { createDocHandler } from "../controllers/doc.controller";
import { validate } from "../middleware/validate";
import { createDocSchema } from "../schema/doc.schema";

const router = express.Router();

router.use(deserializeUser, requireUser);


router.post('/',validate(createDocSchema), createDocHandler)

export default router;
