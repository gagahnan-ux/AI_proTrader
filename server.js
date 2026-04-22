const express = require("express");
const app = express();

app.use(express.json());

// ===== STORAGE =====
let latestData = {};
let lastSignal = "BUY"; // default supaya tak stuck HOLD

// ===== RECEIVE DATA FROM MT5 =====
app.post("/data", (req, res) => {
    try {
        latestData = req.body;
        console.log("📩 DATA:", latestData);
        res.json({ status: "ok" });
    } catch (err) {
        console.log("❌ DATA ERROR:", err);
        res.status(500).send("error");
    }
});

// ===== AI SIGNAL =====
app.get("/signal", (req, res) => {
    try {
        let { rsi, emaFast, emaSlow, macd, atr } = latestData;

        // ===== NO DATA =====
        if (rsi === undefined) {
            return res.json({
                signal: lastSignal,
                confidence: 50,
                sl: 100,
                tp: 120,
                mode: "WAIT_DATA"
            });
        }

        let signal = "HOLD";
        let confidence = 0;

        // ===== TREND (DECLARE SEKALI SAHAJA) =====
        let trend = emaFast > emaSlow ? "UP" : "DOWN";

        // ===== AGGRESSIVE FORCE ENTRY =====
        if (trend === "UP") {
            signal = "BUY";
            confidence = 65;
        } else {
            signal = "SELL";
            confidence = 65;
        }

        // ===== BOOST =====
        if (Math.abs(macd) > 0.5) confidence += 10;
        if (atr > 2.0) confidence += 10;

        // ===== RSI FINE TUNE =====
        if (signal === "BUY" && rsi < 50) confidence += 5;
        if (signal === "SELL" && rsi > 50) confidence += 5;

        // ===== LIMIT =====
        if (confidence > 95) confidence = 95;

        // ===== SAVE LAST SIGNAL =====
        lastSignal = signal;

        // ===== DYNAMIC SL TP =====
        let sl = Math.max(80, atr * 40);
        let tp = Math.max(120, atr * 60);

        const result = {
            signal: signal,
            confidence: confidence,
            sl: Math.round(sl),
            tp: Math.round(tp),
            mode: "AGGRESSIVE_V2"
        };

        console.log("🚀 SIGNAL:", result);

        res.json(result);

    } catch (err) {
        console.log("❌ SIGNAL ERROR:", err);
        res.status(500).send("error");
    }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("🚀 AI SERVER RUNNING ON PORT", PORT);
});