# OkLayers

## 一、介绍

OkLayers可以通过简单的配置，实现地图的加载显示；并且通过方法的组合的使用，实现复杂业务的操作。

### 功能实现

1. 支持通过WebTiledLayer、ArcGISTiledMapServiceLayer和ArcGISDynamicMapServiceLayer加载图层
2. 支持点选和框选的查询
3. 支持Feature Access功能图层的查询、新增、修改和删除
4. 通过别名，切换显示图层和查询图层
5. 要素的高亮显示

### 依赖环境

ArcGIS API for JavaScript ：`3.x`

### 历史版本

> - oklayers-ag3-v0.1.5.js
>
>   1.配置优化
>
> - oklayers-ag3-v0.1.4.js
>
>   1.实现图层的更新和删除
>
> - oklayers-ag3-v0.1.3.js
>
>   1.实现图层的查询和新增
>
> - oklayers-ag3-v0.1.2.js
>
>   1.实现地图的加载
>
> - oklayers-ag3-v0.1.1.js
>
>   1.模块的设计
>
> - oklayers-ag3-v0.1.0.js
>
>   1.初始化版本

## 二、配置属性

### 1）全局属性

| 名称     | 类型    | 说明                                                         |
| -------- | ------- | ------------------------------------------------------------ |
| global   | Object  | 全局属性对象                                                 |
| mapDivId | String  | 页面地图显示区域DIV的ID(非必填)；如果不设置，表示只查询或编辑状态。 |
| defLoad  | String  | 默认全局的加载方式，图层可配置 webTiledLayer / tiledMap / dynamicMap**（默认）** |
| defLon   | Number  | 默认定位的经度                                               |
| defLat   | Number  | 默认定位的纬度                                               |
| defScale | Number  | 默认显示的比例尺                                             |
| minScale | Number  | 底图最小缩放的比例尺                                         |
| defZoom  | Number  | 默认显示的缩放等级                                           |
| wkid     | Number  | 坐标系编码；如: GCS_WGS_1984 = 4326**（默认）**；GCS_China_Geodetic_Coordinate_System_2000 = 4490 |
| showAll  | Boolean | true = 显示所有图层**（默认）**；false = 显示第一张图层      |

### 2）图层属性

| 名称           | 类型    | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| layers         | Array   | 所有图层数组                                                 |
| alias          | String  | 图层别名**（必填）**                                         |
| url            | String  | 图层服务链接**（必填）**                                     |
| loadType       | String  | 加载方式；如果不设置，则使用默认全局的加载方式（webTiledLayer /tiledMap / dynamicMap） |
| basemap        | Boolean | 标记底图；true = 标记为底图；false = 业务图层**（默认）**；如果不标记底图，默认第一个图层为底图 |
| webTileOptions | Object  | WebTiledLayer的选项配置                                      |
| webTileInfoObj | Object  | WebTiledLayer的缩放等级对象                                  |

### 3）工具栏属性

| 名称         | 类型   | 说明                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| tools        | Object | `工具栏`对象                                                 |
| zoomin       | String | `缩小`按钮的ID                                               |
| zoomout      | String | `放大`按钮的ID                                               |
| zoomfullext  | String | `全图`按钮的ID                                               |
| zoomprev     | String | `上一步`按钮的ID                                             |
| zoomnext     | String | `下一步`按钮的ID                                             |
| pan          | String | `拖动`按钮的ID                                               |
| deactivate   | String | `取消`选择按钮的ID                                           |
| point        | String | `点选`按钮的ID                                               |
| extent       | String | `矩形`框选按钮的ID                                           |
| point_edit   | String | `画点`按钮的ID                                               |
| line_edit    | String | `画线`按钮的ID                                               |
| polygon_edit | String | `画面`按钮的ID                                               |
| resource     | String | `输出资源文件`按钮的ID；需要ArcGIS Server开启 PrintingTools 服务 |



## 三、方法

