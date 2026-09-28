// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// traits.js - convert hash to set of traits
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------
const u64 = (n) => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
/**
 * xoshiro is a variation of the shift-register generator, using rotations in
 *   addition to shifts.
 *
 * Algorithm by [Blackmanand Vigna 2018]
 *   https://prng.di.unimi.it/xoshiro256starstar
 *
 */
const xoshiro256strstr = (s) => () => {
    const result = u64(rotl(u64(s[1] * 5n), 7n) * 9n);
    const t = u64(s[1] << 17n);
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 45n);
    return result;
};
//-----------------------------------------------------------------------------
/**
 * Returns a float between [0, 1) (inclusive of 0, exclusive of 1).
 */
const randomDecimal = (xss) => () => {
    const t = xss();
    return Number(t % 9007199254740991n) / 9007199254740991;
};
//-----------------------------------------------------------------------------
/**
 * Returns a float between a and b.
 */
const randomNumber = (r) => (a, b) => a + (b - a) * r();
//-----------------------------------------------------------------------------
/**
 * Returns an int between a and b.
 */
const randomInt = (rn) => (a, b) => Math.floor(rn(a, b + 1));
//-----------------------------------------------------------------------------
/**
 * Seeds the randomization functions.
 */
const mkRandom = (hash) => {
    const s = Array(4).fill(0)
        .map((_, i) => i * 16 + 2)
        .map(idx => u64(BigInt(`0x${hash.slice(idx, idx + 16)}`)));
    const xss = xoshiro256strstr(s);
    const r = randomDecimal(xss);
    const rn = randomNumber(r);
    const ri = randomInt(rn);
    return { r, rn, ri };
};
//-----------------------------------------------------------------------------
/**
 * Randomly _shuffle and array of element.
 */
const _shuffle = (array, r) => {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(r() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
};
//-----------------------------------------------------------------------------
/**
 * Return an array of size n filled with item.
 */
const repeat = (item, n) => Array.from({ length: n }).map(_ => item);
//-----------------------------------------------------------------------------
/**
 * Returns a random element from the array.
 */
function selectRandom(array, r) {
    return array[Math.floor(r() * array.length)];
}
//-----------------------------------------------------------------------------
/**
 * Randomly select a key from a distribution map of values.
 *
 *  DistMap should be of the form:
 *
 *    const distMap = {
 *      banana .4,
 *      apple: .3,
 *      pear:  .2,
 *      kiwi:  .1
 *    };
 *
 *   The values should add up to 1 (won't fail if it doesn't but selection will
 *     be off from what you expect).  The above should return a distribution of
 *     40% bananas, 30% apples, 20% pears, 10% kiwis.
 *
 */
const selectRandomDist = (dist, r) => {
    const keys = Object.keys(dist)
        .reduce((a, k) => a.concat(repeat(k, dist[k] * 100)), []);
    return selectRandom(_shuffle(keys, r), r);
};
//-----------------------------------------------------------------------------
/**
 * Convert from int to padded hex (for colors).
 */
const toHex = (x) => x.toString(16).padStart(2, '0');
const fromHex = (hex) => parseInt(hex, 16);
//-----------------------------------------------------------------------------
const randomColorHex = (r) => {
    const rc = () => toHex(Math.floor(r() * 256));
    const red = rc();
    const green = rc();
    const blue = rc();
    return `#${red}${green}${blue}`;
};
const shapeDist = {
    square: .6,
    circle: .4
};
//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------
const options_spirals = [1, 3, 5];
const hashToTraits = (hash) => {
    // setup random fns
    const R = mkRandom(hash);
    const maxH = R.ri(0, 360);
    const minH = R.ri(0, maxH);
    const maxB = R.ri(0, 100);
    const minB = R.ri(0, maxB);
    const maxS = R.ri(0, 100);
    const minS = R.ri(0, maxS);
    return {
        spirals: selectRandom(options_spirals, R.r),
        rotationSpeed: R.rn(0.01, 0.1),
        circleSize: R.ri(2, 25),
        angle: R.rn(9, 180),
        rotation: R.rn(-1, 1),
        backgroundColor: {
            h: R.rn(0, 360),
            s: R.rn(0, 100),
            b: R.rn(0, 100)
        },
        hSpeed: R.rn(0, 1),
        circleCircumference: R.ri(2, 8),
        minH: minH,
        maxH: maxH,
        minS: minS,
        maxS: maxS,
        minB: minB,
        maxB: maxB
    };
};

/// <reference path="../node_modules/@types/p5/global.d.ts" />
/// <reference path="traits.ts" />
/// <reference path="token.d.ts" />
// number of iterations
let n = 0;
// keep track of color map
let start = 0;
// true = spiral out 
// false spiral back
let increment = true;
// // the size at which we spiral outwards
// const circleSize = 25 // max 25? 2 -> 25
// // 137.5 is the best but other cool patterns too
// const angle =  30.3 //9.3 // 275.2  137.5 135 144 120 , 137.5
// const circleCircumference = 8 // range 2 -> 8
// // 1 -> 0 cap at like 0.01 anything less is 0
// const rotation = 0.08
// // 360, 100, 100
// const backgroundColor = [0, 0, 0]
// // speed at which the h number of the color moves at
// // 0 -> 1
// const hSpeed = 0.3
const n_max = 1000; // semes to be a good #
const n_min = 10;
let traits;
function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    colorMode(HSB);
    traits = hashToTraits(tokenData.hash);
    console.log(JSON.stringify(traits));
}
function draw() {
    const widthM = width / 2;
    const heightM = height / 2;
    const { spirals, rotationSpeed, circleSize, angle, circleCircumference, backgroundColor, hSpeed, rotation, minH, maxH, minS, maxS, minB, maxB } = traits;
    const { h, s, b } = backgroundColor;
    background(h, s, b);
    translate(widthM, heightM);
    // use n or start and random - or positive?
    rotate(start * rotation);
    for (let i = 0; i < n; i++) {
        const a = i * angle;
        const r = circleSize * sqrt(i);
        const x = r * cos(a);
        const y = r * sin(a);
        const huTemp = sin(start + i * hSpeed);
        const hu = map(huTemp, -1, 1, minH, maxH);
        const su = map(huTemp, -1, 1, minS, maxS);
        const bu = map(huTemp, -1, 1, minB, maxB);
        fill(hu, su, bu);
        noStroke();
        ellipse(x, y, circleCircumference);
        if (spirals >= 3) {
            ellipse(x - widthM / 2, y - heightM / 2, circleCircumference);
            ellipse(x + widthM / 2, y + heightM / 2, circleCircumference);
        }
        if (spirals === 5) {
            ellipse(x + widthM / 2, y - heightM / 2, circleCircumference);
            ellipse(x - widthM / 2, y + heightM / 2, circleCircumference);
        }
    }
    if (increment) {
        n += 5; // todo increment random
        if (n >= n_max) {
            increment = false;
        }
    }
    else {
        n -= 5;
        if (n < n_min) {
            increment = true;
        }
    }
    start += 5;
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
