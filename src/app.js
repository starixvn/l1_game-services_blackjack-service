import { Table } from "sc-game-base";

import appConfigs from "./app-configs";
import constants from "./constants";
import SedieBot from "./crons/sedie-bot";
import gameSettings from "./game-settings";
import { generateResult, getSettlementResult } from "./helpers/result-helper";
import { SedieBets, SedieTmpBets } from "./models/sedie-bets";
import SedieRounds from "./models/sedie-rounds";
import Startup from "./startup";

export class SedieApp extends Table.TableGameApp {}

const run = async () => {
    const gameData = new Table.TableGameData(gameSettings.durations.wholeRound, constants.resetTotalBets);

    const definition = new Table.TableGameDefinition(
        gameSettings,
        generateResult,
        getSettlementResult,
        SedieRounds,
        SedieBets,
        SedieTmpBets,
        null,
        new SedieBot(
            gameSettings.name,
            gameSettings.choices,
            gameSettings.durations,
            gameSettings.name.toLowerCase(),
            SedieTmpBets,
            gameData
        )
    );

    const gameCron = new Table.TableGameCron(definition, gameData);
    const startup = new Startup(appConfigs, definition, gameData, gameCron);
    const app = new SedieApp(appConfigs, definition, gameData, startup);
    await app.run();
};

run();
