import client from "./client";
import type { SavedStrategy, StrategyConfig } from "../types";

export const listStrategies = () =>
  client.get<SavedStrategy[]>("/strategies/");

export const saveStrategy = (name: string, mode: string, config: StrategyConfig) =>
  client.post<SavedStrategy>("/strategies/", { name, mode, config });

export const getStrategy = (id: string) =>
  client.get<SavedStrategy>(`/strategies/${id}`);

export const deleteStrategy = (id: string) =>
  client.delete(`/strategies/${id}`);
