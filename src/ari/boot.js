// boot.js - bootstrap script with global data
var randomHash = function (size) {
    var digits = "0123456789abcdef";
    return '0x' + Array(size).fill(0)
        .map(function () { return digits[Math.floor(Math.random() * digits.length)]; })
        .join('');
};
var tokenData = {
    projectId: 1,
    tokenId: 1,
    hash: randomHash(64) // Array(64).fill("b").join("")
};
var tokenState = {
    repeatTime: 60,
    alive: false,
    speed: 10
};
