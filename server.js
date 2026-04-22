const express = require("express");
const app = express();

app.use(express.json());

let latestData = null;

// ===== RECEIVE DATA =====
app.post("/data", (req, res) => {
  latestData = req.body;
  console.log("DATA:", latestData);
  res.json({ status: "ok" });
});

// ===== SMART MONEY AI =====
app.get("/signal", (req, res) => {
  if (!latestData) {
    return res.json({
      signal: "HOLD",
      confidence: 0,
      mode: "WAIT_DATA"
    });
  }

  const {
    emaFast,
    emaSlow,
    close,
    high,
    low,
    high_prev,
    low_prev,
    rsi,
    macd
  } = latestData;

  // ===== TREND =====
  let trend = emaFast > emaSlow ? "UP" : "DOWN";

  // ===== BASIC MOMENTUM =====
  let momentumBUY = (rsi > 50 && macd > 0);
  let momentumSELL = (rsi < 50 && macd < 0);

  // ===== BOS (relax sikit) =====
  let bosBUY = close > high_prev;
  let bosSELL = close < low_prev;

  // ===== FINAL DECISION =====
  let signal = "HOLD";
  let confidence = 0;

  // BUY CONDITION (AGGRESSIVE)
  if (trend === "UP" && (momentumBUY || bosBUY)) {
    signal = "BUY";
    confidence = 70;
  }

  // SELL CONDITION (AGGRESSIVE)
  if (trend === "DOWN" && (momentumSELL || bosSELL)) {
    signal = "SELL";
    confidence = 70;
  }

  res.json({
    signal,
    confidence,
    sl: 100,
    tp: 120,
    mode: "AGGRESSIVE_V2"
  });
});

// ===== RUN SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 SMART MONEY AI RUNNING ON PORT", PORT);
});