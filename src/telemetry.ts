export type TelemetryEvent = {
  name: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type TelemetrySink = (event: TelemetryEvent) => void;

let sink: TelemetrySink = (event) => {
  // Default sink: stdout JSON line
  console.log(JSON.stringify({ type: "telemetry", ...event }));
};

export const setTelemetrySink = (next: TelemetrySink) => {
  sink = next;
};

export const track = (name: string, payload?: Record<string, unknown>) => {
  try {
    sink({
      name,
      timestamp: new Date().toISOString(),
      payload
    });
  } catch {
    // best-effort
  }
};
