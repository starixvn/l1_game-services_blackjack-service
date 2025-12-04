import BlackjackGameDefinition from "../../blackjack-game-definition";
import BlackjackGameData from "../../blackjack-game-data";
import gameSettings from "../../game-settings";
import BaseEventPublishers from "sc-game-base/src/core/event-publishers/base-event-publisher";
import noticeHelper from "../../helpers/notice-helper";
import SettleGameConsumer from "../settle-game-consumer";
import RoundResultPublisher from "../../publishers/round-result-publisher";
import { generateDecks } from "../../helpers/deck-helper";
import { generateResult, isUpCards, settle } from "../../helpers/dealer";
import { gameNotifications } from "sc-base-database";
jest.mock("../../publishers/round-result-publisher");
jest.mock("sc-base-database");

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;
const roundResultPublisher = new RoundResultPublisher();

const roundsRepositoryExecMockFunc = jest.fn();
/** @type {mongoose.Model}*/
const roundsRepository = {
    findOne: () => ({
        lean: () => ({
            exec: roundsRepositoryExecMockFunc,
        }),
    }),
    updateOne: jest.fn(),
};

const betsRepositoryExecMockFunc = jest.fn();
/** @type {mongoose.Model}*/
const betsRepository = {
    find: () => ({
        exec: betsRepositoryExecMockFunc,
    }),
};

/** @type {SettleGameConsumer}*/
let consumer = null;

const endGame = jest.fn();
endGame.mockReturnValue({ isOk: true });

beforeEach(() => {
    definition = new BlackjackGameDefinition(gameSettings, generateResult, settle, gameSettings.actions, gameSettings.payouts);
    gameData = new BlackjackGameData(gameSettings.durations.wholeRound);
    gameData.gameConfigs = {
        enabled: true,
        minbet: 1,
        maxbet: 3000,
        disabledround: 6912,
        odds: {
            regular: 2,
            blackjack: 2.5,
        },
    };

    consumer = new SettleGameConsumer({ definition, gameData, roundResultPublisher, endGame, roundsRepository, betsRepository });
});

