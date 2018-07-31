/**
 * 【OkLayers】
 * 地图缩放等级参数对象
 * @author Zcheng
 * @version 2018-02-24
 * */
var webTileInfoObj = {
    rows:256,
    cols:256,
    compressionQuality:0,
    origin:{
        x:-180,
        y:90
    },
    spatialReference:{
        wkid:4326
    },
    lods:[ {
        level:2,
        resolution:.3515625,
        scale:147748796.52937502
    }, {
        level:3,
        resolution:.17578125,
        scale:73874398.26468751
    }, {
        level:4,
        resolution:.087890625,
        scale:36937199.132343754
    }, {
        level:5,
        resolution:.0439453125,
        scale:18468599.566171877
    }, {
        level:6,
        resolution:.02197265625,
        scale:9234299.783085939
    }, {
        level:7,
        resolution:.010986328125,
        scale:4617149.891542969
    }, {
        level:8,
        resolution:.0054931640625,
        scale:2308574.9457714846
    }, {
        level:9,
        resolution:.00274658203125,
        scale:1154287.4728857423
    }, {
        level:10,
        resolution:.001373291015625,
        scale:577143.7364428712
    }, {
        level:11,
        resolution:.0006866455078125,
        scale:288571.8682214356
    }, {
        level:12,
        resolution:.00034332275390625,
        scale:144285.9341107178
    }, {
        level:13,
        resolution:.000171661376953125,
        scale:72142.9670553589
    }, {
        level:14,
        resolution:858306884765625e-19,
        scale:36071.48352767945
    }, {
        level:15,
        resolution:4291534423828125e-20,
        scale:18035.741763839724
    }, {
        level:16,
        resolution:21457672119140625e-21,
        scale:9017.870881919862
    }, {
        level:17,
        resolution:10728836059570312e-21,
        scale:4508.935440959931
    }, {
        level:18,
        resolution:5364418029785156e-21,
        scale:2254.4677204799655
    } ]
};