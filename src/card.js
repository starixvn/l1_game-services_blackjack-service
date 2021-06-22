const cardSuit = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
};

const cardRank = {
    ace: "A",
    king: "K",
    queen: "Q",
    jack: "J",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
    six: "6",
    seven: "7",
    eight: "8",
    nine: "9",
    ten: "10",
};
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
}

const cards = [];

Object.values(cardSuit).forEach((suit) => {
    Object.values(cardRank).forEach((rank) => cards.push(new Card(rank, suit)));
});

export { cards };
