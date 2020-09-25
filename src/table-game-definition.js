import { Core } from "sc-game-base";

export default class TableGameDefinition extends Core.GameDefinition {
    constructor({ id = 0, name = "", durations = {} }, roundRepository, betRepository, bot) {
        super({ id, name, durations }, null, null, roundRepository, betRepository, null, bot);
    }
}
