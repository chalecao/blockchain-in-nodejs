/**
 * Block
 * @blockNumber: 区块id
 * @transaction：交易记录列表
 */
import { sha256 } from "js-sha256"
const state = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
}

export const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock) => {
        state.blockNumber = blockNumber
        state.transaction = transaction
        state.timestamp = Date.now()
        state.nonce = nonce
        state.prevBlock = prevBlock
        return Object.assign({},state)
    },
    computeSha256:(state)=>{
        return sha256(JSON.stringify(state))
    }
}