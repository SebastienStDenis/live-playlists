"""Warn about credentials in .github/secret-expiry.json that are near expiry.

Emits `alert`, `title` and `body-file` to $GITHUB_OUTPUT for the calling workflow.
"""

import json
import os
import sys
import tempfile
from datetime import date
from pathlib import Path

MANIFEST = Path(__file__).resolve().parents[1] / "secret-expiry.json"
BODY_FILE = Path(os.environ.get("RUNNER_TEMP", tempfile.gettempdir())) / "secret-expiry-body.md"


def load_manifest():
    manifest = json.loads(MANIFEST.read_text())
    return (
        manifest["secrets"],
        manifest.get("thresholdDays", 30),
        manifest.get("urgentDays", 7),
    )


def days_left(secret, today):
    if secret.get("expires") is None:
        return None
    return (date.fromisoformat(secret["expires"]) - today).days


def render(rows, today):
    lines = [
        "Credentials below are unknown or within their warning window. "
        "Rotating one means updating its `expires` in `.github/secret-expiry.json` "
        "in the same pull request, or this issue will keep firing.",
        "",
        "| Secret | Service | Expires | Days left |",
        "| --- | --- | --- | --- |",
    ]
    for secret, remaining in rows:
        expires = secret.get("expires") or "**unknown**"
        left = "**unknown**" if remaining is None else str(remaining)
        lines.append(f"| `{secret['name']}` | {secret['service']} | {expires} | {left} |")
    for secret, remaining in rows:
        lines += ["", f"### {secret['name']}"]
        if remaining is None and secret.get("unknownReason"):
            lines.append(secret["unknownReason"])
        lines.append(secret["rotate"])
    lines += ["", f"<sub>Checked {today.isoformat()}.</sub>"]
    return "\n".join(lines)


def title_for(rows, urgent_days):
    urgent = [r for _, r in rows if r is None or r <= urgent_days]
    prefix = "Rotate now" if urgent else "Rotate soon"
    names = ", ".join(secret["name"] for secret, _ in rows)
    return f"{prefix}: {names}"


def emit(**outputs):
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        for key, value in outputs.items():
            print(f"{key}={value}", file=sys.stderr)
        return
    with open(path, "a") as handle:
        for key, value in outputs.items():
            handle.write(f"{key}={value}\n")


def main():
    secrets, threshold_days, urgent_days = load_manifest()
    today = date.today()

    rows = [(secret, days_left(secret, today)) for secret in secrets]
    flagged = [
        (secret, remaining)
        for secret, remaining in rows
        if remaining is None or remaining <= threshold_days
    ]
    flagged.sort(key=lambda row: (row[1] is not None, row[1]))

    if not flagged:
        soonest = min(remaining for _, remaining in rows)
        print(f"Nothing within {threshold_days} days (soonest: {soonest}).")
        emit(alert="false")
        return

    BODY_FILE.write_text(render(flagged, today))
    print(render(flagged, today))
    emit(alert="true", title=title_for(flagged, urgent_days), body_file=str(BODY_FILE))


if __name__ == "__main__":
    main()
