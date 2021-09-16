import { stub } from "jest-micro-auto-stub";
import { logger } from "sc-common";
import { BaseMetrics } from "sc-game-base/src/core/base-metrics";
import { PlaceBetPublisher } from "sc-game-base/src/core/event-publishers";

import BlackjackGameData from "../../blackjack-game-data";
import BlackjackGameDefinition from "../../blackjack-game-definition";
import SettleGameConsumer from "../../consumers/settle-game-consumer";
import gameSettings from "../../game-settings";
import { generateDecks } from "../../helpers/deck-helper";
import BlackJackProcessBetQueue from "../blackjack-process-bet-queue";

jest.mock("sc-game-base/src/core/event-publishers");
jest.mock("../../consumers/settle-game-consumer");
jest.mock("sc-common");

/** @type {BlackjackGameDefinition}*/
let definition = null;
/** @type {BlackjackGameData}*/
let gameData = null;

const placeBetPublisher = new PlaceBetPublisher();
const settleGameRoundConsumer = new SettleGameConsumer();
const placeBet = jest.fn();

const betsRepositoryExecMockFunc = jest.fn();
const betsRepository = {
    insertMany: jest.fn(),
    create: jest.fn(),
    findOne: () => ({
        exec: betsRepositoryExecMockFunc,
    }),
};
const betLogsRepository = {};
const userInfosRepository = { updateOne: jest.fn() };
const roundsRepository = {
    create: jest.fn(),
};

const baseMetrics = stub(BaseMetrics);

/** @type {UserDouInGameConsumerbleConsumer}*/
let processBetQueue = null;

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

    processBetQueue = new BlackJackProcessBetQueue({
        definition,
        gameData,
        placeBetPublisher,
        placeBet,
        logger,
        betsRepository,
        betLogsRepository,
        userInfosRepository,
        roundsRepository,
        settleGameRoundConsumer,
        baseMetrics,
    });

    jest.resetAllMocks();
});

const player = {
    UID: 1,
    profile: {
        name: "player",
        minBet: 1,
        maxBet: 5000,
    },
};

describe("deal test", () => {
    const payload = {
        action: gameSettings.actions.deal,
        hands: [
            {
                pos: 1,
                bet: 100,
            },
            {
                pos: 2,
                bet: 50,
            },
        ],
    };

    it("valid bet, start dealing cards, save to database, update bettracks, publish to user", async () => {
        gameData.betId = 100;
        gameData.roundId = 1;
        const betTracks = {};
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValue({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        roundsRepository.create.mockReturnValueOnce({ id: gameData.roundId + 1 });
        await processBetQueue.proceedBet(player, payload);

        expect(roundsRepository.create).toHaveBeenCalled();
        expect(betsRepository.insertMany).toHaveBeenCalled();
        expect(betTracks.roundId).toEqual(2);
        expect(betTracks.hands).toHaveLength(2);
        expect(betTracks.dealer.cards).toHaveLength(2);
        expect(gameData.ingame[player.profile.name].processing).toBeFalse();
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
    });

    it("valid bet, user stake change, start dealing cards, save to database, update bettracks, publish to user, update user stake level", async () => {
        gameData.betId = 100;
        gameData.roundId = 1;
        const betTracks = {};
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValue({ isOk: true, response: { minBet: 1, maxBet: 3000 } });
        roundsRepository.create.mockReturnValueOnce({ id: gameData.roundId + 1 });
        await processBetQueue.proceedBet(player, payload);

        expect(roundsRepository.create).toHaveBeenCalled();
        expect(betsRepository.insertMany).toHaveBeenCalled();
        expect(betTracks.roundId).toEqual(2);
        expect(betTracks.hands).toHaveLength(2);
        expect(betTracks.dealer.cards).toHaveLength(2);
        expect(gameData.ingame[player.profile.name].processing).toBeFalse();
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
        expect(player.profile.maxBet).toEqual(3000);
        expect(userInfosRepository.updateOne).toHaveBeenCalled();
    });

    it("placeBet return error, only publish errors to user", async () => {
        gameData.betId = 100;
        gameData.roundId = 1;
        const betTracks = {};
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValue({ isOk: false, response: { apiError: { errorCode: 1000 } } });
        await processBetQueue.proceedBet(player, payload);

        expect(roundsRepository.create).not.toHaveBeenCalled();
        expect(betsRepository.insertMany).not.toHaveBeenCalled();
        expect(betTracks.roundId).toBeUndefined();
        expect(betTracks.hands).toBeEmpty();
        expect(betTracks.dealer.cards).toBeEmpty();
        expect(gameData.ingame[player.profile.name].processing).toBeFalse();
        expect(placeBetPublisher.publishGameFailedBet).toHaveBeenCalled();
    });
});

describe("process double tests", () => {
    it("api return isOk = true, update betTracks and database", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.double, id: 100 });

        expect(hand.actions).toContain(gameSettings.actions.double);
        expect(hand.bet).toEqual(200);
        expect(hand.cards).toHaveLength(3);
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
    });

    it("placeBet return error, only publish error to user", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: false, response: { kickedOut: true } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.double, id: 100 });

        expect(hand.actions).toBeEmpty;
        expect(hand.bet).toEqual(100);
        expect(hand.cards).toHaveLength(2);
        expect(betsRepositoryExecMockFunc).not.toHaveBeenCalled();
        expect(placeBetPublisher.publishToUser).not.toHaveBeenCalled();
        expect(placeBetPublisher.publishGameFailedBet).toHaveBeenCalled();
    });
});

