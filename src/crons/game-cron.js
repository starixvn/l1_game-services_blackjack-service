import cron from "cron";
import moment from "moment";
import { logger } from "sc-common";
import { Core } from "sc-game-base";

import appConfigs from "../app-configs";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import { generateDecks } from "./../helpers/deck-helper";

export default class GameCron extends Core.Crons.BaseGameCron {
    /**
     * @param {BlackjackGameDefinition} definition
     * @param {BlackJackGameData} gameData
     */
    constructor({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        gameConfigsRepository,
        roundsRepository,
        betsRepository,
        archiveStatusesRepository,
        notificationRepository,
        exchangeRatesRepository,
        currencyGroupGamesRepository,
        partnerConfigRepository,
        currencyGroupRepository,
        currencyRepository,
    }) {
        super({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher,
            logService,
            gameConfigsRepository,
            roundsRepository,
            archiveStatusesRepository,
            notificationRepository,
            exchangeRatesRepository,
            currencyGroupGamesRepository,
            partnerConfigRepository,
            currencyGroupRepository,
            currencyRepository,
        });

        this.betsRepository = betsRepository;
    }

    async start() {
        const job = new cron.CronJob(
            "* * * * * *",
            () => this.proceed().catch(logger.logError),
            () => {
                logger.logError(`${this.definition.name} unexpectedly stopped because some other tasks halt it.`);
                job.start();
            }
        );

        const lastestBet = await this.betsRepository
            .findOne({}, "id", { sort: { id: -1 } })
            .lean()
            .exec();

        if (lastestBet) {
            this.gameData.betId = lastestBet.id + 1;
        } else {
            this.gameData.betId = await this.getLastArchiveBet();
        }

        const lastRound = await this.roundsRepository
            .findOne({}, "id", { sort: { id: -1 } })
            .lean()
            .exec();

        if (lastRound) {
            this.gameData.roundId = lastRound.id + 1;
        } else {
            this.gameData.roundId = await this.getLastArchiveRound();
        }

        await this.initBetTracks();
        await this.getSettingForNewRound();
        await this.updateExchangeRates();

        job.start();
    }

    async getLastArchiveBet() {
        const { configName } = this.definition;
        const archiveStatus = await this.archiveStatusesRepository.findOne({ name: configName }, "lastArcId").lean().exec();

        return archiveStatus ? archiveStatus.lastArcId["_cuocs"] + 1 : 1;
    }

    async initBetTracks() {
        const runningRounds = await this.roundsRepository.find({ ended: false }).lean().exec();

        await Promise.all(
            runningRounds.map(async (round) => {
                const usedCards = [...round.result];
                const hands = await this.betsRepository.find({ phien: round.id }).lean().exec();
                const userHands = hands.map((hand) => {
                    usedCards.push(...hand.cards);

                    return {
                        ...hand,
                        isStand: hand.actions.includes(gameSettings.actions.stand),
                        total: calculate(hand.cards),
                    };
                });
                userHands.sort((hand1, hand2) => gameSettings.posOrder.indexOf(hand1.pos) - gameSettings.posOrder.indexOf(hand2.pos));

                const newPlayer = {
                    name: round.name,
                    betTracks: {
                        roundId: round.id,
                        roundStartTime: round.roundStartTime,
                        uid: round.uid,
                        deck: generateDecks(usedCards),
                        dealer: { cards: [...round.result] },
                        hands: userHands,
                        activeHandId: userHands.find((hand) => !hand.isStand)?.id,
                    },
                    betQueue: [],
                };
                console.log(userHands);

                this.gameData.ingame[round.name] = newPlayer;
            })
        );
    }

    async proceed() {
        const { durations } = this.definition;

        if (this.gameData.remainingTime === durations.wholeAction) {
            await this.checkGameStatus();
            this.bot && (await this.bot.reset());
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;

            if (this.gameData.remainingTime % durations.botFrequency === 0) {
                this.bot && (await this.bot.run());
            }
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.wholeAction;
            const expiredDate = moment.utc().subtract(appConfigs.roundMaxDuration, "hours");

            await Promise.all(
                Object.values(this.gameData.ingame)
                    .filter(
                        (userBet) =>
                            userBet.betTracks &&
                            !this.gameData.players[userBet.betTracks.uid] &&
                            moment(userBet.betTracks.roundStartTime) < expiredDate
                    )
                    .map((userBet) => this.settleGameRoundConsumer.settleRound(userBet.name))
            );
        }
    }
}
