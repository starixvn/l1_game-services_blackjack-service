import { getBalance } from 'sc-base-apis';
import { Core } from 'sc-game-base';

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async buildPayload(realPlayer) {
        const { minbet, maxbet, choices_maxbet, odds, enableFreeBet } = this.gameData.gameConfigs;
        const gameConfigs = { minbet, maxbet, choices_maxbet, odds, enableFreeBet };
        const { betTracks } = this.gameData.ingame[realPlayer.profile.name] || { betTracks: {} };
        const totalAmount = betTracks.roundId > 0 ? betTracks.hands.reduce((total, item) => total + item.bet, 0) : 0;

        const ownBets =
            betTracks.roundId > 0
                ? {
                      roundId: betTracks.roundId,
                      totalAmount,
                      dealer: [betTracks.dealer.cards[0]],
                      hands: betTracks.hands,
                  }
                : {};

        await getBalance(realPlayer, true);

        const user = await this.getUserInfo(realPlayer.UID);

        return {
            gameConfigs,
            ownBets,
            user,
        };
    }
}
