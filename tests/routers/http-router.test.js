import TableHttpRouter from "sc-game-base/src/table/routers/table-http-router";
import { logger } from "sc-common";
import HttpRouter from "../../src/routers/http-router";
import BaseEventPublishers from "sc-game-base/src/core/event-publishers/base-event-publisher";

jest.mock("sc-base-database");
jest.mock("sc-common");

const publisher = new BaseEventPublishers();
const gameNotificationsRepository = {
    deleteOne: jest.fn()
  };

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

    let router;
    beforeEach(() => {
        // Arrange
        jest.clearAllMocks();

        router = new HttpRouter(appConfigs, gameData, historyQuery, metricQuery, logService);
    });
    it("should inherit TableHttpRouter", () => {
        // Assert
        expect(router instanceof TableHttpRouter);
    });

    describe("init", () => {
        it("should run correct", () => {
            // Arrange
            app.calledPost = false;
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
            const realPlayer = { UID: 'abc', profile: { name: 'a' } };
            const gameData = {
              ingame: { [realPlayer.profile.name]: {} },
              gameConfigs: { odds: {} },
              realPlayers: { 1: realPlayer },
            };
            const definition = { settle: jest.fn() };
            const router = new HttpRouter(null, gameData, null, null, null, null, definition, publisher, gameNotificationsRepository);
            const res = { send: jest.fn() };
            const req = {
              body: {
                UserIdentify: 'abc',
                Name: 'a',
              },
            };
           
            publisher.publishToUser = jest.fn();
            //Act
            await router.handleVoidTicket(req, res);
      
            // Assert
            expect(router.gameData.ingame).toStrictEqual({});
            expect(gameNotificationsRepository.deleteOne).toHaveBeenCalled();
            expect(logger.logError).toHaveBeenCalledWith(
              `Void running ticket from api call for ${JSON.stringify('a')}`,
            );
            expect(publisher.publishToUser).toHaveBeenCalled();
            expect(res.send).toHaveBeenCalledWith(true);
        });

        it("should run incorrectly when player is invalid", async () => {
            // Arrange
            const realPlayer = { UID: "bc", profile: { name: "a" } };
            const gameData = {
                ingame: { [realPlayer.profile.name]: {} },
                gameConfigs: { odds: {} },
                realPlayers: { 1: realPlayer },
            };
            const definition = { settle: jest.fn() };
            const router = new HttpRouter(null, gameData, null, null, null, null, definition, publisher);
            const res = { send: jest.fn() };
            const req = {
                body: {
                    UserIdentify: "abc",
                    Name: "",
                },
            };
          
            await router.handleVoidTicket(req, res);

            // Assert
            expect(router.gameData.ingame).toStrictEqual({ [realPlayer.profile.name]: {} });
            expect(logger.logError).toHaveBeenCalledWith(`Player not found`);
            expect(res.send).toHaveBeenCalledWith(false);
        });
    });
});
