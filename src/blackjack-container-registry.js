import awilix from "awilix";
import { Table } from "sc-game-base";
import {
    InGameConsumer,
    OutGameConsumer,
    UserDealConsumer,
    UserDoubleConsumer,
    UserHitConsumer,
    UserSplitConsumer,
    UserStandConsumer,
} from "./consumers";
import SettleGameConsumer from "./consumers/settle-game-consumer";
import BlackJackProcessBetQueue from "./crons/blackjack-process-bet-queue";
import GameCron from "./crons/game-cron";

import { BlackJackBets } from "./models/blackjack-bets";
import { BlackJackRounds } from "./models/blackjack-rounds";
import RoundResultPublisher from "./publishers/round-result-publisher";
import HistoryQuery from "./query-apis/history-query";
import BlackJackSocketRouter from "./routers/blackjack-socket-router";

const { asClass, asValue } = awilix;

export default class BlackjackContainerRegistry extends Table.TableContainerRegistry {
    registerModels() {
        super.registerModels();

        this.container.register({
            roundsRepository: asValue(BlackJackRounds),
            betsRepository: asValue(BlackJackBets),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            settleGameRoundConsumer: asClass(SettleGameConsumer).singleton().proxy(),
            userStandConsumer: asClass(UserStandConsumer).singleton(),
            userHitConsumer: asClass(UserHitConsumer).singleton(),
            userDoubleConsumer: asClass(UserDoubleConsumer).singleton(),
            userSplitConsumer: asClass(UserSplitConsumer).singleton(),
            userDealConsumer: asClass(UserDealConsumer).singleton(),
            inGameConsumer: asClass(InGameConsumer).singleton(),
            userDisconnectConsumer: asClass(OutGameConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
        });
    }

    registerRouters() {
        super.registerRouters();

        this.container.register({
            socketRouter: asClass(BlackJackSocketRouter).proxy(),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            processBetQueue: asClass(BlackJackProcessBetQueue).singleton().proxy(),
            gameCron: asClass(GameCron).singleton().proxy(),
        });
    }

    registerApis() {
        super.registerApis();

        this.container.register({
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }
}
