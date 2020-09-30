import mongoose from "mongoose";
import autoIncrement from "mongoose-auto-increment-reworked";

const modelName = "BlackJack_phien";

const Schema = new mongoose.Schema({
    result: { type: Array },
    roundStartTime: { type: Date },
    time: { type: Date },
    ended: { type: Boolean, default: false },
});

Schema.plugin(autoIncrement.MongooseAutoIncrementID.plugin, { modelName, field: "id" });

const rounds = mongoose.model(modelName, Schema);

export { rounds as BlackJackRounds };
