import mongoose from "mongoose";

const modelName = "BlackJack_cuoc";

const schema = new mongoose.Schema({
    id: { type: Number, default: 0 },
    pos: { type: Number, default: 0 },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    phien: { type: Number, default: 0 },

    actions: { type: Array, default: [] },
    cards: { type: Array, default: [] },
    total: { type: Number, default: 0 },
    softPoints: { type: Array, default: [] },
    splitFrom: { type: Number, default: null },
    thanhtoan: { type: Boolean, default: false },
    bet: { type: Number, default: 0 },
    betwin: { type: Number, default: 0 },
    time: { type: Date },

    memberId: { type: Number },
    siteId: { type: String },
    freeBet: { type: Boolean, default: false },

    currency: { type: String, required: false },
    partnerId: { type: String, required: false },
    rate: { type: Number, required: false },
});

const bets = mongoose.model(modelName, schema);

export { bets as BlackJackBets };