### 1）对象方法

| 名称                                                         | 返回类型 | 说明                         |
| ------------------------------------------------------------ | -------- | ---------------------------- |
| initMap()                                                    | None     | 初始化方法                   |
| toggleDispalyLayer(layerName,visible)                        | None     | 根据图层别名，显示或隐藏图层 |
| toggleQueryLayer(layerName)                                  | None     | 根据图层别名，切换查询图层   |
| showHighLight(layerName,whereVal,scale,layerIdx)             | None     | 高亮显示                     |
| addEleForFeatureServer(layerName,field,layerIdx,geometry,symbol) | None     | 新增要素                     |
| delEleForFeatureServerById(layerName,objectId,layerIdx)      | None     | 删除要素                     |
| getEleForFeatureServerById(layerName,objectId,layerIdx)      | None     | 查询要素                     |
| updateEleForFeatureServerById(layerName,objectId,attributes,layerIdx) | None     | 修改要素                     |

### 2）结果方法

| 名称                                   | 结果说明                             | 说明                       |
| -------------------------------------- | ------------------------------------ | -------------------------- |
| onIdentifyQueryResult(idtfResults)     | idtfResults：查询结果                | `点选或框选`的结果返回     |
| onIdentifyEditResult(geometry, symbol) | geometry：几何图形；symbol：符号样式 | `画点/画线/画面`的结果返回 |
| onFeatureServerQueryResult(result)     | result：查询结果                     | `查询要素`的结果返回       |
| onFeatureServerAddResult(result)       | result：新增结果                     | `新增要素`的结果返回       |
| onFeatureServerUpdateResult(result)    | result：更新结果                     | `更新要素`的结果返回       |
| onFeatureServerDelResult(result)       | result：删除结果                     | `删除要素`的结果返回       |

## 四、例子

### 加载ArcGIS Online地图

```js
//创建OkLayers对象,创建配置
var okLayers = new OkLayers({
 	global:{
 		mapDivId: "oklayers-div"
 		,defLoad: "dynamicMap"
 		,defLon: 112.64752
 		,defLat: 24.471443
 		,defScale: 30000
 		,wkid: 4326
 		,showAll: true
 	},
 	layers:[
 		{alias: "basemap"
 		  ,url: "http://cache1.arcgisonline.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer"
 		  ,loadType: "dynamicMap"
 		  ,basemap: true
 		}
 	]
  });
//执行初始化方法
okLayers.initMap();
```

### 加载天地图

* 需要引入 oklayers-webtileinfo.js 文件

```js
//创建OkLayers对象,创建配置
var okLayers = new OkLayers({
 	global:{
 		mapDivId: "oklayers-div"
 		,defLoad: "dynamicMap"
 		,defLon: 112.64752
 		,defLat: 24.471443
 		,defScale: 30000
 		,wkid: 4326
 		,showAll: true
 	},
 	layers:[
 		{alias: "tdmap1"
 		  ,url: "http://\${subDomain}.tianditu.com/DataServer?T=vec_c&X=\${col}&Y=\${row}&L=\${level}"
 		  ,loadType: "webTiledLayer"
 		  ,basemap: true
 		  ,webTileOptions: {id:"tdmap1", subDomains: ["t0", "t1", "t2"]}
 		  ,webTileInfoObj: webTileInfoObj //调用页面引用 oklayers-webtileinfo.js
 		},
 		{alias: "tdmap2"
 		  ,url: "http://\${subDomain}.tianditu.com/DataServer?T=cva_c&X=\${col}&Y=\${row}&L=\${level}"
 		  ,loadType: "webTiledLayer"
 		  ,basemap: true
 		  ,webTileOptions: {id:"tdmap2", subDomains: ["t0", "t1", "t2"]}
 		  ,webTileInfoObj: webTileInfoObj //调用页面引用 oklayers-webtileinfo.js
 		}
 	]
  });
//执行初始化方法
okLayers.initMap();
```