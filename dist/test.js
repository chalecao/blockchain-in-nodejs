'use strict';

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
const state$1 = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
};

const Transaction = {
    generate: (rec, sen, val) => {
        state$1.recipientAddr = rec;
        state$1.senderAddr = sen;
        state$1.value = val;
        return Object.assign({}, state$1);
    }

};

/**
 * Block
 * @blockNumber: 区块id
 * @transaction：交易记录列表
 */
const state$2 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

const Block$1 = {
    generate: (blockNumber, transaction, nonce, prevBlock, timestamp) => {
        state$2.blockNumber = blockNumber;
        state$2.transaction = JSON.stringify(transaction);
        state$2.timestamp = timestamp || Date.now();
        state$2.nonce = nonce;
        state$2.prevBlock = prevBlock;
        return Object.assign({}, state$2);
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
const state$3 = {
    id: 0,
    url: ""
};

const NodeAction = {
    generate: (id, url) => {
        state$3.id = id;
        state$3.url = url;
        return _extends({}, state$3);
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
const state$4 = {
    nodeId: 0,
    blocks: [],
    nodes: [],
    transactionPool: [],
    genesisBlock: Block$1.generate(0, [], 0, "", 1),
    target: Math.pow(2, 256 - difficulty),
    storagePath: ""
};

const BlockChain = {
    init: id => {
        state$4.nodeId = id;
        state$4.storagePath = path.resolve(__dirname, "../data/", `${state$4.nodeId}.blockchain`);
        state$4.blocks.push(state$4.genesisBlock);
    },
    register: (id, url) => {
        if (state$4.nodes.find(item => item.id == id)) {
            return false;
        } else {
            state$4.nodes.push(NodeAction.generate(id, url));
            return true;
        }
    },

    getNodes: () => {
        return state$4.nodes;
    },
    getBlocks: () => {
        return state$4.blocks;
    },

    load: () => {
        try {
            state$4.blocks = JSON.parse(fs.readFileSync(state$4.storagePath, "utf-8"));
        } catch (e) {
            state$4.blocks = [state$4.genesisBlock];
        }

        try {
            state$4.blocks = JSON.parse(fs.readFileSync(state$4.storagePath, "utf-8"));
        } catch (e) {
            console.log("read error, init blocks");
            state$4.blocks = [state$4.genesisBlock];
        } finally {
            BlockChain.verify(state$4.blocks);
        }
    },
    save: () => {

        fs.writeFileSync(state$4.storagePath, JSON.stringify(state$4.blocks), "utf-8");
    },
    verify: blocks => {
        try {
            if (!blocks.length) {
                console.log("blocks can't be empty!");
                throw new Error("blocks can't be empty!");
            }

            if (JSON.stringify(state$4.genesisBlock) != JSON.stringify(blocks[0])) {
                throw new Error("genesis block data error!");
            }

            blocks.forEach((item, index) => {
                //verify prevBlock
                if (index > 0 && item.prevBlock != Block$1.computeSha256(blocks[index - 1])) {
                    throw new Error("invalid prev block sha256");
                }

                if (index > 0 && !BlockChain.idPowValid(Block$1.computeSha256(item))) {
                    console.log("---item---", item);
                    console.log("---item---", Block$1.computeSha256(item));
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
        console.log(candidateIndex, maxLength, BlockChain.verify(state$4.blocks));
        if (candidateIndex >= 0 && (maxLength >= state$4.blocks.length || !BlockChain.verify(state$4.blocks))) {
            state$4.blocks = [...blockChains[candidateIndex]];
            BlockChain.save();
            return true;
        }
        return false;
    },
    submitTransaction: (send, rec, val) => {
        state$4.transactionPool.push(Transaction.generate(send, rec, val));
    },
    getTransaction: () => {
        return state$4.transactionPool;
    },
    idPowValid: pow => {
        try {
            if (!pow.startsWith("0x")) {
                pow = "0x" + pow;
            }
            console.log(new bignumber_js.BigNumber(pow));
            console.log(state$4.target);
            return new bignumber_js.BigNumber(pow).isLessThanOrEqualTo(state$4.target);
        } catch (e) {
            console.log(e);
            return false;
        }
    },
    mineBlock: (transactions = []) => {
        let lastBlock = state$4.blocks[state$4.blocks.length - 1];

        transactions = [Transaction.generate(COINBASE_SENDER, state$4.nodeId, COINBASE_REWARD), ...transactions];

        const newBlock = Block$1.generate(lastBlock.blockNumber + 1, transactions, 0, Block$1.computeSha256(lastBlock));
        while (true) {
            let sha = Block$1.computeSha256(newBlock);
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

        state$4.blocks.push(newBlock);
        BlockChain.transactionPool = [];
        BlockChain.save();
        return newBlock;
    }

};

//mine block
const mineBlock = () => {
    BlockChain.init(1000);
    BlockChain.submitTransaction("aa", "bb", 100);
    BlockChain.submitTransaction("cc", "dd", 200);
    BlockChain.mineBlock(BlockChain.getTransaction());
};

mineBlock();
