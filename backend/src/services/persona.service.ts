import fs from "node:fs";
import path from "node:path";
import type { PersonaConfig } from "../types/persona";

const DEFAULT_PERSONA_PATH = path.resolve(__dirname, "../../../prompts/personas/default.json");

export const DEFAULT_PERSONA: PersonaConfig = JSON.parse(
  fs.readFileSync(DEFAULT_PERSONA_PATH, "utf-8")
) as PersonaConfig;
