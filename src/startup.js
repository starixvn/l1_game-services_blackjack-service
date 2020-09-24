import { Core, Table } from "sc-game-base";

import PlaceBetConsumer from "./consumers/place-bet-consumer";
import initDatabase from "./models";

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
        const router = new Table.Routers.SocketRouter(
            this.definition,
            this.gameData,
            null,
            null,
            null,
            new PlaceBetConsumer(this.definition, this.gameData),
            null,
            null,
            null
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
