import { helpers } from "sc-common";

export default {
    invalidHandId: "ID của tay bài này không đúng.",
    handAlreadySplit: "Tay bài này đã được tách bài.",
    cantSplitChildHand: "Không thể tách bài ở tụ con.",
    cantDoubleHand: "Không thể gấp đôi tiền cược.",
    cantHit: "Không thể rút thêm bài.",
    cardsNotEqual: "Hai lá bài không cùng giá trị.",
    minBet: (min) => `Tiền cược tối thiểu của tay bài này là ${helpers.numberHelper.formatNumberWithComma(min)}`,
    maxBet: (max) => `Tổng tiền cược tối đa của tay bài này là ${helpers.numberHelper.formatNumberWithComma(max)}`,
    handIsStand: "Tụ đã dừng.",
    invalidPosition: "Vị trí tụ không đúng.",
    handNotActive: "Tụ chưa tới lượt.",
    cantSplit: "Không thể tách bài.",
    invalidDealHands: "Số lượng tay bài không hợp lệ.",
    invalidDealDueToRunningRound: "Cược không hợp lệ do phiên chưa kết thúc.",
    processingAction: "Đang xử lí, vui lòng đợi trong giây lát."
};