describe("settle round tests", () => {
    it("should delete ingame, publish round result delete data in game notification", async () => {
        const deck = generateDecks();
        const betTracks = {
            uid: 1,
            roundId: 1,
            hands: [
                {
                    id: 100,
                    bet: 100,
                    cards: [
                        {
                            rank: "10",
                            suit: 0,
                        },
                        {
                            rank: "J",
                            suit: 0,
                        },
                    ],
                    actions: [gameSettings.actions.stand],
                },
            ],
            deck,
            dealer: {
                cards: [
                    { rank: "10", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
            },
        };
        gameData.ingame["player"] = {
            betTracks,
        };

        roundsRepositoryExecMockFunc.mockReturnValueOnce({ id: 1, odds: gameData.gameConfigs.odds });
        betsRepositoryExecMockFunc.mockReturnValueOnce([
            {
                id: 100,
                roundId: 1,
                bet: 100,
                cards: [
                    {
                        rank: "10",
                        suit: 0,
                    },
                    {
                        rank: "J",
                        suit: 0,
                    },
                ],
                actions: [gameSettings.actions.stand],
                save: jest.fn(),
            },
        ]);

        await consumer.settleRound("player");
        expect(roundResultPublisher.publishRoundResult).toHaveBeenCalled();
        expect(gameData.ingame["player"]).toBeUndefined();
        expect(gameNotifications.deleteOne).toHaveBeenCalled();
    });
});

describe("settle bet tests", () => {
    it("should delete ingame, publish round result", async () => {
        const deck = generateDecks();
        const betTracks = {
            uid: 1,
            roundId: 1,
            hands: [
                {
                    id: 100,
                    bet: 100,
                    cards: [
                        {
                            rank: "10",
                            suit: 0,
                        },
                        {
                            rank: "J",
                            suit: 0,
                        },
                    ],
                    actions: [gameSettings.actions.stand],
                },
            ],
            deck,
            dealer: {
                cards: [
                    { rank: "10", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
            },
        };
        gameData.ingame["player"] = {
            betTracks,
        };

        const { result, settlementResult } = generateResult(betTracks.dealer.cards, betTracks.deck, isUpCards(betTracks.hands));

        const finish = {
            settlementResult,
            result,
            roundId: betTracks.roundId,
            time: new Date(),
        };

        betsRepositoryExecMockFunc.mockReturnValueOnce([
            {
                id: 100,
                roundId: 1,
                bet: 100,
                cards: [
                    {
                        rank: "10",
                        suit: 0,
                    },
                    {
                        rank: "J",
                        suit: 0,
                    },
                ],
                actions: [],
                save: jest.fn(),
            },
        ]);

        await consumer.settleBets({ ...finish, playerName: "player", playerUID: betTracks.uid });
        expect(roundResultPublisher.publishRoundResult).toHaveBeenCalledWith({
            playerId: betTracks.uid,
            result: {
                result,
                settlementResult,
                winningHands: [{ id: 100, betwin: 200 }],
            },
        });
        expect(gameData.ingame["player"]).toBeUndefined();
    });
});

describe("buildSlotConfig", () => {
    it("should return null when slotMechanics is not enabled in gameConfigs or settings", () => {
        gameData.gameConfigs = {
            randomMode: 1,
            odds: { regular: 2, blackjack: 2.5 },
        };

        const result = consumer.buildSlotConfig();
        expect(result).toBeNull();
    });

    it("should return null when slotMechanics.enabled is false", () => {
        gameData.gameConfigs = {
            randomMode: 1,
            odds: { regular: 2, blackjack: 2.5 },
            slotMechanics: {
                enabled: false,
            },
        };

        const result = consumer.buildSlotConfig();
        expect(result).toBeNull();
    });

    it("should return config when slotMechanics is enabled in gameConfigs", () => {
        gameData.gameConfigs = {
            randomMode: 2,
            odds: { regular: 2, blackjack: 2.5 },
            slotMechanics: {
                enabled: true,
                distributions: {
                    2: { bust: 40, standing_17: 20, standing_20: 40 },
                },
            },
        };

        const result = consumer.buildSlotConfig();

        expect(result).not.toBeNull();
        expect(result.enabled).toBe(true);
        expect(result.randomMode).toBe(2);
        expect(result.distribution).toEqual({ bust: 40, standing_17: 20, standing_20: 40 });
    });

    it("should use correct distribution for randomMode", () => {
        gameData.gameConfigs = {
            randomMode: 3,
            odds: { regular: 2, blackjack: 2.5 },
            slotMechanics: {
                enabled: true,
                distributions: {
                    1: { bust: 28 },
                    2: { bust: 35 },
                    3: { bust: 22 },
                },
            },
        };

        const result = consumer.buildSlotConfig();

        expect(result.randomMode).toBe(3);
        expect(result.distribution).toEqual({ bust: 22 });
    });

    it("should default to randomMode 1 when not set", () => {
        gameData.gameConfigs = {
            odds: { regular: 2, blackjack: 2.5 },
            slotMechanics: {
                enabled: true,
                distributions: {
                    1: { bust: 28 },
                },
            },
        };

        const result = consumer.buildSlotConfig();

        expect(result.randomMode).toBe(1);
    });

    it("should fall back to old dealerDistribution format for backwards compatibility", () => {
        gameData.gameConfigs = {
            randomMode: 2,
            odds: { regular: 2, blackjack: 2.5 },
            slotMechanics: {
                enabled: true,
                dealerDistribution: { bust: 30, standing_17: 70 },
            },
        };

        const result = consumer.buildSlotConfig();

        expect(result.distribution).toEqual({ bust: 30, standing_17: 70 });
    });
});

describe("getDistributionForMode", () => {
    it("should prioritize DB distributions over settings", () => {
        const configFromDb = {
            distributions: {
                1: { bust: 50 },
            },
        };
        const configFromSettings = {
            distributions: {
                1: { bust: 28 },
            },
        };

        const result = consumer.getDistributionForMode(1, configFromDb, configFromSettings);

        expect(result).toEqual({ bust: 50 });
    });

    it("should fall back to settings when DB has no distribution for mode", () => {
        const configFromDb = {
            distributions: {
                2: { bust: 50 },
            },
        };
        const configFromSettings = {
            distributions: {
                1: { bust: 28 },
                3: { bust: 22 },
            },
        };

        const result = consumer.getDistributionForMode(3, configFromDb, configFromSettings);

        expect(result).toEqual({ bust: 22 });
    });

    it("should fall back to old dealerDistribution when distributions not available", () => {
        const configFromDb = {
            dealerDistribution: { bust: 40 },
        };
        const configFromSettings = {
            distributions: {
                1: { bust: 28 },
            },
        };

        const result = consumer.getDistributionForMode(1, configFromDb, configFromSettings);

        expect(result).toEqual({ bust: 40 });
    });

    it("should fall back to mode 1 from settings as ultimate fallback", () => {
        const configFromDb = null;
        const configFromSettings = {
            distributions: {
                1: { bust: 28 },
            },
        };

        const result = consumer.getDistributionForMode(99, configFromDb, configFromSettings);

        expect(result).toEqual({ bust: 28 });
    });

    it("should return empty object when no distribution available", () => {
        const result = consumer.getDistributionForMode(1, null, null);

        expect(result).toEqual({});
    });
});
