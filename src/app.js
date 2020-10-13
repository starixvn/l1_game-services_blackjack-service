import { Table } from "sc-game-base";

import appConfigs from "./app-configs";
import gameSettings from "./game-settings";
import { BlackJackBets } from "./models/blackjack-bets";
import { BlackJackRounds } from "./models/blackjack-rounds";
import Startup from "./startup";
import BlackJackGameDefinition from "./blackjack-game-definition";
import TableGameData from "./blackjack-game-data";
import GameCron from "./crons/game-cron";
import BlackJackBot from "./crons/blackjack-bot";
import BlackJackProcessBetQueue from "./crons/process-bet-queue";
import { generateResult, settle } from "./helpers/dealer";
import SettleGameConsumer from "./consumers/settle-game-consumer";
import RoundResultPublisher from "./publishers/round-result-publisher";

export class BlackJackApp extends Table.TableGameApp {}

const run = async () => {
    const gameData = new TableGameData();

    const definition = new BlackJackGameDefinition(
        gameSettings,
        generateResult,
        settle,
        BlackJackRounds,
        BlackJackBets,
        gameSettings.actions,
        gameSettings.payouts
    );

    const roundPublisher = new RoundResultPublisher(gameSettings.name, gameData);
    const settleGameConsumer = new SettleGameConsumer(definition, gameData, appConfigs.mainServerApiSettings, roundPublisher);

    const gameCron = new GameCron(
        definition,
        gameData,
        appConfigs.mainServerApiSettings,
        new BlackJackBot(gameSettings.name, gameData),
        settleGameConsumer
    );

    const startup = new Startup(
        appConfigs,
        definition,
        gameData,
        gameCron,
        new BlackJackProcessBetQueue(definition, gameData, settleGameConsumer)
    );
    const app = new BlackJackApp(appConfigs, definition, gameData, startup);
    await app.run();
};

run();
