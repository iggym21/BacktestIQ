import Editor from "@monaco-editor/react";
import { DEFAULT_CODE } from "./codeDefaults";

export { DEFAULT_CODE };

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
