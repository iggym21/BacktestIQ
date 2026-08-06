import os


def _ensure_macos_library_path() -> None:
    """WeasyPrint needs pango/cairo/gobject on the dyld search path. Setting
    DYLD_FALLBACK_LIBRARY_PATH in the shell before launching the server does
    NOT work when Python runs via the code-signed, hardened-runtime
    Python.app launcher (the python.org macOS installer) — dyld strips all
    DYLD_* variables on exec for hardened binaries, no matter how they were
    set beforehand. Setting it on os.environ from *inside* the running
    process, before WeasyPrint's first dlopen() call, works because dyld
    re-reads the live environment on each fallback lookup.
    """
    import sys

    if sys.platform != "darwin" or os.environ.get("DYLD_FALLBACK_LIBRARY_PATH"):
        return
    for candidate in ("/opt/homebrew/lib", "/usr/local/lib"):
        if os.path.isdir(candidate):
            os.environ["DYLD_FALLBACK_LIBRARY_PATH"] = candidate
            return


def generate_tearsheet(
    metrics: dict,
    equity_curve: list,
    trades: list,
    ticker: str,
    start_date: str,
    end_date: str,
) -> bytes:
    _ensure_macos_library_path()
    try:
        from weasyprint import HTML
    except OSError as e:
        raise RuntimeError(
            "WeasyPrint system libraries missing. On macOS: brew install pango cairo libffi. "
            "On Linux: install libpango-1.0-0, libpangoft2-1.0-0, and libcairo2."
        ) from e

    metrics_rows = "".join(
        f"<tr><td>{k.replace('_', ' ').title()}</td><td>{v}</td></tr>"
        for k, v in metrics.items()
    )
    trades_rows = "".join(
        f"<tr><td>{t['date']}</td><td>{t['type'].upper()}</td>"
        f"<td>${t['price']:.2f}</td><td>{t['shares']:.2f}</td>"
        f"<td class='{'pos' if t['pnl'] >= 0 else 'neg'}'>${t['pnl']:.2f}</td></tr>"
        for t in trades[:50]
    )
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; color: #1a1a2e; margin: 40px; }}
  h1 {{ color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }}
  h2 {{ color: #374151; margin-top: 24px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  th {{ background: #4f46e5; color: white; padding: 8px; text-align: left; }}
  td {{ padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }}
  tr:nth-child(even) {{ background: #f9fafb; }}
  .pos {{ color: #059669; }} .neg {{ color: #dc2626; }}
  .header {{ display: flex; justify-content: space-between; margin-bottom: 24px; }}
  .badge {{ background: #ede9fe; color: #4f46e5; padding: 4px 12px; border-radius: 9999px; font-size: 12px; }}
</style></head>
<body>
  <div class="header">
    <div><h1>BacktestIQ Tearsheet</h1>
    <p><strong>{ticker}</strong> &nbsp; {start_date} – {end_date}</p></div>
    <span class="badge">MVP</span>
  </div>
  <h2>Performance Metrics</h2>
  <table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
  <tbody>{metrics_rows}</tbody></table>
  <h2>Trade Log (first 50)</h2>
  <table><thead><tr><th>Date</th><th>Type</th><th>Price</th><th>Shares</th><th>P&amp;L</th></tr></thead>
  <tbody>{trades_rows}</tbody></table>
</body></html>"""
    return HTML(string=html).write_pdf()
