import { Core, Table } from "sc-game-base";
import * as Consumers from "./consumers";
import initDatabase from "./models";
import BlackJackSocketRouter from "./routers/blackjack-socket-router";
import HistoryQuery from "./query-apis/history-query";

export default class Startup extends Table.TableGameStartup {
    /**
     * @param {socketIo.Socket} socketClient
     */
    initSocketRouter(socketClient) {
        const router = new BlackJackSocketRouter(
            this.definition,
            this.gameData,
            null,
            null,
            new Consumers.InGameConsumer(this.definition, this.gameData),
            null,
            null,
            new HistoryQuery(this.definition),
            null,
            new Consumers.UserStandConsumer(this.definition, this.gameData),
            new Consumers.UserHitConsumer(this.definition, this.gameData),
            new Consumers.UserDoubleConsumer(this.definition, this.gameData),
            new Consumers.UserSplitConsumer(this.definition, this.gameData),
            new Consumers.UserDealConsumer(this.definition, this.gameData)
        );

        router.init(socketClient);
    }

    /**
     * @param {socketIo.Socket} socketClient
     */
    initAdminSocketRouter(socketClient) {
        const router = new Core.Routers.BaseAdminSocketRouter();
        router.init(this.definition, this.gameData, socketClient, this.appConfigs.adminSecretKey);
    }

    async configureServices(app) {
        super.configureServices(app);

        await initDatabase(this.appConfigs.database);
    }
}
