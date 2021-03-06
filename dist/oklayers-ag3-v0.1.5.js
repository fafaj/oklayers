/*
 * 【OkLayers】
 * @author Zcheng
 * @version 2018-01-25
 */
function OkLayers(configs) {
    console.log("========= 欢迎使用 oklayers =========");
    var okLayersConfigs;
    var okLayersMap;
    var defloadType = "dynamicMap";
    var defMarkerSymbol;
    var defLineSymbol;
    var defFillSymbol;
    var topLayerIdx = 999999999999;
    var currQueryLayer;
    var currQueryLayerObj;
    var currAllShowLayerMap = {};
    var okLayersMapDraw;
    var identifyTask;
    var identifyParams;
    var mapDrawMode;
    var MODE_QUERY = "query";
    var MODE_EDIT = "edit";
    var initLayerIdx = 1e4;
    var changeLayerIdx = 2e4;
    this.initMap = function() {
        require([ "esri/map", "esri/toolbars/draw", "esri/graphic", "esri/dijit/editing/Add", "esri/layers/FeatureLayer", "esri/layers/WebTiledLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/SpatialReference", "esri/toolbars/navigation", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "dojo/on", "dojo/parser", "dijit/registry", "dijit/Toolbar", "dijit/form/Button", "dojo/domReady!" ], function(Map, Draw, Graphic, Add, FeatureLayer, WebTiledLayer, SpatialReference, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, Navigation, IdentifyTask, IdentifyParameters, on, parser, registry) {
            validationConfigurationModule();
            loadGlobalModule();
            loadLayersModule();
            loadToolbarModule(parser, registry, on, Navigation);
            initIdentify();
        });
    };
    this.toggleDispalyLayer = function(layerName, visible) {
        require([ "esri/map", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "dojo/parser", "dojo/domReady!" ], function(Map, IdentifyTask, IdentifyParameters, parser) {
            var allValidLayers = okLayersConfigs.layers;
            if (visible) {
                if (layerName == "all") {
                    removeAllLayers();
                    loadAllLayers(allValidLayers);
                } else {
                    var tempValidLayer = null;
                    var tempValidLayerIdx = 0;
                    for (var i = 0; i < allValidLayers.length; i++) {
                        var validLayer = allValidLayers[i];
                        if (layerName == validLayer.alias) {
                            tempValidLayerIdx = i + changeLayerIdx;
                            tempValidLayer = validLayer;
                        }
                    }
                    if (tempValidLayer != null) {
                        var tempMapServiceLayer = getMapServiceLayerByLoadType(tempValidLayer);
                        currAllShowLayerMap[tempValidLayer.alias] = tempMapServiceLayer;
                        okLayersMap.addLayer(tempMapServiceLayer, tempValidLayerIdx);
                    } else {
                        console.log("未检测到 " + layerName + " 的图层.");
                    }
                }
            } else {
                if (layerName == "all") {
                    removeAllLayers();
                } else {
                    removeLayerByName(layerName);
                }
            }
        });
    };
    this.toggleQueryLayer = function(layerName) {
        require([ "esri/map", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "dojo/parser", "dojo/domReady!" ], function(Map, IdentifyTask, IdentifyParameters, parser) {
            var tempValidLayer = getLayerByAlias(layerName);
            initQueryLayer(tempValidLayer);
        });
    };
    this.parsingIdtfResults = function(idtfResults, queryFields) {
        var data = new Array();
        if (idtfResults.length > 0) {
            var queryFieldsArr = queryFields.split(",");
            for (var i = 0; i < idtfResults.length; i++) {
                var idtfResult = idtfResults[i];
                var rowObj = new Object();
                for (var j = 0; j < queryFieldsArr.length; j++) {
                    var key = queryFieldsArr[j];
                    var value = idtfResult.feature.attributes[key];
                    rowObj[key] = value;
                    console.log("parsing data [ " + i + " ]：key = " + key + " value = " + value);
                }
                data[i] = rowObj;
            }
        }
        return data;
    };
    this.showHighLight = function(layerName, whereVal, scale, layerIdx) {
        var tempValidLayer = getLayerByAlias(layerName);
        if (tempValidLayer != null) {} else {
            console.log("未检测到 " + layerName + " 的图层.");
            return;
        }
        if (whereVal == null || whereVal == "") {
            whereVal = " 1 = 1";
        }
        if (scale == null) {
            scale = 3e3;
        }
        if (layerIdx == null) {
            layerIdx = 0;
        }
        var featureServerPath = mapServerToFeatureServer(tempValidLayer.url, layerIdx);
        require([ "dojo/dom", "esri/map", "esri/layers/FeatureLayer", "esri/tasks/query", "esri/graphic", "dojo/domReady!" ], function(dom, Map, FeatureLayer, Query, Graphic) {
            okLayersMap.graphics.clear();
            var featureLayer = new esri.layers.FeatureLayer(featureServerPath, {
                mode:esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields:[ "*" ]
            });
            var query = new Query();
            query.returnGeometry = true;
            query.where = whereVal;
            featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function(result) {
                if (result == null) {
                    return;
                }
                for (var i = 0; i < result.length; i++) {
                    var graphic = result[0];
                    var symbol;
                    switch (graphic.geometry.type) {
                      case "point":
                      case "multipoint":
                        symbol = defMarkerSymbol;
                        okLayersMap.setScale(scale);
                        okLayersMap.centerAt(new esri.geometry.Point(graphic.geometry.x, graphic.geometry.y, okLayersMap.spatialReference));
                        break;

                      case "polyline":
                        symbol = defLineSymbol;
                        okLayersMap.setExtent(graphic.geometry.getExtent());
                        break;

                      default:
                        symbol = defFillSymbol;
                        okLayersMap.setExtent(graphic.geometry.getExtent());
                        break;
                    }
                    okLayersMap.graphics.add(new esri.Graphic(graphic.geometry, symbol));
                }
            });
        });
    };
    this.addEleForFeatureServer = function(layerName, field, layerIdx, geometry, symbol) {
        var tempValidLayer = getLayerByAlias(layerName);
        if (tempValidLayer != null) {} else {
            console.log("未检测到 " + layerName + " 的图层.");
            return;
        }
        if (field == null || field == "") {
            console.log("未检测到 " + layerName + " 图层的field属性.");
            return;
        }
        if (layerIdx == null) {
            layerIdx = 0;
        }
        if (geometry == undefined) {
            geometry = null;
        }
        if (symbol == undefined) {
            symbol = null;
        }
        var featureServerPath = mapServerToFeatureServer(tempValidLayer.url, layerIdx);
        addElementsForFeatureServer(featureServerPath, geometry, symbol, field);
    };
    this.delEleForFeatureServerById = function(layerName, objectId, layerIdx) {
        var tempValidLayer = getLayerByAlias(layerName);
        if (tempValidLayer != null) {} else {
            console.log("未检测到 " + layerName + " 的图层.");
            return;
        }
        if (objectId == null || objectId == "") {
            console.log("未检测到 " + layerName + " 图层的OBJECTID.");
            return;
        }
        if (layerIdx == null) {
            layerIdx = 0;
        }
        var featureServerPath = mapServerToFeatureServer(tempValidLayer.url, layerIdx);
        deleteElementsForFeatureServer(featureServerPath, objectId);
    };
    this.getEleForFeatureServerById = function(layerName, objectId, layerIdx) {
        var tempValidLayer = getLayerByAlias(layerName);
        if (tempValidLayer != null) {} else {
            console.log("未检测到 " + layerName + " 的图层.");
            return;
        }
        if (objectId == null || objectId == "") {
            console.log("未检测到 " + layerName + " 图层的OBJECTID.");
            return;
        }
        if (layerIdx == null) {
            layerIdx = 0;
        }
        var featureServerPath = mapServerToFeatureServer(tempValidLayer.url, layerIdx);
        getElementsForFeatureServerById(featureServerPath, objectId, null);
    };
    this.updateEleForFeatureServerById = function(layerName, objectId, attributes, layerIdx) {
        var tempValidLayer = getLayerByAlias(layerName);
        if (tempValidLayer != null) {} else {
            console.log("未检测到 " + layerName + " 的图层.");
            return;
        }
        if (objectId == null || objectId == "") {
            console.log("未检测到 " + layerName + " 图层的OBJECTID.");
            return;
        }
        if (attributes == null || attributes == "") {
            console.log("未检测到 " + layerName + " 图层的attributes值.");
            return;
        }
        if (layerIdx == null) {
            layerIdx = 0;
        }
        var featureServerPath = mapServerToFeatureServer(tempValidLayer.url, layerIdx);
        updateElementsForFeatureServerById(featureServerPath, objectId, attributes);
    };
    function validationConfigurationModule() {
        okLayersConfigs = configs;
        okLayersConfigs.param = new Object();
        if (okLayersConfigs.global !== undefined) {
            if (okLayersConfigs.global.mapDivId !== undefined) {
                okLayersConfigs.param.showMap = true;
            } else {
                okLayersConfigs.param.showMap = false;
            }
            if (okLayersConfigs.global.defLoad === undefined || okLayersConfigs.global.defLoad == "") {
                okLayersConfigs.global.defLoad = defloadType;
            }
            if (okLayersConfigs.global.defLon !== undefined && okLayersConfigs.global.defLat !== undefined) {
                okLayersConfigs.param.showLonlat = true;
            } else {
                okLayersConfigs.param.showLonlat = false;
            }
            if (okLayersConfigs.global.defScale !== undefined) {
                okLayersConfigs.param.showDefScale = true;
            } else {
                okLayersConfigs.param.showDefScale = false;
            }
            if (okLayersConfigs.global.minScale !== undefined) {
                okLayersConfigs.param.showMinScale = true;
            } else {
                okLayersConfigs.param.showMinScale = false;
            }
            if (okLayersConfigs.global.defZoom !== undefined) {
                okLayersConfigs.param.showDefZoom = true;
            } else {
                okLayersConfigs.param.showDefZoom = false;
            }
            if (okLayersConfigs.global.wkid === undefined) {
                okLayersConfigs.global.wkid = 4326;
            }
            if (okLayersConfigs.global.showAll === undefined) {
                okLayersConfigs.global.showAll = true;
            }
        } else {
            console.log("未检测到 global 的值.");
        }
        if (okLayersConfigs.layers !== undefined && okLayersConfigs.layers != null) {
            var validLayers = new Array();
            var isBaseMap = false;
            var layers = okLayersConfigs.layers;
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.alias !== undefined && layer.url !== undefined && layer.alias != "" && layer.url != "") {
                    if (layer.loadType === undefined || layer.loadType == "") {
                        layer.loadType = okLayersConfigs.global.defLoad;
                    }
                    if (layer.basemap !== undefined && layer.basemap == true) {
                        isBaseMap = true;
                        if (okLayersConfigs.param.baseMap == undefined || okLayersConfigs.param.baseMap == "") {
                            okLayersConfigs.param.baseMap = new Array();
                            okLayersConfigs.param.baseMap[0] = layer;
                        } else {
                            okLayersConfigs.param.baseMap[okLayersConfigs.param.baseMap.length] = layer;
                        }
                        console.log("检测到第 " + okLayersConfigs.param.baseMap.length + " 张底图.");
                    } else {
                        validLayers[validLayers.length] = layer;
                    }
                }
            }
            if (validLayers.length > 0) {
                okLayersConfigs.param.showLayers = true;
                if (isBaseMap) {
                    okLayersConfigs.param.showBaseMap = true;
                    okLayersConfigs.layers = validLayers;
                } else {
                    okLayersConfigs.param.baseMap = validLayers[0];
                    if (validLayers.length == 1) {
                        okLayersConfigs.param.showLayers = false;
                    } else {
                        okLayersConfigs.param.showLayers = true;
                        var tempValidLayers;
                        for (var i = 1; i <= validLayers.length; i++) {
                            tempValidLayers[tempValidLayers.length] = validLayers[i];
                        }
                        okLayersConfigs.layers = tempValidLayers;
                    }
                }
            } else {
                if (isBaseMap) {
                    okLayersConfigs.param.showBaseMap = true;
                } else {
                    okLayersConfigs.param.showBaseMap = false;
                }
                okLayersConfigs.param.showLayers = false;
                console.log("未检测 layers 的有效图层");
            }
        } else {
            console.log("未检测到 layers 的值.");
        }
        if (okLayersConfigs.tools !== undefined && okLayersConfigs.tools != "") {
            if (okLayersConfigs.tools.zoomin !== undefined && okLayersConfigs.tools.zoomin != "") {
                okLayersConfigs.param.showZoomin = true;
            } else {
                okLayersConfigs.param.showZoomin = false;
            }
            if (okLayersConfigs.tools.zoomout !== undefined && okLayersConfigs.tools.zoomout != "") {
                okLayersConfigs.param.showZoomout = true;
            } else {
                okLayersConfigs.param.showZoomout = false;
            }
            if (okLayersConfigs.tools.zoomfullext !== undefined && okLayersConfigs.tools.zoomfullext != "") {
                okLayersConfigs.param.showZoomfullext = true;
            } else {
                okLayersConfigs.param.showZoomfullext = false;
            }
            if (okLayersConfigs.tools.zoomprev !== undefined && okLayersConfigs.tools.zoomprev != "") {
                okLayersConfigs.param.showZoomprev = true;
            } else {
                okLayersConfigs.param.showZoomprev = false;
            }
            if (okLayersConfigs.tools.zoomnext !== undefined && okLayersConfigs.tools.zoomnext != "") {
                okLayersConfigs.param.showZoomnext = true;
            } else {
                okLayersConfigs.param.showZoomnext = false;
            }
            if (okLayersConfigs.tools.pan !== undefined && okLayersConfigs.tools.pan != "") {
                okLayersConfigs.param.showPan = true;
            } else {
                okLayersConfigs.param.showPan = false;
            }
            if (okLayersConfigs.tools.deactivate !== undefined && okLayersConfigs.tools.deactivate != "") {
                okLayersConfigs.param.showDeactivate = true;
            } else {
                okLayersConfigs.param.showDeactivate = false;
            }
            if (okLayersConfigs.tools.point !== undefined && okLayersConfigs.tools.point != "") {
                okLayersConfigs.param.showPoint = true;
            } else {
                okLayersConfigs.param.showPoint = false;
            }
            if (okLayersConfigs.tools.extent !== undefined && okLayersConfigs.tools.extent != "") {
                okLayersConfigs.param.showExtent = true;
            } else {
                okLayersConfigs.param.showExtent = false;
            }
            if (okLayersConfigs.tools.point_edit !== undefined && okLayersConfigs.tools.point_edit != "") {
                okLayersConfigs.param.showPointEdit = true;
            } else {
                okLayersConfigs.param.showPointEdit = false;
            }
            if (okLayersConfigs.tools.line_edit !== undefined && okLayersConfigs.tools.line_edit != "") {
                okLayersConfigs.param.showLineEdit = true;
            } else {
                okLayersConfigs.param.showLineEdit = false;
            }
            if (okLayersConfigs.tools.polygon_edit !== undefined && okLayersConfigs.tools.polygon_edit != "") {
                okLayersConfigs.param.showPolygonEdit = true;
            } else {
                okLayersConfigs.param.showPolygonEdit = false;
            }
            if (okLayersConfigs.tools.resource !== undefined && okLayersConfigs.tools.resource != "") {
                if (okLayersConfigs.tools.resource.print != null && okLayersConfigs.tools.resource.print != "") {
                    if (okLayersConfigs.tools.resource.width === undefined || okLayersConfigs.tools.resource.width == "") {
                        okLayersConfigs.tools.resource.width = 200;
                    }
                    if (okLayersConfigs.tools.resource.height === undefined || okLayersConfigs.tools.resource.height == "") {
                        okLayersConfigs.tools.resource.heigth = 200;
                    }
                    if (okLayersConfigs.tools.resource.dpi === undefined || okLayersConfigs.tools.resource.dpi == "") {
                        okLayersConfigs.tools.resource.dpi = 96;
                    }
                    if (okLayersConfigs.tools.resource.format === undefined || okLayersConfigs.tools.resource.format == "") {
                        okLayersConfigs.tools.resource.format = "pdf";
                    }
                    if (okLayersConfigs.tools.resource.serverIP === undefined || okLayersConfigs.tools.resource.serverIP == "") {
                        okLayersConfigs.tools.resource.serverIP = "localhost";
                    }
                    if (okLayersConfigs.tools.resource.serverPort === undefined || okLayersConfigs.tools.resource.serverPort == "") {
                        okLayersConfigs.tools.resource.serverPort = 6080;
                    }
                    okLayersConfigs.param.showResource = true;
                } else {
                    okLayersConfigs.param.showResource = false;
                }
            } else {
                okLayersConfigs.param.showResource = false;
            }
        } else {
            console.log("未检测到 tools 的值.");
        }
    }
    function loadGlobalModule() {
        if (okLayersConfigs.param.showMap) {
            if (okLayersConfigs.param.showBaseMap) {
                okLayersMap = new esri.Map(okLayersConfigs.global.mapDivId, {
                    logo:false
                });
                var tempLayers = okLayersConfigs.param.baseMap;
                for (var i = 0; i < tempLayers.length; i++) {
                    var tempLayer = tempLayers[i];
                    var tempBaseMap = getMapServiceLayerByLoadType(tempLayer);
                    okLayersMap.addLayer(tempBaseMap, i);
                }
                if (okLayersConfigs.param.showLonlat) {
                    okLayersMap.centerAt(new esri.geometry.Point(okLayersConfigs.global.defLon, okLayersConfigs.global.defLat, new esri.SpatialReference({
                        wkid:okLayersConfigs.global.wkid
                    })));
                }
                if (okLayersConfigs.param.showDefScale) {
                    okLayersMap.setScale(okLayersConfigs.global.defScale);
                }
                if (okLayersConfigs.param.showMinScale) {
                    okLayersMap.on("zoom-end", resetMinZoom);
                }
                if (okLayersConfigs.param.showDefZoom) {
                    okLayersMap.setZoom(okLayersConfigs.global.defZoom);
                }
                initMapDraw();
                initDefSymbol();
            } else {
                console.log("未检测到底图和有效图层.");
                return;
            }
        }
    }
    function loadLayersModule() {
        if (okLayersMap != null) {
            var allValidLayers = okLayersConfigs.layers;
            if (okLayersConfigs.global.showAll) {
                for (var i = 0; i < allValidLayers.length; i++) {
                    var validLayer = allValidLayers[i];
                    var tempMapServiceLayer = getMapServiceLayerByLoadType(validLayer);
                    currAllShowLayerMap[validLayer.alias] = tempMapServiceLayer;
                    if (i == 0) {
                        initQueryLayer(validLayer);
                    }
                    okLayersMap.addLayer(tempMapServiceLayer, i + initLayerIdx);
                }
            } else {
                var validLayer = allValidLayers[0];
                var tempMapServiceLayer = getMapServiceLayerByLoadType(validLayer);
                currAllShowLayerMap[validLayer.alias] = tempMapServiceLayer;
                initQueryLayer(validLayer);
                okLayersMap.addLayer(tempMapServiceLayer, initLayerIdx);
            }
        }
    }
    function loadToolbarModule(parser, registry, on, Navigation) {
        parser.parse();
        if (okLayersMap != null) {
            var navToolbar = esri.toolbars.Navigation(okLayersMap);
            if (okLayersConfigs.param.showZoomin) {
                registry.byId(okLayersConfigs.tools.zoomin).on("click", function() {
                    okLayersMapDraw.deactivate();
                    navToolbar.activate(Navigation.ZOOM_IN);
                });
            }
            if (okLayersConfigs.param.showZoomout) {
                registry.byId(okLayersConfigs.tools.zoomout).on("click", function() {
                    okLayersMapDraw.deactivate();
                    navToolbar.activate(Navigation.ZOOM_OUT);
                });
            }
            if (okLayersConfigs.param.showZoomfullext) {
                registry.byId(okLayersConfigs.tools.zoomfullext).on("click", function() {
                    navToolbar.zoomToFullExtent();
                });
            }
            if (okLayersConfigs.param.showZoomprev) {
                registry.byId(okLayersConfigs.tools.zoomprev).on("click", function() {
                    navToolbar.zoomToPrevExtent();
                });
            }
            if (okLayersConfigs.param.showZoomnext) {
                registry.byId(okLayersConfigs.tools.zoomnext).on("click", function() {
                    navToolbar.zoomToNextExtent();
                });
            }
            on(navToolbar, "onExtentHistoryChange", extentHistoryChangeHandler);
            function extentHistoryChangeHandler() {
                if (okLayersConfigs.param.showZoomprev) {
                    registry.byId(okLayersConfigs.tools.zoomprev).disabled = navToolbar.isFirstExtent();
                }
                if (okLayersConfigs.param.showZoomnext) {
                    registry.byId(okLayersConfigs.tools.zoomnext).disabled = navToolbar.isLastExtent();
                }
            }
            if (okLayersConfigs.param.showPan) {
                registry.byId(okLayersConfigs.tools.pan).on("click", function() {
                    navToolbar.activate(Navigation.PAN);
                });
            }
            if (okLayersConfigs.param.showDeactivate) {
                registry.byId(okLayersConfigs.tools.deactivate).on("click", function() {
                    navToolbar.deactivate();
                    okLayersMapDraw.deactivate();
                });
            }
            if (okLayersConfigs.param.showPoint) {
                registry.byId(okLayersConfigs.tools.point).on("click", function() {
                    navToolbar.deactivate();
                    mapDrawMode = MODE_QUERY;
                    okLayersMapDraw.activate(esri.toolbars.Draw.POINT);
                });
            }
            if (okLayersConfigs.param.showExtent) {
                registry.byId(okLayersConfigs.tools.extent).on("click", function() {
                    navToolbar.deactivate();
                    mapDrawMode = MODE_QUERY;
                    okLayersMapDraw.activate(esri.toolbars.Draw.EXTENT);
                });
            }
            if (okLayersConfigs.param.showPointEdit) {
                registry.byId(okLayersConfigs.tools.point_edit).on("click", function() {
                    navToolbar.deactivate();
                    mapDrawMode = MODE_EDIT;
                    okLayersMapDraw.activate(esri.toolbars.Draw.MULTI_POINT);
                });
            }
            if (okLayersConfigs.param.showLineEdit) {
                registry.byId(okLayersConfigs.tools.line_edit).on("click", function() {
                    navToolbar.deactivate();
                    mapDrawMode = MODE_EDIT;
                    okLayersMapDraw.activate(esri.toolbars.Draw.FREEHAND_POLYLINE);
                });
            }
            if (okLayersConfigs.param.showPolygonEdit) {
                registry.byId(okLayersConfigs.tools.polygon_edit).on("click", function() {
                    navToolbar.deactivate();
                    mapDrawMode = MODE_EDIT;
                    okLayersMapDraw.activate(esri.toolbars.Draw.FREEHAND_POLYGON);
                });
            }
            if (okLayersConfigs.param.showResource) {
                registry.byId(okLayersConfigs.tools.resource.print).on("click", function() {
                    printMap();
                });
            }
        }
    }
    function initMapDraw() {
        if (okLayersMap != null) {
            okLayersMapDraw = new esri.toolbars.Draw(okLayersMap);
            okLayersMapDraw.on("draw-end", doIndentifyQuery);
        }
    }
    function initQueryLayer(tempValidLayer) {
        if (tempValidLayer != null) {
            okLayersMapDraw.deactivate();
            if (okLayersMap.graphics != null) {
                okLayersMap.graphics.clear();
            }
            if (currQueryLayer != undefined && currQueryLayer != null) {
                okLayersMap.removeLayer(currQueryLayer);
            }
            var tempMapServiceLayer = getMapServiceLayerByLoadType(tempValidLayer);
            tempMapServiceLayer.visible = false;
            currQueryLayer = tempMapServiceLayer;
            currQueryLayerObj = tempValidLayer;
            okLayersMap.addLayer(tempMapServiceLayer, topLayerIdx);
        } else {
            console.log("未检测到 " + layerName + " 的图层.");
        }
    }
    function initIdentify() {
        if (currQueryLayerObj != null && currQueryLayerObj.url != null && currQueryLayerObj.url != "") {
            var url = currQueryLayerObj.url;
            identifyTask = new esri.tasks.IdentifyTask(url);
            identifyParams = new esri.tasks.IdentifyParameters();
            identifyParams.tolerance = 5;
            identifyParams.returnGeometry = true;
            identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        }
    }
    function doIndentifyQuery(evt) {
        okLayersMap.graphics.clear();
        var symbol;
        switch (evt.geometry.type) {
          case "point":
          case "multipoint":
            symbol = defMarkerSymbol;
            break;

          case "polyline":
            symbol = defLineSymbol;
            break;

          default:
            symbol = defFillSymbol;
            break;
        }
        var geometry = evt.geometry;
        okLayersMap.graphics.add(new esri.Graphic(geometry, symbol));
        if (mapDrawMode == MODE_QUERY) {
            if (identifyTask != null) {
                identifyParams.geometry = evt.geometry;
                identifyParams.mapExtent = okLayersMap.extent;
                identifyTask.execute(identifyParams, function(idtfResults) {
                    if (isPageFun("onIdentifyQueryResult")) {
                        onIdentifyQueryResult(idtfResults);
                    }
                });
            }
        } else if (mapDrawMode == MODE_EDIT) {
            if (isPageFun("onIdentifyEditResult")) {
                onIdentifyEditResult(geometry, symbol);
            }
        }
    }
    function initDefSymbol() {
        defMarkerSymbol = new esri.symbol.SimpleMarkerSymbol();
        defMarkerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color("#61A706"), 2));
        defMarkerSymbol.setColor(new esri.Color([ 255, 255, 0, .25 ]));
        defLineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color("#61A706"), 6);
        defFillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color("#61A706"), 2), new esri.Color([ 255, 255, 0, .25 ]));
    }
    function getMapServiceLayerByLoadType(tempLayer) {
        var tempMapServiceLayer = null;
        if (tempLayer.loadType == "dynamicMap") {
            tempMapServiceLayer = new esri.layers.ArcGISDynamicMapServiceLayer(tempLayer.url);
        } else if (tempLayer.loadType == "tiledMap") {
            tempMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer(tempLayer.url);
        } else if (tempLayer.loadType == "webTiledLayer") {
            var webTileInfoObj = tempLayer.webTileInfoObj;
            var webTileOptions = tempLayer.webTileOptions;
            var tileInfo = new esri.layers.TileInfo(webTileInfoObj);
            webTileOptions.tileInfo = tileInfo;
            tempMapServiceLayer = new esri.layers.WebTiledLayer(tempLayer.url, webTileOptions);
        } else {
            tempMapServiceLayer = new esri.layers.ArcGISDynamicMapServiceLayer(tempLayer.url);
        }
        return tempMapServiceLayer;
    }
    function loadAllLayers(allValidLayers) {
        for (var i = 0; i < allValidLayers.length; i++) {
            var validLayer = allValidLayers[i];
            var tempMapServiceLayer = getMapServiceLayerByLoadType(validLayer);
            currAllShowLayerMap[validLayer.alias] = tempMapServiceLayer;
            okLayersMap.addLayer(tempMapServiceLayer, i + changeLayerIdx);
        }
    }
    function removeAllLayers() {
        for (var key in currAllShowLayerMap) {
            okLayersMap.removeLayer(currAllShowLayerMap[key]);
        }
    }
    function removeLayerByName(layerName) {
        for (var key in currAllShowLayerMap) {
            if (layerName == key) {
                okLayersMap.removeLayer(currAllShowLayerMap[key]);
            }
        }
    }
    function resetMinZoom() {
        var scale = okLayersMap.getScale();
        if (scale < okLayersConfigs.global.minScale) {
            okLayersMap.setScale(okLayersConfigs.global.minScale);
        }
    }
    function isPageFun(funName) {
        try {
            if (typeof eval(funName) == "function") {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    function mapServerToFeatureServer(mapServiceUrl, layerIdx) {
        if (layerIdx == null || layerIdx == "") {
            layerIdx = 0;
        }
        return mapServiceUrl.substring(0, mapServiceUrl.indexOf("MapServer")) + "FeatureServer/" + layerIdx;
    }
    function getLayerByAlias(alias) {
        var tempValidLayer = null;
        var allValidLayers = okLayersConfigs.layers;
        for (var i = 0; i < allValidLayers.length; i++) {
            var validLayer = allValidLayers[i];
            if (alias == validLayer.alias) {
                tempValidLayer = validLayer;
            }
        }
        return tempValidLayer;
    }
    function printMap() {
        require([ "esri/map", "dojo/dom", "dojo/on", "esri/graphic", "esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters", "dojo/colors", "dojo/domReady!" ], function(Map, dom, on, Graphic, PrintTask, PrintTemplate, PrintParameters, Color) {
            if (okLayersConfigs.tools.resource) {
                var printMap = new PrintTask("http://" + okLayersConfigs.tools.resource.serverIP + ":" + okLayersConfigs.tools.resource.serverPort + "/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task");
                var template = new PrintTemplate();
                var params = new PrintParameters();
                printMap.outSpatialReference = okLayersMap.spatialReference;
                template.exportOptions = {
                    width:okLayersConfigs.tools.resource.width,
                    height:okLayersConfigs.tools.resource.height,
                    dpi:okLayersConfigs.tools.resource.dpi
                };
                template.format = okLayersConfigs.tools.resource.format;
                template.layout = "MAP_ONLY";
                PrintTemplate;
                params.map = okLayersMap;
                params.template = template;
                printMap.execute(params, function(result) {
                    if (result != null) {
                        console.log(result.url);
                        var $a = $("<a></a>").attr("href", result.url).attr("download", "download");
                        $a[0].click();
                    }
                }, function(errorObj) {
                    console.log(errorObj);
                });
            }
        });
    }
    function addElementsForFeatureServer(featureServerPath, geometry, symbol, field) {
        require([ "esri/map", "esri/toolbars/draw", "esri/graphic", "esri/dijit/editing/Add", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/SpatialReference", "dojo/on", "dojo/parser", "dijit/registry", "dojo/domReady!" ], function(Map, Draw, Graphic, Add, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, on, parser, registry) {
            var featureLayer = new esri.layers.FeatureLayer(featureServerPath, {
                mode:esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields:[ "*" ]
            });
            var graphic = new Graphic(geometry, symbol, field);
            featureLayer.applyEdits([ graphic ], null, null, function(addRs, updateRs, delRs) {
                console.log("== callresult = " + addRs + " " + updateRs + " " + delRs);
                if (isPageFun("onFeatureServerAddResult")) {
                    onFeatureServerAddResult(addRs);
                }
            }, function(errresult) {
                console.log("== errresult = " + errresult);
                if (isPageFun("onFeatureServerAddResult")) {
                    onFeatureServerAddResult(errresult);
                }
            });
        });
    }
    function deleteElementsForFeatureServer(featureServerPath, objectId) {
        require([ "esri/map", "esri/toolbars/draw", "esri/graphic", "esri/dijit/editing/Delete", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/SpatialReference", "dojo/on", "dojo/parser", "dijit/registry", "dojo/domReady!" ], function(Map, Draw, Graphic, Delete, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, on, parser, registry) {
            var featureLayer = new esri.layers.FeatureLayer(featureServerPath, {
                mode:esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields:[ "*" ]
            });
            getElementsForFeatureServerById(featureServerPath, objectId, function(result) {
                var graphic = result[0];
                featureLayer.applyEdits(null, null, [ graphic ], function(addRs, updateRs, delRs) {
                    console.log("== callresult = " + addRs + " " + updateRs + " " + delRs);
                    if (isPageFun("onFeatureServerDelResult")) {
                        onFeatureServerDelResult(delRs);
                    }
                }, function(errresult) {
                    console.log("== errresult = " + errresult);
                    if (isPageFun("onFeatureServerDelResult")) {
                        onFeatureServerDelResult(errresult);
                    }
                });
            });
        });
    }
    function getElementsForFeatureServerById(featureServerPath, objectId, callback) {
        require([ "esri/map", "esri/toolbars/draw", "esri/graphic", "esri/tasks/query", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/SpatialReference", "dojo/on", "dojo/parser", "dijit/registry", "dojo/domReady!" ], function(Map, Draw, Graphic, Query, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, on, parser, registry) {
            var featureLayer = new esri.layers.FeatureLayer(featureServerPath, {
                mode:esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields:[ "*" ]
            });
            var query = new Query();
            query.returnGeometry = true;
            query.where = "1=1";
            query.objectIds = [ objectId ];
            featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW, function(result) {
                if (result == null) {
                    return;
                }
                if (!callback) {
                    if (isPageFun("onFeatureServerQueryResult")) {
                        onFeatureServerQueryResult(result);
                    }
                } else {
                    callback(result);
                }
            });
        });
    }
    function updateElementsForFeatureServerById(featureServerPath, objectId, attributes) {
        require([ "esri/map", "esri/toolbars/draw", "esri/graphic", "esri/dijit/editing/Update", "esri/layers/FeatureLayer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/SpatialReference", "dojo/on", "dojo/parser", "dijit/registry", "dojo/domReady!" ], function(Map, Draw, Graphic, Update, FeatureLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SpatialReference, on, parser, registry) {
            var featureLayer = new esri.layers.FeatureLayer(featureServerPath, {
                mode:esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields:[ "*" ]
            });
            getElementsForFeatureServerById(featureServerPath, objectId, function(result) {
                var oldGraphic = result[0];
                var newGraphic = new Graphic(oldGraphic.toJson());
                for (var inkey in attributes) {
                    for (var objkey in newGraphic.attributes) {
                        if (inkey == objkey) {
                            newGraphic.attributes[objkey] = attributes[inkey];
                            break;
                        }
                    }
                }
                featureLayer.applyEdits(null, [ newGraphic ], null, function(addRs, updateRs, delRs) {
                    console.log("== callresult = " + addRs + " " + updateRs + " " + delRs);
                    if (isPageFun("onFeatureServerUpdateResult")) {
                        onFeatureServerUpdateResult(updateRs);
                    }
                }, function(errresult) {
                    console.log("== errresult = " + errresult);
                    if (isPageFun("onFeatureServerUpdateResult")) {
                        onFeatureServerUpdateResult(errresult);
                    }
                });
            });
        });
    }
}