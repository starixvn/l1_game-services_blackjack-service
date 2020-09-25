import { Table } from "sc-game-base";

import appConfigs from "./app-configs";
import gameSettings from "./game-settings";
import { BlackJackBets } from "./models/blackjack-bets";
import { BlackJackRounds } from "./models/blackjack-rounds";
import Startup from "./startup";
import TableGameDefinition from "./table-game-definition";
import TableGameData from "./table-game-data";

export class BlackJackApp extends Table.TableGameApp {}

const run = async () => {
    const gameData = new TableGameData();

    const definition = new TableGameDefinition(
        gameSettings,
        BlackJackRounds,
        BlackJackBets,
        null //bots insert herre
    );

    const gameCron = new Table.TableGameCron(definition, gameData);
    const startup = new Startup(appConfigs, definition, gameData, gameCron);
    const app = new BlackJackApp(appConfigs, definition, gameData, startup);
    await app.run();
};

run();
