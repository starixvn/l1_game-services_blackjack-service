import mongoose from "mongoose";
import autoIncrement from "mongoose-auto-increment-reworked";

const modelName = "BlackJack_phien";

const Schema = new mongoose.Schema({
    result: { type: Object },
    roundStartTime: { type: Date, default: new Date() },
    time: { type: Date, default: new Date() },
    ended: { type: Boolean, default: false },
});

Schema.plugin(autoIncrement.MongooseAutoIncrementID.plugin, { modelName, field: "id" });

export default mongoose.model(modelName, Schema);
