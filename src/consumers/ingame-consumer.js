import { Core } from "sc-game-base";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async consume(realPlayer) {
        const payload = await this.buildPayload(realPlayer);
        const player = {
            id: realPlayer.UID,
            name: realPlayer.profile.name,
            red: payload.user.red,
            avatarId: payload.user.avatarId,
            type: payload.user.type,
        };

        if (!this.gameData.players[realPlayer.UID]) {
            this.gameData.players[realPlayer.UID] = player;
        }

        realPlayer.socketClient.emit(this.definition.name, payload);
    }

    async buildPayload(realPlayer) {
        const { session } = realPlayer;

        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === session.currencyGroupId);

        const { odds, enableFreeBet } = this.gameData.gameConfigs;
        const gameConfigs = { ...settings, odds, enableFreeBet };
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

        await this.getBalance(realPlayer, true);

        const user = await this.getUserInfo(realPlayer.UID);

        return {
            gameConfigs,
            ownBets,
            user,
        };
    }
}
