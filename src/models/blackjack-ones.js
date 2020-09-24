import mongoose from "mongoose";

const schema = new mongoose.Schema({
    id: { type: Number, default: 0 },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    phien: { type: Number, required: true },

    thanhtoan: { type: Boolean, default: false },
    totalAmount: { type: Number, default: 0 },
    totalWin: { type: Number, default: 0 },
    time: { type: Date },

    memberId: { type: Number },
    siteId: { type: String },
    freeBet: { type: Boolean, default: false },
});

const ones = mongoose.model("BlackJack_one", schema);

export { ones as BlackJackOnes };
