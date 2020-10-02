import { Core } from "sc-game-base";
import BlackJackGameData from "../blackjack-game-data";
import BlackjackGameDefinition from "../blackjack-game-definition";
import UserDealConsumer from "../consumers/user-deal-consumer";
import gameSettings from "../game-settings";
import { generateDecks } from "./../helpers/deck-helper";

export default class GameCron extends Core.Cron.BaseGameCron {
    /**
     * @param {BlackjackGameDefinition} gameDefinition
     * @param {BlackJackGameData} gameData
     */
    constructor(gameDefinition, gameData, settleGameConsumer) {
        super(gameDefinition, gameData, settleGameConsumer);
    }

    async start() {
        const lastestBet = await this.gameDefinition.betRepository
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
        const runningRounds = await this.gameDefinition.roundRepository.find({ ended: false }).lean().exec();

        runningRounds.forEach(async (round) => {
            let usedCards = [...round.result];
            const hands = await this.gameDefinition.betRepository.find({ phien: round.id }).lean().exec();
            const userHands = hands.map((hand) => {
                usedCards.push(...hand.cards);

                return {
                    ...hand,
                    isStand: hand.actions.includes(gameSettings.actions.stand),
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
        });
    }

    async proceed() {
        const { durations } = this.gameDefinition;

        if (this.gameData.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
            this.gameDefinition.bot && (await this.gameDefinition.bot.reset());
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;

            if (this.gameData.remainingTime % durations.botFrequency === 0) {
                await this.gameDefinition.bot.run();
            }
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.wholeRound;
            const expiredDate = new Date(new Date().setDate(-1));

            Object.values(this.gameData.ingame).forEach(async (userBet) => {
                if (userBet.betTracks?.roundStartTime > expiredDate) {
                    await this.settleGameRoundConsumer.settleRound(userBet.name);
                }
            });
        }
    }
}
