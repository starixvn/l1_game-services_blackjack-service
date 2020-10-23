import Chance from "chance";
import _ from "lodash";

import { cards } from "../card";

export const generateDecks = (exclusions) => {
    const baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    const chance = new Chance();

    if (exclusions) {
        exclusions.forEach((excludeCard) => {
            const index = _.findIndex(baseDeck, excludeCard);
            baseDeck.splice(index, 1);
        });
    }

    return chance.shuffle(chance.shuffle(chance.shuffle(baseDeck)));
};
