import { Core, Table } from "sc-game-base";
import { UserHitConsumer, UserStandConsumer, UserDoubleConsumer, UserSplitConsumer, UserDealConsumer } from "./consumers";
import initDatabase from "./models";
import BlackJackSocketRouter from "./routers/blackjack-socket-router";

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
            null,
            null,
            null,
            null,
            null,
            new UserStandConsumer(this.definition, this.gameData),
            new UserHitConsumer(this.definition, this.gameData),
            new UserDoubleConsumer(this.definition, this.gameData),
            new UserSplitConsumer(this.definition, this.gameData),
            new UserDealConsumer(this.definition, this.gameData)
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
