import Chance from "chance";
import _ from "lodash";
import { shuffle as d3Shuffle } from "d3-array";
import { Random as RandomJS, MersenneTwister19937 } from "random-js";
import { cards } from "../card";

const chance = new Chance();

const random1 = (arr) => {
    return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const random2 = (arr) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const random3 = (arr) => {
    let result = arr;
    const r = new RandomJS(MersenneTwister19937.autoSeed());

    for (let i = 0; i < 3; i++) {
        result = r.shuffle(arr);
    }

    return result;
};

const random4 = (arr) => {
    return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const randomModes = {
    1: [random1],
    2: [random2],
    3: [random3, random4],
};

export const generateDecks = (exclusions, randomMode) => {
    const baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    const randomShuffles = randomModes[randomMode] ?? randomModes[1];
    const randomShuffle = chance.pickone(randomShuffles);

    if (exclusions) {
        exclusions.forEach((excludeCard) => {
            const index = _.findIndex(baseDeck, excludeCard);
            baseDeck.splice(index, 1);
        });
    }

    return randomShuffle(baseDeck);
};
