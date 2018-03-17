'use strict';

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
var state$1 = {
    recipientAddr: "",
    senderAddr: "",
    value: 0
};

var Transaction = {
    generate: function generate(rec, sen, val) {
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
var state$2 = {
    blockNumber: 0,
    transaction: [],
    timestamp: Date.now(),
    nonce: 0,
    prevBlock: ""
};

var Block$1 = {
    generate: function generate(blockNumber, transaction, nonce, prevBlock) {
        state$2.blockNumber = blockNumber;
        state$2.transaction = transaction;
        state$2.timestamp = Date.now();
        state$2.nonce = nonce;
        state$2.prevBlock = prevBlock;
        return Object.assign({}, state$2);
    },
    computeSha256: function computeSha256(state) {
        return jsSha256.sha256(JSON.stringify(state));
    }
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var COINBASE_SENDER = "<COINBASE>";
var COINBASE_REWARD = 50;

var difficulty = 4;
var state$3 = {
    nodeId: 0,
    blocks: [],
    transactionPool: [],
    genesisBlock: Block$1.generate(0, [], 0, ""),
    target: Math.pow(2, 256 - difficulty),
    storagePath: ""
};

var BlockChain = {
    init: function init(id) {
        state$3.nodeId = id;
        state$3.storagePath = path.resolve(__dirname, "../data/", state$3.nodeId + '.blockchain');
        state$3.blocks.push(state$3.genesisBlock);
    },
    getBlocks: function getBlocks() {
        return state$3.blocks;
    },
    load: function load() {
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
            BlockChain.verify();
        }
    },
    save: function save() {

        fs.writeFileSync(state$3.storagePath, JSON.stringify(state$3.blocks), "utf-8");
    },
    verify: function verify() {
        if (!state$3.blocks.length) {
            console.log("blocks can't be empty!");
        }
        if (JSON.stringify(state$3.genesisBlock) != JSON.stringify(state$3.blocks[0])) {
            throw new Error("genesis block data error!");
        }

        state$3.blocks.forEach(function (item, index) {
            //verify prevBlock
            if (index > 0 && item.prevBlock != Block$1.computeSha256(state$3.blocks[index - 1])) {
                throw new Error("invalid prev block sha256");
            }
            if (!BlockChain.idPowValid(Block$1.computeSha256(item))) {
                throw new Error("invalid pow");
            }
        });
    },
    submitTransaction: function submitTransaction(send, rec, val) {
        state$3.transactionPool.push(Transaction.generate(send, rec, val));
    },
    getTransaction: function getTransaction() {
        return state$3.transactionPool;
    },
    idPowValid: function idPowValid(pow) {
        try {
            if (pos.startswith("0x")) {
                pos = "0x" + pos;
            }
            return new bignumber.BigNumber(pow).lessThanOrEqual(state$3.target);
        } catch (e) {
            return false;
        }
    },
    mineBlock: function mineBlock() {
        var transactions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        var lastBlock = state$3.blocks[state$3.blocks.length - 1];
        transactions = [Transaction.generate(COINBASE_SENDER, state$3.nodeId, COINBASE_REWARD)].concat(_toConsumableArray(transactions));
        var newBlock = Block$1.generate(lastBlock.blockNumber + 1, transactions, 0, Block$1.computeSha256(lastBlock));
        while (true) {
            var sha = Block$1.computeSha256(newBlock);
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

//mine block
var mineBlock = function mineBlock() {
    BlockChain.init(1000);
    BlockChain.submitTransaction("aa", "bb", 100);
    BlockChain.submitTransaction("cc", "dd", 200);
    BlockChain.mineBlock(BlockChain.getTransaction());
};

mineBlock();
