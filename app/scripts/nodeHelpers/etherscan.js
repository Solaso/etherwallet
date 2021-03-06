'use strict';
var etherscan = function() {}
etherscan.SERVERURL = "https://api.etherscan.io/api";
etherscan.pendingPosts = [];
etherscan.config = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
};

etherscan.getCurrentBlock = function(callback) {
    this.post({
        module: 'proxy',
        action: 'eth_blockNumber'
    }, function(data) {
        if (data.error) callback({ error: true, msg: data.error.message, data: '' });
        else callback({ error: false, msg: '', data: new BigNumber(data.result).toNumber().toString() });
    });
}
etherscan.getBalance = function(addr, callback) {
    this.post({
        module: 'account',
        action: 'balance',
        address: addr,
        tag: 'latest'
    }, function(data) {
        if (data.message != 'OK') callback({ error: true, msg: data.message, data: '' });
        else callback({ error: false, msg: '', data: { address: addr, balance: data.result } });
    });
}
etherscan.getTransactionData = function(addr, callback) {
    var response = { error: false, msg: '', data: { address: addr, balance: '', gasprice: '', nonce: '' } };
    var parentObj = this;
    try {
        parentObj.getBalance(addr, function(data) {
            if (data.error) throw data.msg;
            response.data.balance = data.data.balance;
            parentObj.post({
                module: 'proxy',
                action: 'eth_gasPrice'
            }, function(data) {
                response.data.gasprice = data.result;
                parentObj.post({
                    module: 'proxy',
                    address: addr,
                    action: 'eth_getTransactionCount',
                    tag: 'latest'
                }, function(data) {
                    response.data.nonce = data.result;
                    callback(response);
                });
            });
        });
    } catch (e) {
        callback({ error: true, msg: e, data: '' });
    }
}
etherscan.sendRawTx = function(rawTx, callback) {
    this.post({
        module: 'proxy',
        action: 'eth_sendRawTransaction',
        hex: rawTx
    }, function(data) {
        if (data.error) callback({ error: true, msg: data.error.message, data: '' });
        else callback({ error: false, msg: '', data: data.result });
    });
}
etherscan.getEstimatedGas = function(txobj, callback) {
    this.post({
        module: 'proxy',
        action: 'eth_estimateGas',
        to: txobj.to,
        value: txobj.value,
        data: txobj.data
    }, function(data) {
        if (data.error) callback({ error: true, msg: data.error.message, data: '' });
        else callback({ error: false, msg: '', data: data.result });
    });
}
etherscan.getEthCall = function(txobj, callback) {
    this.post({
        module: 'proxy',
        action: 'eth_call',
        to: txobj.to,
        data: txobj.data
    }, function(data) {
        if (data.error) callback({ error: true, msg: data.error.message, data: '' });
        else callback({ error: false, msg: '', data: data.result });
    });
}
etherscan.queuePost = function() {
    var data = this.pendingPosts[0].data;
    var callback = this.pendingPosts[0].callback;
    var parentObj = this;
    ajaxReq.http.post(this.SERVERURL, ajaxReq.postSerializer(data), this.config).then(function(data) {
        callback(data.data);
        parentObj.pendingPosts.splice(0, 1);
        if (parentObj.pendingPosts.length > 0) parentObj.queuePost();
    });
}
etherscan.post = function(data, callback) {
    this.pendingPosts.push({
        data: data,
        callback: function(_data) {
            callback(_data);
        }
    });
    if (this.pendingPosts.length == 1) this.queuePost();
}
module.exports = etherscan;
