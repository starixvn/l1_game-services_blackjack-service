import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: { type: Number, default: 0 },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    phien: { type: Number, required: true },

    actions: { type: Object },
    cards: { type: Object },
    splitFrom: { type: Number, default: 0 },
    thanhtoan: { type: Boolean, default: false },
    bet: { type: Number, default: 0 },
    betwin: { type: Number, default: 0 },
    time: { type: Date },

    memberId: { type: Number },
    siteId: { type: String },
    freeBet: { type: Boolean, default: false },
});

const bets = mongoose.model("BlackJack_cuoc", schema);

export { bets as BlackJackBets };
