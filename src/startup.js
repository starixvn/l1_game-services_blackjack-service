import { Core, Table } from "sc-game-base";
import UserDealConsumer from "./consumers/user-deal-consumer";
import UserDoubleConsumer from "./consumers/user-double-consumer";
import UserHitConsumer from "./consumers/user-hit-consumer";
import UserSplitConsumer from "./consumers/user-split-consumer";
import initDatabase from "./models";
import BlackJackSocketRouter from "./routers/blackjack-socket-router";

export default class Startup extends Table.TableGameStartup {
    /**
     * @param {express.Express} app
     */
    initHttpRouter(app) {
        new Table.Routers.HttpRouter(this.gameData).init(app, this.appConfigs);
    }

    /**
     * @param {socketIo.Socket} socketClient
     */
    initSocketRouter(socketClient) {
        const router = new BlackJackSocketRouter(
            this.definition,
            this.gameData,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new UserDealConsumer(),
            new UserHitConsumer(),
            new UserDoubleConsumer(),
            new UserSplitConsumer()
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
