const superagent = require('superagent');

const node1 = "A",
    node1_port = 3001,
    node1_url = `http://127.0.0.1:${node1_port}/`,
    node2 = "B",
    node2_port = 3002,
    node2_url = `http://127.0.0.1:${node2_port}/`;

//----------------------------------------注册节点----------------------------------------
superagent
    .post(node1_url + 'nodes')
    .query({
        id: node2,
        url: node2_url
    }).end((err, res) => {
        // Calling the end function will send the request
    });

superagent
    .post(node2_url + 'nodes')
    .query({
        id: node1,
        url: node1_url
    }).end((err, res) => {
        // Calling the end function will send the request
    });


//----------------------------------------创建交易----------------------------------------
superagent
    .get(node1_url + 'blocks').end(function (err, res) {
        console.log(res.text)
    });

superagent
    .get(node1_url + 'transactions').end(function (err, res) {
        console.log(res.text)
    });

//创建交易
superagent
    .post(node1_url + 'transactions')
    .query({
        sendAddr: 'nezha',
        recAddr: 'taizi',
        value: 3
    }).end((err, res) => {
        // Calling the end function will send the request
    });

superagent
    .post(node1_url + 'transactions')
    .query({
        sendAddr: 'longwang',
        recAddr: 'taizi',
        value: 4
    }).set('accept', 'json')
    .end((err, res) => {
        // Calling the end function will send the request
    });

superagent
    .get(node1_url + 'transactions').end(function (err, res) {
        console.log(res.text)
    });
//----------------------------------------节点1挖矿，挖三次----------------------------------------
superagent.get(node1_url + 'mine').end(function (err, res) {
    // 抛错拦截
    if (err) {
        console.log(err);
    }
    // 等待 code
    console.log(res.text)
});
superagent.get(node1_url + 'mine').end(function (err, res) {
    // 抛错拦截
    if (err) {
        console.log(err);
    }
    // 等待 code
    console.log(res.text)
});
superagent.get(node1_url + 'mine').end(function (err, res) {
    // 抛错拦截
    if (err) {
        console.log(err);
    }
    // 等待 code
    console.log(res.text)

    //----------------------------------------consensus节点同步----------------------------------------
    superagent
        .put(node1_url + 'nodes/consensus')
        .end((err, res) => {
            // Calling the end function will send the request
            superagent
                .get(node1_url + 'blocks').end(function (err, res) {
                    console.log(node1_url, res.text)
                });
        });
    superagent
        .put(node2_url + 'nodes/consensus')
        .end((err, res) => {
            // Calling the end function will send the request
            //------------------------------- 查看node2是否同步--------------------------------------------
            superagent
                .get(node2_url + 'blocks').end(function (err, res) {
                    console.log(node2_url, res.text)
                });
        });

});
