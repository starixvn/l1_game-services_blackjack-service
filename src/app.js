import { Core } from "sc-game-base";

import appConfigs from "./app-configs";
import BlackjackContainerRegistry from "./blackjack-container-registry";
import BlackJackGameData from "./blackjack-game-data";
import BlackJackGameDefinition from "./blackjack-game-definition";
import gameSettings from "./game-settings";
import { generateResult, settle } from "./helpers/dealer";

const run = async () => {
    const gameData = new BlackJackGameData(gameSettings.durations.wholeRound);

    const definition = new BlackJackGameDefinition(gameSettings, generateResult, settle, gameSettings.actions, gameSettings.payouts);

    const container = new BlackjackContainerRegistry().register(appConfigs, definition, gameData);
    const app = new Core.BaseGameApp(definition.name, appConfigs);

    await app.run();
    await app.startGame(container);
};

run();
