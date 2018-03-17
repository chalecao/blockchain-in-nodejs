
// 在koa2中，我们导入的是一个class，因此用大写的Koa表示:
const Koa = require('koa');
const args = require('args');

args
    .option('port', 'The port on which the app will be running', 3000)

const flags = args.parse(process.argv)

// 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

const blockChain = require('./dist/blockChain').BlockChain

// 创建一个Koa对象表示web app本身:
const app = new Koa();

//初始化blockChain
blockChain.init(1000)

// log request URL:
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// add url-route:
router.get('/blocks', async (ctx, next) => {
    console.log(JSON.stringify(blockChain.getBlocks()))
    ctx.response.body = JSON.stringify(blockChain.getBlocks());
});

router.get('/blocks/:id', async (ctx, next) => {
    var id = ctx.params.id;
    if (id == null) {
        console.log("invalid parameter")
        ctx.response.body = "invalid parameter"
    }
    let blocks = blockChain.getBlocks();
    if (+id > blocks.length) {
        console.log("block wasn't found!")
        ctx.response.body = "block wasn't found!"
    } else {
        ctx.response.body = JSON.stringify(blocks[+id]);
    }

});
//transactions
router.get('/transactions', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getTransaction());
});
router.post('/transactions', async (ctx, next) => {

    var sendAddr = ctx.query.sendAddr || '',
        recAddr = ctx.query.recAddr || '',
        value = +ctx.query.value || 0;

    if (!sendAddr || !recAddr || !value) {
        ctx.response.body = "invalid parameter"
    } else {
        console.log("receive data", sendAddr, recAddr, value)

        blockChain.submitTransaction(sendAddr, recAddr, value)
        ctx.response.body = `transactions from ${sendAddr} to ${recAddr} of ${value} successfully`;
    }
});
//nodes
router.get('/nodes', async (ctx, next) => {
    ctx.response.body = JSON.stringify(blockChain.getNodes());
});
router.post('/nodes', async (ctx, next) => {

    var nodeId = ctx.query.id,
        nodeUrl = ctx.query.url || '';

    if (!nodeId || !nodeUrl) {
        ctx.response.body = "invalid parameter"
    } else {
        console.log("receive data", nodeId, nodeUrl)
        if (blockChain.register(nodeId, nodeUrl)) {
            ctx.response.body = `register node ${nodeId} `;
        } else {
            ctx.response.body = `register node already exists！ `;
        }
    }
});
//consensus
router.put('/nodes/consensus', async (ctx, next) => {
    let reqs = blockChain.getNodes().map(node => axios.get(`${node.url}blocks`))
    if (!reqs.length) {
        ctx.response.body = `no node need to sync！ `;
    } else {
        await axios.all(reqs).then(axios.spread((...blockChains) => {
            if (blockChain.consensus(blockChains)) {
                ctx.response.body = `get consensus！ `;
            } else {
                ctx.response.body = `no consensus get！ `;
            }
        }))
    }
});

router.get('/mine', async (ctx, next) => {
    const newBlock = blockChain.mineBlock(blockChain.getTransaction())
    ctx.response.body = `mine new block ${newBlock.blockNumber} `;
});

// add router middleware:
app.use(router.routes());

app.listen(flags.port);
console.log(`app started at port ${flags.port}...`);