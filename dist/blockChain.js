'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsSha256 = require('js-sha256');
var bignumber_js = require('bignumber.js');
var fs = require('fs');
var path = require('path');

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
};

const Transaction = {
    generate: (rec, sen, val) => {
        state.recipientAddr = rec;
        state.senderAddr = sen;
        state.value = val;
        return Object.assign({}, state);
    }

};

/**
 * Block
 * @blockNumber: 区块id
 * @transaction：交易记录列表
 */
const state$1 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

const Block = {
    generate: (blockNumber, transaction, nonce, prevBlock, timestamp) => {
        state$1.blockNumber = blockNumber;
        state$1.transaction = JSON.stringify(transaction);
        state$1.timestamp = timestamp || Date.now();
        state$1.nonce = nonce;
        state$1.prevBlock = prevBlock;
        return Object.assign({}, state$1);
    },
    computeSha256: state => {
        return jsSha256.sha256(JSON.stringify(state));
    }
};

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * 节点数据结构
 * @id: 节点id
 * @url: 节点url
 */
const state$2 = {
    id: 0,
    url: ""
};

const NodeAction = {
    generate: (id, url) => {
        state$2.id = id;
        state$2.url = url;
        return _extends({}, state$2);
    }
};

/**
 * Block Chain
 * @nodeId: id
 * @blocks: block list
 * @transactionPool：交易池
 */

const COINBASE_SENDER = "<COINBASE>";
const COINBASE_REWARD = 50;

const difficulty = 1;
const state$3 = {
    nodeId: 0,
    blocks: [],
    nodes: [],
    transactionPool: [],
    genesisBlock: Block.generate(0, [], 0, "", 1),
    target: Math.pow(2, 256 - difficulty),
    storagePath: ""
};

const BlockChain = {
    init: id => {
        state$3.nodeId = id;
        state$3.storagePath = path.resolve(__dirname, "../data/", `${state$3.nodeId}.blockchain`);
        state$3.blocks.push(state$3.genesisBlock);
    },
    register: (id, url) => {
        if (state$3.nodes.find(item => item.id == id)) {
            return false;
        } else {
            state$3.nodes.push(NodeAction.generate(id, url));
            return true;
        }
    },

    getNodes: () => {
        return state$3.nodes;
    },
    getBlocks: () => {
        return state$3.blocks;
    },

    load: () => {
        try {
            state$3.blocks = JSON.parse(fs.readFileSync(state$3.storagePath, "utf-8"));
        } catch (e) {
            state$3.blocks = [state$3.genesisBlock];
        }

        try {
            state$3.blocks = JSON.parse(fs.readFileSync(state$3.storagePath, "utf-8"));
        } catch (e) {
            console.log("read error, init blocks");
            state$3.blocks = [state$3.genesisBlock];
        } finally {
            BlockChain.verify(state$3.blocks);
        }
    },
    save: () => {

        fs.writeFileSync(state$3.storagePath, JSON.stringify(state$3.blocks), "utf-8");
    },
    verify: blocks => {
        try {
            if (!blocks.length) {
                console.log("blocks can't be empty!");
                throw new Error("blocks can't be empty!");
            }

            if (JSON.stringify(state$3.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("genesis block data error!");
            }

            blocks.forEach((item, index) => {
                //verify prevBlock
                if (index > 0 && item.prevBlock != Block.computeSha256(blocks[index - 1])) {
                    throw new Error("invalid prev block sha256");
                }

                if (index > 0 && !BlockChain.idPowValid(Block.computeSha256(item))) {
                    console.log("---item---", item);
                    console.log("---item---", Block.computeSha256(item));
                    throw new Error("invalid pow");
                }
            });
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    consensus: blockChains => {
        let maxLength = 0,
            candidateIndex = -1;
        blockChains.forEach((item, index) => {
            console.log("--------------------consensus-----------", item, BlockChain.verify(item));

            if (item.length < maxLength) {} else if (BlockChain.verify(item)) {
                maxLength = item.length;
                candidateIndex = index;
            }
        });
        console.log(candidateIndex, maxLength, BlockChain.verify(state$3.blocks));
        if (candidateIndex >= 0 && (maxLength >= state$3.blocks.length || !BlockChain.verify(state$3.blocks))) {
            state$3.blocks = [...blockChains[candidateIndex]];
            BlockChain.save();
            return true;
        }
        return false;
    },
    submitTransaction: (send, rec, val) => {
        state$3.transactionPool.push(Transaction.generate(send, rec, val));
    },
    getTransaction: () => {
        return state$3.transactionPool;
    },
    idPowValid: pow => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow;
            }
            console.log(new bignumber_js.BigNumber(pow));
            console.log(state$3.target);
            return new bignumber_js.BigNumber(pow).isLessThanOrEqualTo(state$3.target);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    mineBlock: (transactions = []) => {
        let lastBlock = state$3.blocks[state$3.blocks.length - 1];

        transactions = [Transaction.generate(COINBASE_SENDER, state$3.nodeId, COINBASE_REWARD), ...transactions];

        const newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.computeSha256(lastBlock));
        while (true) {
            let sha = Block.computeSha256(newBlock);
            // console.log("mine block with nonce", newBlock.nonce)
            if (BlockChain.idPowValid(sha) || newBlock.nonce > 1000) {
                console.log("find block", sha);
                break;
            }
            newBlock.nonce++;
        }

        return newBlock;
    },
    createBlock: () => {
        const newBlock = BlockChain.mineBlock(BlockChain.transactionPool);

        state$3.blocks.push(newBlock);
        BlockChain.transactionPool = [];
        BlockChain.save();
        return newBlock;
    }

};

exports.BlockChain = BlockChain;
