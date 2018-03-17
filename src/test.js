import { BlockChain } from "./blockChain"
// test pow
const testPow = () => {
    let blockData = Block.generate(0, [], 1, "")
    let sha = Block.computeSha256(blockData)
    console.log(sha)
    console.log(state.target)
    console.log(BlockChain.idPowValid(sha))
}

//mine block
const mineBlock = () => {
    BlockChain.init(1000)
    BlockChain.submitTransaction("aa", "bb", 100)
    BlockChain.submitTransaction("cc", "dd", 200)
    BlockChain.mineBlock(BlockChain.getTransaction())
}

mineBlock()