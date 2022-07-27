import { generateDecks } from "../src/helpers/deck-helper";
import { isBlackjack } from "../src/helpers/card-helper";

function run() {
    const totalRounds = 100_000;
    const cardStatistic = {
        A: { count: 0, ratio: 0 },
        K: { count: 0, ratio: 0 },
        Q: { count: 0, ratio: 0 },
        J: { count: 0, ratio: 0 },
        2: { count: 0, ratio: 0 },
        3: { count: 0, ratio: 0 },
        4: { count: 0, ratio: 0 },
        5: { count: 0, ratio: 0 },
        6: { count: 0, ratio: 0 },
        7: { count: 0, ratio: 0 },
        8: { count: 0, ratio: 0 },
        9: { count: 0, ratio: 0 },
        10: { count: 0, ratio: 0 },
    };
    const blackJackStatistic = {
        player: [],
        dealer: {
            count: 0,
            ratio: 0,
        },
    };

    const { player, dealer } = blackJackStatistic;

    const totalHand = 3;
    const randomMode = 3;

    for (let index = 0; index < totalRounds; index++) {
        const desk = generateDecks([], randomMode);

        const playerCards = [];

        for (let handIndex = 0; handIndex < totalHand; handIndex++) {
            player[handIndex] = player[handIndex] ?? { count: 0, ratio: 0 };
            playerCards[handIndex] = playerCards[handIndex] ?? [];

            playerCards[handIndex] = [desk.shift(), desk.shift()];

            isBlackjack(playerCards[handIndex]) && player[handIndex].count++;

            cardStatistic[playerCards[handIndex][0].rank].count++;
            cardStatistic[playerCards[handIndex][1].rank].count++;
        }

        const dealerCards = [desk.shift(), desk.shift()];

        isBlackjack(dealerCards) && dealer.count++;
        cardStatistic[dealerCards[0].rank].count++;
        cardStatistic[dealerCards[1].rank].count++;
    }

    dealer.ratio = dealer.count / totalRounds;
    Object.values(cardStatistic).forEach((cardStat) => {
        cardStat.ratio = cardStat.count / totalRounds / (player.length * 2 + 2);
    });
    player.forEach((hand) => {
        hand.ratio = hand.count / totalRounds;
    });

    console.log(`======== Run ${totalRounds} rounds ========`);
    console.log(cardStatistic);
    console.log(blackJackStatistic);
}

run();
