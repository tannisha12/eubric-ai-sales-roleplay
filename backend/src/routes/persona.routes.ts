import { Router } from "express";
import { getRandomPersona } from "../controllers/persona.controller";

export const personaRouter = Router();

personaRouter.get("/random", getRandomPersona);
