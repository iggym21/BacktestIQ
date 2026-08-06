import client from "./client";
import type {
  BacktestResult, BacktestRequest, CompareRequest, CompareResult,
  SweepRequest, SweepResult, WalkForwardRequest, WalkForwardResult,
} from "../types";

export const runBacktest = (req: BacktestRequest) =>
  client.post<BacktestResult>("/backtest/run", req);

export const compareBacktest = (req: CompareRequest) =>
  client.post<CompareResult>("/backtest/compare", req);

export const sweepBacktest = (req: SweepRequest) =>
  client.post<SweepResult>("/backtest/sweep", req);

export const walkForwardBacktest = (req: WalkForwardRequest) =>
  client.post<WalkForwardResult>("/backtest/walkforward", req);

export const exportTearsheet = async (
  data: BacktestResult & { ticker: string; start_date: string; end_date: string }
) => {
  const resp = await client.post("/export/tearsheet", data, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `tearsheet_${data.ticker}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
