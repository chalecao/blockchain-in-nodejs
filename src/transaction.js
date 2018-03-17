/**
 * Transaction
 * recipientAddr：收款人地址
 * senderAddr：付款人地址
 * value：交易金额
 */
const state = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
}

export const Transaction = {
    generate: (rec, sen, val) => {
        state.recipientAddr = rec
        state.senderAddr = sen
        state.value = val
        return Object.assign({}, state)
    }

}