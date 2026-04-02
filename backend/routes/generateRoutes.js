import { Router } from "express";
import {
  generatePreview,
  generatePdfBook,
  downloadFile
} from "../controllers/generateController.js";

const router = Router();

router.post("/generate/preview", generatePreview);
router.post("/generate", generatePdfBook);
router.get("/downloads/:fileName", downloadFile);

export default router;
