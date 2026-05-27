import client from "./client";
import type { StrategyConfig } from "../types";

export const generateStrategy = (description: string) =>
  client.post<{ strategy: StrategyConfig }>("/ai/generate-strategy", { description });
