import { helpers } from "sc-common";

export default {
    invalidHandId: "ID của tay bài này không đúng.",
    handAlreadySplit: "Tay bài này đã được tách bài.",
    cantSplitChildHand: "Không thể tách bài ở tụ con.",
    cantDoubleHand: "Không thể gấp đôi tiền cược.",
    cantHit: "Không thể rút thêm bài.",
    cardsNotEqual: "Hai lá bài không cùng giá trị.",
    minBet: (min, pos) => `Tiền cược tối thiểu của tụ ${pos} là ${helpers.numberHelper.formatNumberWithComma(min)}`,
    maxBet: (max, pos) => `Tổng tiền cược tối đa của tụ ${pos} là ${helpers.numberHelper.formatNumberWithComma(max)}`,
    handIsStand: "Tụ đã dừng.",
};
