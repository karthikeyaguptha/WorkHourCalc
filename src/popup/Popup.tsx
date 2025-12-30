import React, { useEffect, useState } from "react";
import "./Popup.css";

/* ============================
   Helpers
============================ */

/** Safe HH:mm input with auto ":" */
function handleTimeChange(
  value: string,
  setValue: (v: string) => void
) {
  if (!/^[0-9:]*$/.test(value)) return;
  if ((value.match(/:/g) || []).length > 1) return;
  if (value.length === 2 && !value.includes(":")) {
    value = value + ":";
  }
  if (value.length > 5) return;
  setValue(value);
}

/** Normalize on blur */
function normalizeTime(value: string): string {
  if (!value) return "";
  const [h = "00", m = "00"] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padEnd(2, "0")}`;
}

/** Check future entry */
function isEntryInFuture(entry: string): boolean {
  const [h, m] = entry.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return false;
  const now = new Date();
  const entryDate = new Date();
  entryDate.setHours(h, m, 0, 0);
  return entryDate.getTime() > now.getTime();
}

/** Format duration ms → HH:mm:ss */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ============================
   Popup Component
============================ */

export default function Popup() {
  /* ---------- State ---------- */
  const [entryTime, setEntryTime] = useState("");
  const [requiredTime, setRequiredTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [worked, setWorked] = useState("");
  const [remaining, setRemaining] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [timestamps, setTimestamps] = useState<{
    entry: number;
    out: number;
  } | null>(null);

  /* Info / completion pill */
  const [infoMessage, setInfoMessage] = useState<string | null>(
    "⏱ Use 24-hour format (HH:mm)"
  );
  const [hasShownCompleted, setHasShownCompleted] = useState(false);

  /* ---------- Derived states ---------- */
  const now = Date.now();
  const isRunning = timestamps !== null && now < timestamps.out;
  const isCompleted = timestamps !== null && now >= timestamps.out;
  const isRequiredValid =
    requiredTime !== "" && requiredTime !== "00:00";

  /* ============================
     Timer effect
  ============================ */
  useEffect(() => {
    if (!timestamps) return;

    const totalDurationMs = timestamps.out - timestamps.entry;

    const interval = setInterval(() => {
      const now = Date.now();

      const elapsedMs = Math.min(
        Math.max(0, now - timestamps.entry),
        totalDurationMs
      );

      const remainingMs = Math.max(
        0,
        timestamps.out - now
      );

      setWorked(formatDuration(elapsedMs));
      setRemaining(formatDuration(remainingMs));

      // One-time completion trigger
      if (remainingMs === 0 && !hasShownCompleted) {
        setInfoMessage("🎉 Work Hours Completed");
        setHasShownCompleted(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamps, hasShownCompleted]);

  /* ============================
     Info message auto-hide
  ============================ */
  useEffect(() => {
    if (!infoMessage) return;

    const timer = setTimeout(() => {
      setInfoMessage(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, [infoMessage]);

  /* ============================
     Actions
  ============================ */

  function startTimer() {
    setError(null);

    if (!entryTime || !requiredTime) {
      setError("Please enter Entry and Required time");
      return;
    }

    if (isEntryInFuture(entryTime)) {
      setError("Entry time cannot be in the future");
      return;
    }

    const [eh, em] = entryTime.split(":").map(Number);
    const [rh, rm] = requiredTime.split(":").map(Number);

    const entryDate = new Date();
    entryDate.setHours(eh, em, 0, 0);

    const durationMs = (rh * 60 + rm) * 60 * 1000;
    const outTimestamp = entryDate.getTime() + durationMs;

    const outDate = new Date(outTimestamp);
    setOutTime(
      `${outDate.getHours().toString().padStart(2, "0")}:${outDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`
    );

    setTimestamps({
      entry: entryDate.getTime(),
      out: outTimestamp
    });
  }

  function reset() {
    setEntryTime("");
    setRequiredTime("");
    setOutTime("");
    setWorked("");
    setRemaining("");
    setTimestamps(null);
    setError(null);

    setInfoMessage("⏱ Use 24-hour format (HH:mm)");
    setHasShownCompleted(false);
  }

  /* ============================
     UI
  ============================ */

  return (
    <div className="container">
      <h3 className="title">Work Hours</h3>

      {infoMessage && (
        <div className="completed-banner">
          {infoMessage}
        </div>
      )}

      <div className="row">
        <div className="field">
          <label>Entry Time</label>
          <input
            type="text"
            placeholder="HH:mm"
            value={entryTime}
            onChange={(e) =>
              handleTimeChange(e.target.value, setEntryTime)
            }
            onBlur={() =>
              setEntryTime(normalizeTime(entryTime))
            }
          />
        </div>

        <div className="field">
          <label>Required Hours to Work</label>
          <input
            type="text"
            placeholder="HH:mm"
            value={requiredTime}
            onChange={(e) =>
              handleTimeChange(e.target.value, setRequiredTime)
            }
            onBlur={() =>
              setRequiredTime(normalizeTime(requiredTime))
            }
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <label>Out Time</label>
      <input value={outTime} disabled />

      <div className="timers">
        <span>
          <b>Worked:</b> {worked}
        </span>
        <span>
          <b>Remaining:</b> {remaining}
        </span>
      </div>

      <div className="button-row">
        <button
          onClick={startTimer}
          disabled={!isRequiredValid || isRunning || isCompleted}
        >
          {isRunning ? "Running…" : "Start"}
        </button>

        <button
          onClick={reset}
          disabled={!timestamps}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
