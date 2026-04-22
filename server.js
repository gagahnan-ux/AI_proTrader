const express = require("express");
const app = express();

app.get("/signal", (req, res) => {

    // TEST MODE (CONFIRM TRADE)
    const rand = Math.random();

    let signal = "HOLD";
    let confidence = 50;

    if (rand > 0.5) signal = "BUY";
    else signal = "SELL";

    res.json({
        signal: signal,
        confidence: confidence,
        sl: 100,
        tp: 120,
        mode: "LIVE"
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 AI SERVER RUNNING ON PORT " + PORT));