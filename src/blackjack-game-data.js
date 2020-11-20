import { Table } from "sc-game-base";

import gameSettings from "./game-settings";

export default class BlackJackGameData extends Table.TableGameData {
    constructor() {
        super(gameSettings.durations.wholeRound);
        this.betId = 0;
    }
}
