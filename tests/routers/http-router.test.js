import TableHttpRouter from "sc-game-base/src/table/routers/table-http-router";
import { logger } from "sc-common";
import HttpRouter from "../../src/routers/http-router";
import BaseEventPublishers from "sc-game-base/src/core/event-publishers/base-event-publisher";
import { gameNotifications } from "sc-base-database";

jest.mock("sc-base-database");
jest.mock("sc-common");

const publisher = new BaseEventPublishers();

describe("HttpRouter", () => {
    const app = {
        get: jest.fn(),
        post: (url, authenticate, callBack) => {
            callBack && callBack({}, { send: jest.fn() });
        },
        calledPost: false,
    };
    const appConfigs = {
        apiSettings: {
            authUrl: "http://localhost",
        },
        authenticateSettings: {
            audiences: [],
        },
    };
    const logService = {};
    const gameData = {};
    const historyQuery = {};
    const metricQuery = {};
    const res = { send: jest.fn() };

    let router;
    beforeEach(() => {
        // Arrange
        jest.clearAllMocks();

        router = new HttpRouter(appConfigs, gameData, historyQuery, metricQuery, logService);
    });
    it("should inherit TableHttpRouter", () => {
        // Act
        const router = new HttpRouter();

        // Assert
        expect(router instanceof TableHttpRouter);
    });

    describe("init", () => {
        it("should run correct", () => {
            // Arrange
            app.calledPost = false;
            router.appConfigs = appConfigs;
            TableHttpRouter.prototype.init = jest.fn();
            router.handleVoidTicket = jest.fn();
            // Act
            router.init(app);

            // Assert
            expect(TableHttpRouter.prototype.init).toHaveBeenCalledWith(app);
            expect(router.handleVoidTicket).toHaveBeenCalled();
        });
    });

    describe("handleVoidTicket", () => {
        it("should run correctly when player is valid", async () => {
            // Arrange
            const router = new HttpRouter(null, null, null, null, null, null, null, publisher);
            const res = { send: jest.fn() };
            const req = {
                body: {
                    UserIdentify: "abc",
                    Name: "a",
                },
            };
            const realPlayer = { UID: "abc", profile: { name: "a" } };
            router.gameData = {
                ingame: { [realPlayer.profile.name]: {} },
                gameConfigs: { odds: {} },
                realPlayers: { 1: realPlayer },
            };
            router.definition = { settle: jest.fn() };
            publisher.publishToUser = jest.fn();
            //Act
            await router.handleVoidTicket(req, res);

            // Assert
            expect(router.gameData.ingame).toStrictEqual({});
            expect(gameNotifications.deleteOne).toHaveBeenCalled();
            expect(logger.logError).toHaveBeenCalledWith(`Void running ticket from api call for ${JSON.stringify("a")}`);
            expect(publisher.publishToUser).toHaveBeenCalled();
            expect(res.send).toHaveBeenCalledWith(true);
        });

        it("should run incorrectly when player is invalid", async () => {
            // Arrange
            const router = new HttpRouter();
            const res = { send: jest.fn() };
            const req = {
                body: {
                    UserIdentify: "abc",
                    Name: "",
                },
            };
            const realPlayer = { UID: "bc", profile: { name: "a" } };
            router.gameData = {
                ingame: { [realPlayer.profile.name]: {} },
                gameConfigs: { odds: {} },
                realPlayers: { 1: realPlayer },
            };
            router.definition = { settle: jest.fn() };
            await router.handleVoidTicket(req, res);

            // Assert
            expect(router.gameData.ingame).toStrictEqual({ [realPlayer.profile.name]: {} });
            expect(logger.logError).toHaveBeenCalledWith(`Player not found`);
            expect(res.send).toHaveBeenCalledWith(false);
        });
    });
});
