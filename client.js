const superagent = require('superagent');

//创建交易
superagent
    .get('http://127.0.0.1:3000/blocks').end(function (err, res) {
        console.log(res.text)
    });

superagent
    .get('http://127.0.0.1:3000/transactions').end(function (err, res) {
        console.log(res.text)
    });

//创建交易
superagent
    .post('http://127.0.0.1:3000/transactions')
    .query({
        sendAddr: 'nezha',
        recAddr: 'taizi',
        value: 3
    }).end((err, res) => {
        // Calling the end function will send the request
    });

superagent
    .post('http://127.0.0.1:3000/transactions')
    .query({
        sendAddr: 'longwang',
        recAddr: 'taizi',
        value: 4
    }).set('accept', 'json')
    .end((err, res) => {
        // Calling the end function will send the request
    });

superagent
    .get('http://127.0.0.1:3000/transactions').end(function (err, res) {
        console.log(res.text)
    });
// 挖矿
superagent.get('http://127.0.0.1:3000/mine').end(function (err, res) {
    // 抛错拦截
    if (err) {
        console.log(err);
    }
    // 等待 code
    console.log(res.text)
});