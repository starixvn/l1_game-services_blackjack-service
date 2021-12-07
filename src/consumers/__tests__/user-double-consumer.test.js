import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import BaseEventPublishers from "sc-game-base/src/core/event-publishers/base-event-publisher";

import BlackjackGameData from "../../blackjack-game-data";
import BlackjackGameDefinition from "../../blackjack-game-definition";
import gameSettings from "../../game-settings";
import noticeHelper from "../../helpers/notice-helper";
import UserDoubleConsumer from "../user-double-consumer";

jest.mock("sc-game-base/src/core/event-publishers/base-event-publisher");

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;
const publisher = new BaseEventPublishers();

/** @type {UserDoubleConsumer}*/
let consumer = null;

const DATE_TO_USE = new Date("2016");
const _Date = Date;
global.Date = jest.fn(() => DATE_TO_USE);

const player = {
    UID: 1,
    profile: {
        name: "player",
        minBet: 1,
        maxBet: 5000,
    },
    session: {
        currencyGroupId: "g1",
    },
};

const mockInGamePlayer = () => ({
    betTracks: {
        activeHandId: 100,
        roundId: 100,
        hands: [
            {
                id: 100,
                cards: [
                    { rank: "8", suit: 0 },
                    { rank: "A", suit: 1 },
                ],
                isStand: false,
                actions: [],
            },
        ],
        dealer: {
            cards: [],
        },
    },
    betQueue: [],
    processing: false,
});

beforeEach(() => {
    definition = new BlackjackGameDefinition(gameSettings);
    gameData = new BlackjackGameData(gameSettings.durations.wholeRound);
    gameData.gameConfigs = {
        enabled: true,
        disabledround: 6912,
        odds: {
            regular: 2,
            blackjack: 2.5,
        },
    };
    gameData.currencyGroupGames = [
        {
            groupId: "g1",
            minBet: 1,
            maxBet: 3000,
        },
    ];
    consumer = new UserDoubleConsumer(definition, gameData, publisher);
});

describe("consume test", () => {
    it("valid payload, add to betQueue, flag processing = true", async () => {
        const payload = {
            double: {
                id: 100,
            },
        };
        const ingamePlayer = mockInGamePlayer();
        gameData.ingame[player.profile.name] = ingamePlayer;

        await consumer.consume(player, payload);

        expect(ingamePlayer.processing).toBeTrue();
        expect(ingamePlayer.betQueue).toContainEqual({
            player,
            payload: { action: gameSettings.actions.double, id: payload.double.id, receivedTime: DATE_TO_USE },
        });
    });

    it("invalid payload, publish error to user, not updating betTracs", async () => {
        const payload = {
            double: {
                id: 200,
            },
        };
        const ingamePlayer = mockInGamePlayer();
        gameData.ingame[player.profile.name] = ingamePlayer;

        await consumer.consume(player, payload);
        expect(ingamePlayer.processing).toBeFalse();
        expect(ingamePlayer.betQueue).toBeEmpty();
    });
});

describe("validation test", () => {
    it("hand is stand, return correct error", async () => {
        const payload = {
            double: {
                id: 100,
            },
        };

        const ingamePlayer = mockInGamePlayer();
        gameData.ingame[player.profile.name] = ingamePlayer;
        ingamePlayer.betTracks.hands[0].isStand = true;
        ingamePlayer.betTracks.hands[0].actions.push(gameSettings.actions.stand);

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.handIsStand } });
    });

    it("invalid hand id, return correct error", async () => {
        const payload = {
            double: {
                id: 120,
            },
        };

        const ingamePlayer = mockInGamePlayer();
        gameData.ingame[player.profile.name] = ingamePlayer;

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.invalidHandId } });
    });

    it("hand isnt active, return correct error", async () => {
        const payload = {
            double: {
                id: 100,
            },
        };

        const ingamePlayer = mockInGamePlayer();
        gameData.ingame[player.profile.name] = ingamePlayer;
        ingamePlayer.betTracks.activeHandId = 101;

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.handNotActive } });
    });
});
