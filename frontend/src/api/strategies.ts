import client from "./client";
import type { SavedStrategy, StrategyConfig, StrategyVersion } from "../types";

export const listStrategies = () =>
  client.get<SavedStrategy[]>("/strategies/");

export const saveStrategy = (name: string, mode: string, config: StrategyConfig) =>
  client.post<SavedStrategy>("/strategies/", { name, mode, config });

export const getStrategy = (id: string) =>
  client.get<SavedStrategy>(`/strategies/${id}`);

export const updateStrategy = (id: string, name: string, mode: string, config: StrategyConfig) =>
  client.put<SavedStrategy>(`/strategies/${id}`, { name, mode, config });

export const listStrategyVersions = (id: string) =>
  client.get<StrategyVersion[]>(`/strategies/${id}/versions`);

export const deleteStrategy = (id: string) =>
  client.delete(`/strategies/${id}`);
