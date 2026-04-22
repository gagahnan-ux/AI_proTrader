const express = require("express");
const app = express();

app.use(express.json());

let lastSignal = {
  signal: "HOLD",
  confidence: 0,
  sl: 80,
  tp: 120,
  mode: "AGGRESSIVE"
};

// ================= AI AGGRESSIVE =================
function analyze(d) {
  const { rsi, emaFast, emaSlow, macd, atr } = d;

  let signal = "HOLD";
  let confidence = 0;

  const trendUp = emaFast > emaSlow;
  const trendDown = emaFast < emaSlow;

  // ================= MAIN ENTRY =================
  if (trendUp && rsi > 50) {
    signal = "BUY";
    confidence = 60 + (macd * 10);
  }

  if (trendDown && rsi < 50) {
    signal = "SELL";
    confidence = 60 + (Math.abs(macd) * 10);
  }

  // ================= EXTRA ENTRY =================
  if (rsi > 65) {
    signal = "BUY";
    confidence = 70;
  }

  if (rsi < 35) {
    signal = "SELL";
    confidence = 70;
  }

  // ================= ANTI HOLD =================
  if (signal === "HOLD") {
    if (macd > 0) signal = "BUY";
    if (macd < 0) signal = "SELL";
    confidence = 55;
  }

  // ================= SL TP =================
  const sl = Math.max(60, Math.round(atr * 1.0));
  const tp = Math.max(100, Math.round(atr * 2.0));

  return {
    signal,
    confidence: Math.min(95, Math.round(confidence)),
    sl,
    tp,
    mode: "AGGRESSIVE_V2"
  };
}

// ================= ROUTES =================
app.post("/data", (req, res) => {
  lastSignal = analyze(req.body);
  res.json({ status: "ok" });
});

app.get("/signal", (req, res) => {
  res.json(lastSignal);
});

app.listen(process.env.PORT || 10000, () =>
  console.log("🚀 AGGRESSIVE AI RUNNING")
);