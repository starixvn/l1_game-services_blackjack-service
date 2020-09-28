import { Table } from "sc-game-base";

export default class BlackJackGameData extends Table.TableGameData {
    constructor() {
        super(0, {});
        this.betId = 0;
    }
}
