import React, { useEffect, useState } from "react";
import { parseHHMM, formatHHMM, formatDuration } from "../utils/time";
import { saveData, loadData } from "../utils/storage";
import { WorkHistory } from "../types/history";
import "./Popup.css";

interface StoredState {
  entryTimestamp: number;
  outTimestamp: number;
  entryTime: string;
  requiredTime: string;
  history: WorkHistory[];
}

export default function Popup() {
  const [entryTime, setEntryTime] = useState("");
  const [requiredTime, setRequiredTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [countUp, setCountUp] = useState("");
  const [countDown, setCountDown] = useState("");
  const [history, setHistory] = useState<WorkHistory[]>([]);
  const [timestamps, setTimestamps] = useState<{
    entry: number;
    out: number;
  } | null>(null);

  useEffect(() => {
    loadData<StoredState>().then((data) => {
      if (!data) return;
      setEntryTime(data.entryTime);
      setRequiredTime(data.requiredTime);
      setHistory(data.history || []);
      setTimestamps({
        entry: data.entryTimestamp,
        out: data.outTimestamp
      });
      setOutTime(
        formatHHMM(
          parseHHMM(data.entryTime) + parseHHMM(data.requiredTime)
        )
      );
    });
  }, []);

  useEffect(() => {
    if (!timestamps) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCountUp(formatDuration(now - timestamps.entry));
      setCountDown(formatDuration(timestamps.out - now));
    }, 1000);

    return () => clearInterval(interval);
  }, [timestamps]);

  function startTimer() {
    if (!entryTime || !requiredTime) return alert("Invalid input");

    const now = new Date();
    const [eh, em] = entryTime.split(":").map(Number);
    const entry = new Date(now);
    entry.setHours(eh, em, 0, 0);

    const durationMs = parseHHMM(requiredTime) * 60 * 1000;
    const out = entry.getTime() + durationMs;

    setOutTime(
      formatHHMM(parseHHMM(entryTime) + parseHHMM(requiredTime))
    );

    const state: StoredState = {
      entryTimestamp: entry.getTime(),
      outTimestamp: out,
      entryTime,
      requiredTime,
      history
    };

    setTimestamps({ entry: entry.getTime(), out });
    saveData(state);
  }

  function reset() {
    saveData(null);
    setTimestamps(null);
    setCountUp("");
    setCountDown("");
  }

  return (
    <div className="container">
      <h3 className="title">Work Hours</h3>

<div className="row">
  <div className="field">
    <label>Entry</label>
    <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
  </div>

  <div className="field">
    <label>Required</label>
    <input type="time" value={requiredTime} onChange={(e) => setRequiredTime(e.target.value)} />
  </div>
</div>


      <label>Out Time</label>
      <input value={outTime} disabled />

     <div className="timers">
  <span><b>Worked:</b> {countUp}</span>
  <span><b>Remaining:</b> {countDown}</span>
</div>

<div className="button-row">
  <button onClick={startTimer}>Start</button>
  <button onClick={reset}>Reset</button>
</div>

      {/* <h4>History</h4>
      {history.map((h, i) => (
        <div key={i} className="history">
          {h.date} | {h.entryTime} → {h.outTime}
        </div>
      ))} */}
    </div>
  );
}
