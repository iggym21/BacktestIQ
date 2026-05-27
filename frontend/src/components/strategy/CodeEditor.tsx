import Editor from "@monaco-editor/react";

const DEFAULT_CODE = `def generate_signals(df):
    """
    df: pandas DataFrame with columns: open, high, low, close, volume
    Returns: pandas Series with values 1 (buy), -1 (sell), 0 (hold)
    """
    import pandas as pd
    signals = pd.Series(0, index=df.index)

    # Example: 50/200 SMA crossover
    sma50 = df['close'].rolling(50).mean()
    sma200 = df['close'].rolling(200).mean()

    signals[sma50 > sma200] = 1
    signals[sma50 < sma200] = -1

    return signals
`;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeEditor({ value, onChange }: Props) {
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <Editor
        height="420px"
        defaultLanguage="python"
        theme="vs-dark"
        value={value || DEFAULT_CODE}
        onChange={(v) => onChange(v ?? "")}
        options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: "on", scrollBeyondLastLine: false }}
      />
    </div>
  );
}
