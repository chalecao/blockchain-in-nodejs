'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsSha256 = require('js-sha256');
var bignumber = require('bignumber');
var fs = require('fs');
var path = require('path');

/**
 * Transaction
 * recipientAddr：收款人地址
 * senderAddr：付款人地址
 * value：交易金额
 */
var state = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
};

var Transaction = {
    generate: function generate(rec, sen, val) {
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
var state$1 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

var Block = {
    generate: function generate(blockNumber, transaction, nonce, prevBlock) {
        state$1.blockNumber = blockNumber;
        state$1.transaction = transaction;
        state$1.timestamp = Date.now();
        state$1.nonce = nonce;
        state$1.prevBlock = prevBlock;
        return Object.assign({}, state$1);
    },
    computeSha256: function computeSha256(state) {
        return jsSha256.sha256(JSON.stringify(state));
    }
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var COINBASE_SENDER = "<COINBASE>";
var COINBASE_REWARD = 50;

var difficulty = 4;
var state$2 = {
    nodeId: 0,
    blocks: [],
    transactionPool: [],
    genesisBlock: Block.generate(0, [], 0, ""),
    target: Math.pow(2, 256 - difficulty),
    storagePath: ""
};

var BlockChain = {
    init: function init(id) {
        state$2.nodeId = id;
        state$2.storagePath = path.resolve(__dirname, "../data/", state$2.nodeId + '.blockchain');
        state$2.blocks.push(state$2.genesisBlock);
    },
    getBlocks: function getBlocks() {
        return state$2.blocks;
    },
    load: function load() {
        try {
            state$2.blocks = JSON.parse(fs.readFileSync(state$2.storagePath, "utf-8"));
        } catch (e) {
            state$2.blocks = [state$2.genesisBlock];
        }

        try {
            state$2.blocks = JSON.parse(fs.readFileSync(state$2.storagePath, "utf-8"));
        } catch (e) {
            console.log("read error, init blocks");
            state$2.blocks = [state$2.genesisBlock];
        } finally {
            BlockChain.verify();
        }
    },
    save: function save() {

        fs.writeFileSync(state$2.storagePath, JSON.stringify(state$2.blocks), "utf-8");
    },
    verify: function verify() {
        if (!state$2.blocks.length) {
            console.log("blocks can't be empty!");
        }
        if (JSON.stringify(state$2.genesisBlock) != JSON.stringify(state$2.blocks[0])) {
            throw new Error("genesis block data error!");
        }

        state$2.blocks.forEach(function (item, index) {
            //verify prevBlock
            if (index > 0 && item.prevBlock != Block.computeSha256(state$2.blocks[index - 1])) {
                throw new Error("invalid prev block sha256");
            }
            if (!BlockChain.idPowValid(Block.computeSha256(item))) {
                throw new Error("invalid pow");
            }
        });
    },
    submitTransaction: function submitTransaction(send, rec, val) {
        state$2.transactionPool.push(Transaction.generate(send, rec, val));
    },
    getTransaction: function getTransaction() {
        return state$2.transactionPool;
    },
    idPowValid: function idPowValid(pow) {
        try {
            if (pos.startswith("0x")) {
                pos = "0x" + pos;
            }
            return new bignumber.BigNumber(pow).lessThanOrEqual(state$2.target);
        } catch (e) {
            return false;
        }
    },
    mineBlock: function mineBlock() {
        var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        var lastBlock = state$2.blocks[state$2.blocks.length - 1];
        transactions = [Transaction.generate(COINBASE_SENDER, state$2.nodeId, COINBASE_REWARD)].concat(_toConsumableArray(transactions));
        var newBlock = Block.generate(lastBlock.blockNumber + 1, transactions, 0, Block.computeSha256(lastBlock));
        while (true) {
            var sha = Block.computeSha256(newBlock);
            console.log("mine block with nonce", newBlock.nonce);
            if (BlockChain.idPowValid(sha) || newBlock.nonce > 1000) {
                console.log("find block", sha);
                break;
            }
            newBlock.nonce++;
        }

        return newBlock;
    },
    createBlock: function createBlock() {
        var newBlock = BlockChain.mineBlock(BlockChain.transactionPool);
        BlockChain.blocks.push(newBlock);
        BlockChain.transactionPool = [];
        BlockChain.save();
        return newBlock;
    }

};

exports.BlockChain = BlockChain;
