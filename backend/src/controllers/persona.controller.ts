import type { Request, Response } from "express";
import { buildOpening, generateRandomPersona } from "../services/personaEngine.service";
import type { RandomPersonaResponseBody } from "../types/persona";

export function getRandomPersona(_req: Request, res: Response<RandomPersonaResponseBody>): void {
  const persona = generateRandomPersona();

  res.status(200).json({
    persona,
    opening: buildOpening(persona),
  });
}
