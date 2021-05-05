import { Table } from "sc-game-base";

export default class BlackJackGameData extends Table.TableGameData {
    constructor(remainingTime) {
        super(remainingTime);
        this.betId = 0;
    }
}
