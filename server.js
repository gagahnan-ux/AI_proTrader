const express = require("express");
const app = express();

app.use(express.json());

let latestData = {};
let lastSignal = "HOLD";

// ===== CONFIG =====
const MODE = "AGGRESSIVE_V2"; // SAFE / AGGRESSIVE_V2

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

// ===== AI SIGNAL ENGINE =====
app.get("/signal", (req, res) => {
    try {
        let { rsi, emaFast, emaSlow, macd, atr } = latestData;

        if (!rsi) {
            return res.json({
                signal: "HOLD",
                confidence: 0,
                sl: 100,
                tp: 100,
                mode: "WAIT_DATA"
            });
        }

        let signal = "HOLD";
        let confidence = 0;

        // ===== TREND =====
        let trend = emaFast > emaSlow ? "UP" : "DOWN";

        // ===== AGGRESSIVE V2 LOGIC =====
        if (MODE === "AGGRESSIVE_V2") {

            // BUY CONDITIONS (relax)
            if (
                rsi < 60 &&                // tak perlu oversold
                macd > -0.5 &&            // allow weak momentum
                trend === "UP"
            ) {
                signal = "BUY";
                confidence = 70;
            }

            // SELL CONDITIONS (relax)
            if (
                rsi > 40 &&
                macd < 0.5 &&
                trend === "DOWN"
            ) {
                signal = "SELL";
                confidence = 70;
            }

            // BOOST jika strong move
            if (Math.abs(macd) > 1.5) {
                confidence += 15;
            }

            if (atr > 2.0) {
                confidence += 10;
            }
        }

        // ===== ANTI HOLD SYSTEM =====
        if (signal === "HOLD") {
            // paksa trade kalau terlalu lama hold
            if (lastSignal === "BUY") signal = "BUY";
            else if (lastSignal === "SELL") signal = "SELL";
        }

        if (signal !== "HOLD") {
            lastSignal = signal;
        }

        // ===== DYNAMIC SL TP =====
        let sl = Math.max(80, atr * 40);
        let tp = Math.max(120, atr * 60);

        const result = {
            signal,
            confidence,
            sl: Math.round(sl),
            tp: Math.round(tp),
            mode: MODE
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