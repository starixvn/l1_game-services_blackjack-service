import { Table } from "sc-game-base";

import appConfigs from "./app-configs";
import BlackJackGameData from "./blackjack-game-data";
import BlackJackGameDefinition from "./blackjack-game-definition";
import SettleGameConsumer from "./consumers/settle-game-consumer";
import BlackJackBot from "./crons/blackjack-bot";
import BlackJackProcessBetQueue from "./crons/blackjack-process-bet-queue";
import GameCron from "./crons/game-cron";
import gameSettings from "./game-settings";
import { generateResult, settle } from "./helpers/dealer";
import { BlackJackBets } from "./models/blackjack-bets";
import { BlackJackRounds } from "./models/blackjack-rounds";
import RoundResultPublisher from "./publishers/round-result-publisher";
import Startup from "./startup";

export class BlackJackApp extends Table.TableGameApp {}

const run = async () => {
    const gameData = new BlackJackGameData();

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
    const settleGameConsumer = new SettleGameConsumer(definition, gameData, roundPublisher);

    const gameCron = new GameCron(definition, gameData, new BlackJackBot(gameSettings.name, gameData), settleGameConsumer);

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