describe("process hit tests", () => {
    it("should update betTracks and database", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.hit, id: 100 });

        expect(hand.actions).toContain(gameSettings.actions.hit);
        expect(hand.cards).toHaveLength(3);
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
    });

    it("should auto stand hand when total > 21", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "10" },
                { suit: 1, rank: "10" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.hit, id: 100 });

        expect(hand.actions).toContain(gameSettings.actions.hit);
        expect(hand.actions).toContain(gameSettings.actions.stand);
        expect(hand.isStand).toBeTrue();
        expect(hand.cards).toHaveLength(3);
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
    });
});

describe("process stand tests", () => {
    it("should update betTracks, database & publish to user", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const nextHand = {
            id: 101,
            pos: 2,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand, nextHand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
            activeHandId: 100,
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.stand, id: 100 });

        expect(hand.actions).toContain(gameSettings.actions.stand);
        expect(hand.isStand).toBeTrue();
        expect(hand.cards).toHaveLength(2);
        expect(betTracks.activeHandId).toEqual(nextHand.id);
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
    });
});

describe("process split tests", () => {
    it("api return isOk = true, update betTracks and database", async () => {
        gameData.betId = 101;
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "A" },
                { suit: 1, rank: "A" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: true, response: { minBet: 1, maxBet: 5000 } });
        betsRepositoryExecMockFunc.mockReturnValueOnce({ save: jest.fn(), actions: [] });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.split, id: 100 });

        expect(hand.actions).toContain(gameSettings.actions.split);
        expect(betTracks.hands.some((x) => x.splitFrom === hand.id && x.pos === hand.pos + 3)).toBeTrue();
        expect(placeBetPublisher.publishToUser).toHaveBeenCalled();
        expect(betsRepository.create).toHaveBeenCalled();
    });

    it("placeBet return error, only publish error to user", async () => {
        const hand = {
            id: 100,
            pos: 1,
            actions: [],
            cards: [
                { suit: 0, rank: "8" },
                { suit: 0, rank: "2" },
            ],
            bet: 100,
            isStand: false,
        };
        const betTracks = {
            roundId: 1,
            hands: [hand],
            deck: generateDecks(),
            dealer: {
                cards: [],
            },
        };
        gameData.ingame[player.profile.name] = {
            name: player.profile.name,
            betTracks,
            processing: true,
        };
        placeBet.mockReturnValueOnce({ isOk: false, response: { kickedOut: true } });
        await processBetQueue.proceedBet(player, { action: gameSettings.actions.split, id: 100 });

        expect(hand.actions).toBeEmpty;
        expect(hand.bet).toEqual(100);
        expect(hand.cards).toHaveLength(2);
        expect(betsRepository.create).not.toHaveBeenCalled();
        expect(betsRepositoryExecMockFunc).not.toHaveBeenCalled();
        expect(placeBetPublisher.publishToUser).not.toHaveBeenCalled();
        expect(placeBetPublisher.publishGameFailedBet).toHaveBeenCalled();
    });
});
