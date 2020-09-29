import { Core } from "sc-game-base";

export default class BlackjackGameDefinition extends Core.GameDefinition {
    constructor({ id = 0, name = "", durations = {} }, roundRepository, betRepository, bot, actions, payouts) {
        super({ id, name, durations }, null, null, roundRepository, betRepository, null, bot);
        this.actions = actions;
        this.payouts = payouts;
    }
}
