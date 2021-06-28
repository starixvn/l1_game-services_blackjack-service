import BlackjackGameDefinition from "../../blackjack-game-definition";
import BlackjackGameData from "../../blackjack-game-data";
import gameSettings from "../../game-settings";
import OutGameConsumer from "../outgame-consumer";
jest.useFakeTimers();

jest.mock("sc-base-database", () => ({
    gameNotifications: {
        updateOne: () => ({
            exec: jest.fn(),
        }),
    },
}));

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;

/** @type {UserDouInGameConsumerbleConsumer}*/
let consumer = null;

const realPlayer = {
    UID: 1,
    profile: {
        name: "player",
    },
    socketClient: {
        id: 123,
        emit: jest.fn(),
    },
};

beforeEach(() => {
    definition = new BlackjackGameDefinition(gameSettings);
    gameData = new BlackjackGameData(gameSettings.durations.wholeRound);
    gameData.gameConfigs = {
        enabled: true,
        minbet: 1,
        maxbet: 3000,
        enableFreeBet: false,
        odds: {
            regular: 2,
            blackjack: 2.5,
        },
        choices_maxbet: null,
    };

    consumer = new OutGameConsumer(definition, gameData, null);
});

describe("test outgame consumer", () => {
    it("should save running round to database, clear the game data", async () => {
        gameData.realPlayers[realPlayer.socketClient.id] = realPlayer;
        gameData.players[realPlayer.UID] = {
            id: realPlayer.UID,
            name: realPlayer.profile.name,
        };
        gameData.ingame[realPlayer.profile.name] = {
            betTracks: {
                roundId: 100,
                roundStartTime: new Date(),
            },
        };

        await consumer.consume(realPlayer.socketClient);
        jest.runAllTimers();
        
        expect(gameData.players[realPlayer.UID]).toBeUndefined();
        expect(gameData.realPlayers[realPlayer.socketClient.id]).toBeUndefined();
    });
});
