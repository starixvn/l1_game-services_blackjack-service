import { Core, Table } from "sc-game-base";
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
        const router = new BlackJackSocketRouter(this.definition, this.gameData, null, null, null, null, null, null, null);

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
