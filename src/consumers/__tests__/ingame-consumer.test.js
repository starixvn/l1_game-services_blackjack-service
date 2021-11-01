import BlackjackGameDefinition from "../../blackjack-game-definition";
import BlackjackGameData from "../../blackjack-game-data";
import gameSettings from "../../game-settings";
import InGameConsumer from "../ingame-consumer";
import mongoose from "mongoose";
import roundQuery from "sc-game-base/src/core/query-apis/round-query";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";

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
    session: {
        currencyGroupId: 1,
    },
};

const user = {
    id: 1,
    red: 5000,
    avatarId: 1,
    type: false,
};

let currencyGroupGamesRepository = null;

userInfosExecMockFunc.mockReturnValue(user);

beforeEach(() => {
    definition = new BlackjackGameDefinition(gameSettings);
    gameData = new BlackjackGameData(gameSettings.durations.wholeRound);
    gameData.gameConfigs = {
        enabled: true,
        enableFreeBet: false,
        odds: {
            regular: 2,
            blackjack: 2.5,
        },
        choices_maxbet: null,
    };

    currencyGroupGamesRepository = stubMongooseModelStupidly(mongoose.Model);
    currencyGroupGamesRepository.findOne().lean().exec.mockReturnValue({
        minBet: 1,
        maxBet: 3000,
    });

    consumer = new InGameConsumer(definition, gameData, roundQuery, null, getBalance, userInfosRepository, currencyGroupGamesRepository);
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
                enableFreeBet: gameData.gameConfigs.enableFreeBet,
                minBet: 1,
                maxBet: 3000,
                odds: gameData.gameConfigs.odds,
            },
        };
        expect(gameData.players[realPlayer.UID]).toEqual(expectedPlayer);
        expect(realPlayer.socketClient.emit).toHaveBeenCalledWith(definition.name, expectedPayload);
    });
});
