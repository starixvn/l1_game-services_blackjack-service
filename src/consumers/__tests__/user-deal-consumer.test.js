import BaseEventPublishers from "sc-game-base/src/core/event-publishers/base-event-publisher";

import BlackjackGameData from "../../blackjack-game-data";
import BlackjackGameDefinition from "../../blackjack-game-definition";
import gameSettings from "../../game-settings";
import noticeHelper from "../../helpers/notice-helper";
import UserDealConsumer from "../user-deal-consumer";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";

jest.mock("sc-game-base/src/core/event-publishers/base-event-publisher");

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;
const publisher = new BaseEventPublishers();

/** @type {UserDealConsumer}*/
let consumer = null;

const DATE_TO_USE = new Date("2016");
const _Date = Date;
global.Date = jest.fn(() => DATE_TO_USE);

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
    consumer = new UserDealConsumer(definition, gameData, publisher);
});

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

describe("consume test", () => {
    it("valid bet, add to betQueue, flag processing = true", async () => {
        const payload = {
            deal: {
                hands: [{ pos: 1, bet: 100 }],
            },
        };
        await consumer.consume(player, payload);
        const ingamePlayer = gameData.ingame[player.profile.name];
        expect(ingamePlayer.processing).toBeTrue();
        expect(ingamePlayer.betQueue).toContainEqual({
            player,
            payload: { action: gameSettings.actions.deal, hands: payload.deal.hands, receivedTime: DATE_TO_USE },
        });
    });

    it("invalid bet, publish error to user, not creating ingame", async () => {
        const payload = {
            deal: {
                hands: [{ pos: 1, bet: -100 }],
            },
        };
        await consumer.consume(player, payload);
        expect(gameData.ingame[player.profile.name]).toBeUndefined();
        expect(publisher.publishToUser).toHaveBeenCalled();
    });
});

describe("validation test", () => {
    it("payload has bet amount exceed maxbet, return correct error", async () => {
        const payload = {
            deal: {
                hands: [{ pos: 1, bet: 4000 }],
            },
        };

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.maxBet, maxBet: 3000 } });
    });
    it("payload has no hand, return correct error", async () => {
        const payload = {
            deal: {
                hands: [],
            },
        };

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.invalidDealHands } });
    });
    it("payload has hand having invalid postion, return correct error", async () => {
        const payload = {
            deal: {
                hands: [{ pos: 200, bet: 45 }],
            },
        };

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.invalidPosition } });
    });
    it("gameData has running round, return correct error", async () => {
        const payload = {
            deal: {
                hands: [{ pos: 1, bet: 400 }],
            },
        };

        gameData.ingame = {
            [player.profile.name]: {
                betTracks: {
                    roundId: 100,
                },
            },
        };

        const result = await consumer.composeActionValidationCriteria(player, payload);

        expect(result).toContainEqual({ failure: true, notice: { errorCode: noticeHelper.invalidDealDueToRunningRound } });
    });
});
