import Editor from "@monaco-editor/react";
import { DEFAULT_CODE } from "./codeDefaults";
import { useTheme } from "../../context/ThemeContext";

export { DEFAULT_CODE };

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeEditor({ value, onChange }: Props) {
  const { theme } = useTheme();
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--line)" }}>
      <Editor
        height="420px"
        defaultLanguage="python"
        theme={theme === "dark" ? "vs-dark" : "light"}
        value={value || DEFAULT_CODE}
        onChange={(v) => onChange(v ?? "")}
        options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: "on", scrollBeyondLastLine: false, fontFamily: "JetBrains Mono, monospace" }}
      />
    </div>
  );
}
