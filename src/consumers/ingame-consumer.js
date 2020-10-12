import { Core } from "sc-game-base";
import { userInfos } from "sc-base-database";

export default class InGameConsumer extends Core.BaseEventConsumers.InGameConsumer {
    async buildPayload(realPlayer) {
        const payload = await super.buildPayload(realPlayer);
        const totalAmount = payload.ownBets?.roundId > 0 ? 0 : payload.ownBets.hands.reduce((total, item) => total + item.bet, 0);
        const betTracks =
            payload.ownBets?.roundId > 0
                ? {
                      roundId: payload.ownBets.roundId,
                      totalAmount,
                      dealer: [payload.ownBets.dealer.cards[0]],
                      hands: payload.ownBets.hands,
                  }
                : {};

        return {
            gameConfigs: payload.gameConfigs,
            roundHistory: payload.roundHistory,
            user: payload.user,
            ownBets: betTracks,
        };
    }

    getUserInfo(uid) {
        return userInfos
            .findOne(
                { id: uid },
                {
                    _id: false,
                    UID: true,
                    name: true,
                    avatarId: true,
                    red: true,
                    scoins: true,
                    joinedOn: true,
                    security: true,
                    currency: true,
                    type: true,
                }
            )
            .lean()
            .exec();
    }
}
