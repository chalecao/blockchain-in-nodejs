/**
 * Block Chain
 * @nodeId: id
 * @blocks: block list
 * @transactionPool：交易池
 */
import { Transaction } from './transaction'
import { Block } from "./block"
import { NodeAction } from "./node"
import {BigNumber} from 'bignumber.js';

import * as fs from "fs"
import * as path from "path"

const COINBASE_SENDER = "<COINBASE>";
const COINBASE_REWARD = 50;

const difficulty = 1;
const state = {
    nodeId: 0,
    blocks: [],
    nodes: [],
    transactionPool: [],
    genesisBlock: Block.generate(0, [], 0, "", 1),
    target: 2 ** (256 - difficulty),
    storagePath: ""
}

export const BlockChain = {
    init: (id) => {
        state.nodeId = id
        state.storagePath = path.resolve(__dirname, "../data/", `${state.nodeId}.blockchain`)
        state.blocks.push(state.genesisBlock)
    },
    register: (id, url) => {
        if (state.nodes.find(item => item.id == id)) {
            return false
        } else {
            state.nodes.push(NodeAction.generate(id, url))
            return true
        }
    },

    getNodes: () => {
        return state.nodes
    },
    getBlocks: () => {
        return state.blocks
    },

    load: () => {
        try {
            state.blocks = JSON.parse(fs.readFileSync(state.storagePath, "utf-8"))
        } catch (e) {
            state.blocks = [state.genesisBlock]
        }

        try {
            state.blocks = JSON.parse(fs.readFileSync(state.storagePath, "utf-8"))
        } catch (e) {
            console.log("read error, init blocks")
            state.blocks = [state.genesisBlock]
        } finally {
            BlockChain.verify(state.blocks)
        }
    },
    save: () => {

        fs.writeFileSync(state.storagePath, JSON.stringify(state.blocks), "utf-8")
    },
    verify: (blocks) => {
        try {
            if (!blocks.length) {
                console.log("blocks can't be empty!")
                throw new Error("blocks can't be empty!")
            }
            
            if (JSON.stringify(state.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("genesis block data error!")
            }

            blocks.forEach((item, index) => {
                //verify prevBlock
                if (index > 0 && item.prevBlock != Block.computeSha256(blocks[index - 1])) {
                    throw new Error("invalid prev block sha256")
                }
               
                if (index > 0 && !BlockChain.idPowValid(Block.computeSha256(item))) {
                    console.log("---item---", item)
                    console.log("---item---", Block.computeSha256(item))
                    throw new Error("invalid pow")
                }
            })
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }
    },
    consensus: (blockChains) => {
        let maxLength = 0, candidateIndex = -1;
        blockChains.forEach((item, index) => {
            console.log("--------------------consensus-----------", item, BlockChain.verify(item))

            if (item.length < maxLength) {

            } else if (BlockChain.verify(item)) {
                maxLength = item.length;
                candidateIndex = index;
            }
        })
        console.log(candidateIndex, maxLength, BlockChain.verify(state.blocks))
        if (candidateIndex >= 0 && (maxLength >= state.blocks.length || !BlockChain.verify(state.blocks))) {
            state.blocks = [...blockChains[candidateIndex]]
            BlockChain.save()
            return true
        }
        return false
    },
    submitTransaction: (send, rec, val) => {
        state.transactionPool.push(Transaction.generate(send, rec, val))
    },
    getTransaction: () => {
        return state.transactionPool
    },
    idPowValid: (pow) => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow
            }
            console.log(new BigNumber(pow))
            console.log(state.target)
            return new BigNumber(pow).isLessThanOrEqualTo(state.target)
        } catch (e) {
            console.log(e)
            return false
        }
    },
    mineBlock: (transactions = []) => {
        let lastBlock = state.blocks[state.blocks.length - 1]

        transactions = [Transaction.generate(COINBASE_SENDER, state.nodeId, COINBASE_REWARD), ...transactions]

        const newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.computeSha256(lastBlock))
        while (true) {
            let sha = Block.computeSha256(newBlock)
            // console.log("mine block with nonce", newBlock.nonce)
            if (BlockChain.idPowValid(sha) || newBlock.nonce > 1000) {
                console.log("find block", sha)
                break;
            }
            newBlock.nonce++
        }

        return newBlock;
    },
    createBlock: () => {
        const newBlock = BlockChain.mineBlock(state.transactionPool)

        state.blocks.push(newBlock)
        state.transactionPool = []
        BlockChain.save()
        return newBlock
    }

}
