import { cards } from "../card";
import Chance from "chance";
import _ from "lodash";

export const generateDecks = (exclusions) => {
    let baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];

    if (exclusions) {
        exclusions.forEach((excludeCard) => {
            const index = _.findIndex(baseDeck, excludeCard);
            baseDeck.splice(index, 1);
        });
    }

    return new Chance().shuffle(baseDeck);
};
