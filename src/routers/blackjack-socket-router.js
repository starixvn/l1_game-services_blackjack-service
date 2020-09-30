import { Table } from "sc-game-base";
import { logger } from "sc-common";

import BlackJackGameData from "./../blackjack-game-data";
import TableGameDefinition from "./../blackjack-game-definition";

export default class BlackJackSocketRouter extends Table.Routers.SocketRouter {
    /**
     * @param {TableGameDefinition} definition
     * @param {BlackJackGameData} gameData
     */
    constructor(
        definition,
        gameData,
        userSignInConsumer = null,
        userDisconnectConsumer = null,
        inGameConsumer = null,
        placeBetConsumer = null,
        userSignInPublisher = null,
        historyQuery = null,
        roundQuery = null,
        userStandConsumer = null,
        userHitConsumer = null,
        userDoubleConsumer = null,
        userSplitConsumer = null,
        userDealConsumer = null
    ) {
        super(
            definition,
            gameData,
            userSignInConsumer,
            userDisconnectConsumer,
            inGameConsumer,
            placeBetConsumer,
            userSignInPublisher,
            historyQuery,
            roundQuery
        );

        this.inGameConsumer = inGameConsumer;
        this.userStandConsumer = userStandConsumer;
        this.userHitConsumer = userHitConsumer;
        this.userDoubleConsumer = userDoubleConsumer;
        this.userSplitConsumer = userSplitConsumer;
        this.userDealConsumer = userDealConsumer;
    }

    handlePlaceBet(payload) {
        try {
            if (!this.verify()) {
                return;
            }

            if (payload.deal) {
                this.userDealConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
                return;
            }

            if (payload.hit) {
                this.userHitConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
                return;
            }

            if (payload.stand) {
                this.userStandConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
                return;
            }
        } catch (error) {
            logger.logError(error);
        }
    }
}
