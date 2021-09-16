import BlackjackGameDefinition from "../../blackjack-game-definition";
import BlackjackGameData from "../../blackjack-game-data";
import gameSettings from "../../game-settings";
import InGameConsumer from "../ingame-consumer";
import mongoose from "mongoose";
import roundQuery from "sc-game-base/src/core/query-apis/round-query";

jest.mock("sc-game-base/src/core/query-apis/round-query");
const getBalance = jest.fn();

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;

const userInfosExecMockFunc = jest.fn();
/** @type {mongoose.Model}*/
const userInfosRepository = {
    findOne: () => ({
        lean: () => ({
            exec: userInfosExecMockFunc,
        }),
    }),
};

/** @type {UserDouInGameConsumerbleConsumer}*/
let consumer = null;

const realPlayer = {
    UID: 1,
    profile: {
        name: "player",
    },
    socketClient: {
        emit: jest.fn(),
    },
};

const user = {
    id: 1,
    red: 5000,
    avatarId: 1,
    type: false,
};

userInfosExecMockFunc.mockReturnValue(user);

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
        choices_maxbet: null
    };

    consumer = new InGameConsumer(definition, gameData, roundQuery, null, getBalance, userInfosRepository);
});

describe("test ingame consumer", () => {
    it("should store player into gamedata & publish to user via socket correctly", async () => {
        await consumer.consume(realPlayer);
        const expectedPlayer = {
            name: realPlayer.profile.name,
            ...user,
        };

        const expectedPayload = {
            user,
            ownBets: {},
            gameConfigs: {
                choices_maxbet :gameData.gameConfigs.choices_maxbet,
                enableFreeBet :gameData.gameConfigs.enableFreeBet,
                minbet :gameData.gameConfigs.minbet,
                maxbet :gameData.gameConfigs.maxbet,
                odds :gameData.gameConfigs.odds,
            }
        }
        expect(gameData.players[realPlayer.UID]).toEqual(expectedPlayer);
        expect(realPlayer.socketClient.emit).toHaveBeenCalledWith(definition.name, expectedPayload);
    });
});
