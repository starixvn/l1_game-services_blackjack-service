import { logger } from "sc-common";
import { Table } from "sc-game-base";

import TableGameData from "./../table-game-data";
import TableGameDefinition from "./table-game-definition";

export default class BlackJackSocketRouter extends Table.TableSocketRouter {
    /**
     * @param {TableGameDefinition} definition
     * @param {TableGameData} gameData
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
        userSplitConsumer = null
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
        //TODO add hit, stand consumers
    }
}
