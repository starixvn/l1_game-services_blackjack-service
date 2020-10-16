import moment from 'moment';
import { Core } from 'sc-game-base';

import BlackJackGameData from '../blackjack-game-data';
import BlackjackGameDefinition from '../blackjack-game-definition';
import gameSettings from '../game-settings';
import { calculate } from '../helpers/card-helper';
import { generateDecks } from './../helpers/deck-helper';

export default class GameCron extends Core.Cron.BaseGameCron {
    /**
     * @param {BlackjackGameDefinition} definition
     * @param {BlackJackGameData} gameData
     */
    constructor(definition, gameData, mainServerApiSettings, bot, settleGameConsumer) {
        super(definition, gameData, mainServerApiSettings, bot, settleGameConsumer);
    }

    async start() {
        const lastestBet = await this.definition.betRepository
            .findOne({}, "id", { sort: { _id: -1 } })
            .lean()
            .exec();

        if (lastestBet) {
            this.gameData.betId = lastestBet.id + 1;
        }

        await super.start();
        await this.initBetTracks();
    }

    async initBetTracks() {
        const runningRounds = await this.definition.roundRepository.find({ ended: false }).lean().exec();

        await Promise.all(
            runningRounds.map(async (round) => {
                const usedCards = [...round.result];
                const hands = await this.definition.betRepository.find({ phien: round.id }).lean().exec();
                const userHands = hands.map((hand) => {
                    usedCards.push(...hand.cards);

                    return {
                        ...hand,
                        isStand: hand.actions.includes(gameSettings.actions.stand),
                        total: calculate(hand.cards),
                    };
                });

                const newPlayer = {
                    name: round.name,
                    betTracks: {
                        roundId: round.id,
                        roundStartTime: round.roundStartTime,
                        uid: round.uid,
                        deck: generateDecks(usedCards),
                        dealer: { cards: [...round.result] },
                        hands: userHands,
                    },
                    betQueue: [],
                };

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
            const expiredDate = moment.utc().add(-1, "days");

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
