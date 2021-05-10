import mongoose from "mongoose";

const modelName = "BlackJack_phien";

const Schema = new mongoose.Schema({
    result: { type: Array },
    id: { type: Number, required: true },
    settlementResult: { type: Number },
    roundStartTime: { type: Date },
    time: { type: Date },
    ended: { type: Boolean, default: false },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    odds: { type: Object },
});

const rounds = mongoose.model(modelName, Schema);

export { rounds as BlackJackRounds };
