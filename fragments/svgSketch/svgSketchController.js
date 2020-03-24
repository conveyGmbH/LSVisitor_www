﻿// controller for page: svgSketch
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/fragmentController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/fragments/svgSketch/svgSketchService.js" />
/// <reference path="~/www/fragments/svgSketch/svgeditor.js" />

(function () {
    "use strict";

    var b64 = window.base64js;

    WinJS.Namespace.define("SvgSketch", {
        Controller: WinJS.Class.derive(Fragments.Controller, function Controller(fragmentElement, options, commandList) {
            Log.call(Log.l.trace, "SvgSketch.Controller.", "noteId=" + (options && options.noteId));
            this.svgEditor = null;

            Fragments.Controller.apply(this, [fragmentElement, {
                noteId: null,
                isLocal: options && options.isLocal,
                dataSketch: {},
                color: 0,
                width: 1,
                styleWidth: "1px",
                styleMargin: "9px"
            }, commandList]);

            var that = this;

            var getDocData = function () {
                return that.binding.dataSketch && that.binding.dataSketch.Quelltext;
            }
            var hasDoc = function () {
                return (getDocData() && typeof getDocData() === "string");
            }
            this.hasDoc = hasDoc;
            var getSvgEditor = function() {
                if (!that.svgEditor) {
                    // instanciate SVGEditor class
                    var svgEditor = new SVGEditor.SVGEditorClass(options);
                    that.binding.color = svgEditor.drawcolor && svgEditor.drawcolor[0];
                    svgEditor.fnCreateDrawDiv();
                    svgEditor.fnStartSketch();
                    that.svgEditor = svgEditor;
                    if (options && options.isLocal) {
                        that.svgEditor.registerTouchEvents();
                    }
                }
                return that.svgEditor;
            }
            this.getSvgEditor = getSvgEditor;

            this.dispose = function () {
                that.removeDoc();
                if (that.svgEditor) {
                    that.svgEditor.dispose();
                    that.svgEditor = null;
                }
            }

            // check modify state
            // modified==true when startDrag() in svg.js is called!
            var isModified = function () {
                Log.call(Log.l.trace, "SvgSketchController.");
                if (that.svgEditor) {
                    Log.ret(Log.l.trace, "modified=" + that.svgEditor.modified);
                    return that.svgEditor.modified;
                }
                Log.ret(Log.l.trace);
                return false;
            }
            this.isModified = isModified;

            var resultConverter = function (item) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                if (item) {
                    if (item.DocGroup === AppData.DocGroup.Text && item.DocFormat === 75) {
                        item.ExecAppTypeID = 15;
                        item.Quelltext = item.DocContentDOCCNT1;
                    } else {
                        item.Quelltext = "";
                    }
                    item.DocContentDOCCNT1 = "";
                }
                Log.ret(Log.l.trace);
            }
            this.resultConverter = resultConverter;

            var showSvgAfterResize = function () {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret = WinJS.Promise.timeout(0).then(function () {
                    var promise = null;
                    var fragmentControl = fragmentElement.winControl;
                    if (fragmentControl && fragmentControl.updateLayout) {
                        fragmentControl.prevWidth = 0;
                        fragmentControl.prevHeight = 0;
                        promise = fragmentControl.updateLayout.call(fragmentControl, fragmentElement) || WinJS.Promise.as();
                        promise.then(function () {
                            if (getSvgEditor()) {
                                that.svgEditor.fnLoadSVG(getDocData());
                                if (options && options.isLocal) {
                                    that.svgEditor.registerTouchEvents();
                                }
                            }
                            return WinJS.Promise.timeout(50);
                        }).then(function () {
                            var docContainer = fragmentElement.querySelector(".doc-container");
                            if (docContainer && (docContainer.lastElementChild || docContainer.lastChild)) {
                                var sketchElement = docContainer.lastElementChild || docContainer.lastChild;
                                    //var oldElement;
                                    var animationDistanceX = fragmentElement.clientWidth / 4;
                                    var animationOptions = { top: "0px", left: animationDistanceX.toString() + "px" };
                                    if (sketchElement.style) {
                                        sketchElement.style.visibility = "";
                                    }
                                if (that.svgEditor) {
                                    that.svgEditor.resize(fragmentElement.clientWidth, fragmentElement.clientHeight);
                                }
                                return WinJS.UI.Animation.enterContent(sketchElement, animationOptions).then(function() {
                                        if (sketchElement.style) {
                                            sketchElement.style.display = "";
                                            sketchElement.style.position = "";
                                        }
                                    });
                            } else {
                                return WinJS.Promise.as();
                            }
                        });
                    }
                    return promise || WinJS.Promise.as();
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            
            var loadData = function (noteId) {
                var ret;
                Log.call(Log.l.trace, "SvgSketch.Controller.", "noteId=" + noteId);
                AppData.setErrorMsg(that.binding);
                var docContainer = fragmentElement.querySelector(".doc-container");
                if (docContainer) {
                    var sketchElement = docContainer.lastElementChild || docContainer.lastChild;
                    if (sketchElement) {
                        if (sketchElement.style) {
                            sketchElement.style.visibility = "hidden";
                            sketchElement.style.display = "block";
                            sketchElement.style.position = "absolute";
                        }
                    }
                }
                if (noteId) {
                    ret = SvgSketch.sketchDocView.select(function (json) {
                        // this callback will be called asynchronously
                        // when the response is available
                        Log.print(Log.l.trace, "SvgSketch.sketchDocView: success!");
                        // select returns object already parsed from json file in response
                        if (json && json.d) {
                            that.binding.noteId = json.d.KontaktNotizVIEWID;
                            that.resultConverter(json.d);
                            that.binding.dataSketch = json.d;
                            if (hasDoc()) {
                                Log.print(Log.l.trace,
                                    "SVG Element: " +
                                    getDocData().substr(0, 100) +
                                    "...");
                                // reload trigger-generated SVG
                                showSvgAfterResize();
                            }
                        }
                    },  function (errorResponse) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        AppData.setErrorMsg(that.binding, errorResponse);
                    },
                    noteId,
                    that.binding.isLocal);
                } else if (that.binding.isLocal) {
                    AppBar.busy = true;
                    that.binding.noteId = 0;
                    ret = WinJS.Promise.timeout(0).then(function() {
                        if (getSvgEditor()) {
                    // insert new SVG note first - but only if isLocal!
                    that.svgEditor.fnNewSVG();
                    that.svgEditor.registerTouchEvents();
                    that.svgEditor.modified = true;
                            return that.saveData(function (response) {
                        // called asynchronously if ok
                        AppBar.busy = false;
                    },
                    function (errorResponse) {
                        AppData.setErrorMsg(that.binding, errorResponse);
                        AppBar.busy = false;
                    });
                } else {
                            return WinJS.Promise.as();
                        }
                    });
                } else {
                    ret = WinJS.Promise.as();
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.loadData = loadData;

            var saveData = function (complete, error) {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret;
                AppData.setErrorMsg(that.binding);
                var dataSketch = that.binding.dataSketch;
                if (dataSketch && that.binding.isLocal && isModified()) {
                    ret = new WinJS.Promise.as().then(function () {
                        if (that.svgEditor) {
                            that.svgEditor.fnSaveSVG(function(quelltext) {
                                dataSketch.Quelltext = quelltext;
                                var doret;
                                if (that.binding.noteId) {
                                    doret = SvgSketch.sketchView.update(function(response) {
                                            var doret2;
                                            // called asynchronously if ok
                                            Log.print(Log.l.trace, "sketchData update: success!");
                                            if (that.svgEditor) {
                                                that.svgEditor.modified = false;
                                            }
                                            doret2 = WinJS.Promise.timeout(0).then(function() {
                                                if (AppBar.scope && typeof AppBar.scope.loadList === "function") {
                                                    return AppBar.scope.loadList(that.binding.noteId);
                                                } else {
                                                    return WinJS.Promise.as();
                                                }
                                            }).then(function() {
                                                if (typeof complete === "function") {
                                                    complete(response);
                                                }
                                            });
                                            return doret2;
                                        },
                                        function(errorResponse) {
                                            // called asynchronously if an error occurs
                                            // or server returns response with an error status.
                                            AppData.setErrorMsg(that.binding, errorResponse);
                                            if (typeof error === "function") {
                                                error(errorResponse);
                                            }
                                        },
                                        that.binding.noteId,
                                        dataSketch,
                                        that.binding.isLocal);
                                } else {
                                    //insert if a primary key is not available (noteId === null)
                                    dataSketch.KontaktID = AppData.getRecordId("Kontakt");
                                    // SVG note
                                    dataSketch.ExecAppTypeID = 15;
                                    dataSketch.DocGroup = 3;
                                    dataSketch.DocFormat = 75;
                                    dataSketch.OvwEdge = 100;
                                    dataSketch.DocExt = "svg";
                                    var svgdiv = fragmentElement.querySelector(".svgdiv");
                                    if (svgdiv) {
                                        var svg = svgdiv.firstElementChild;
                                        if (svg) {
                                            dataSketch.Width =
                                                svg.height && svg.height.baseVal && svg.height.baseVal.value;
                                            dataSketch.Height =
                                                svg.width && svg.width.baseVal && svg.width.baseVal.value;
                                        }
                                    }
                                    if (!dataSketch.KontaktID) {
                                        doret = new WinJS.Promise.as().then(function() {
                                            var errorResponse = {
                                                status: -1,
                                                statusText: "missing recordId for table Kontakt"
                                            }
                                            AppData.setErrorMsg(that.binding, errorResponse);
                                            if (typeof error === "function") {
                                                error(errorResponse);
                                            }
                                        });
                                    } else {
                                        doret = SvgSketch.sketchView.insert(function(json) {
                                                var doret2;
                                                // this callback will be called asynchronously
                                                // when the response is available
                                                Log.print(Log.l.trace, "sketchData insert: success!");
                                                // contactData returns object already parsed from json file in response
                                                if (json && json.d) {
                                                    that.binding.dataSketch = json.d;
                                                    that.binding.noteId = json.d.KontaktNotizVIEWID;
                                                    doret2 = WinJS.Promise.timeout(0).then(function() {
                                                        // reload list
                                                        if (AppBar.scope && typeof AppBar.scope.loadList === "function"
                                                        ) {
                                                            return AppBar.scope.loadList(that.binding.noteId);
                                                        } else {
                                                            return WinJS.Promise.as();
                                                        }
                                                    }).then(function() {
                                                        if (typeof complete === "function") {
                                                            complete(json);
                                                        }
                                                    });
                                                } else {
                                                    if (typeof complete === "function") {
                                                        complete(json);
                                                    }
                                                    doret2 = WinJS.Promise.as();
                                                }
                                                return doret2;
                                            },
                                            function(errorResponse) {
                                                // called asynchronously if an error occurs
                                                // or server returns response with an error status.
                                                AppData.setErrorMsg(that.binding, errorResponse);
                                                if (typeof error === "function") {
                                                    error(errorResponse);
                                                }
                                            },
                                            dataSketch,
                                            that.binding.isLocal);
                                    }
                                }
                                return doret;
                            });
                        } else {
                            if (typeof complete === "function") {
                                complete(that.binding.dataSketch);
                            }
                        }
                    });
                } else {
                    ret = new WinJS.Promise.as().then(function () {
                        if (typeof complete === "function") {
                            complete(that.binding.dataSketch);
                        }
                    });
                }
                Log.ret(Log.l.trace);
                return ret;
            };
            this.saveData = saveData;

            var deleteData = function() {
                Log.call(Log.l.trace, "SvgSketch.Controller.");
                var ret = WinJS.Promise.as().then(function () {
                    if (options && options.isLocal) {
                        if (that.svgEditor) {
                            that.svgEditor.modified = false;
                        }
                        Log.print(Log.l.trace, "clickDelete: user choice OK");
                        return SvgSketch.sketchView.deleteRecord(function(response) {
                            // called asynchronously if ok
                            Log.print(Log.l.trace, "svgSketchData delete: success!");
                            //reload sketchlist
                            if (AppBar.scope && typeof AppBar.scope.loadData === "function") {
                                AppBar.scope.loadData();
                            }
                        },
                        function(errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        },
                        that.binding.noteId,
                        that.binding.isLocal);
                    } else {
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.deleteData = deleteData;

            var eventHandlers = {
                clickUndo: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (that.svgEditor) {
                        that.svgEditor.fnUndoSVG(event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickRedo: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (that.svgEditor) {
                        that.svgEditor.fnRedoSVG(event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickShapes: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (that.svgEditor) {
                        that.svgEditor.toggleToolbox("shapesToolbar");
                    }
                    Log.ret(Log.l.trace);
                },
                clickColors: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (that.svgEditor) {
                        that.svgEditor.toggleToolbox("colorsToolbar");
                    }
                    Log.ret(Log.l.trace);
                },
                clickWidths: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (that.svgEditor) {
                        that.svgEditor.toggleToolbox("widthsToolbar");
                    }
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for tools
                clickTool: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    var tool = event.currentTarget;
                    if (tool && tool.id && that.svgEditor) {
                        if (tool.id.length > 4) {
                            var toolNo = tool.id.substr(4);
                            Log.print(Log.l.trace, "selected tool:" + tool.id + " with no=" + toolNo);
                            that.svgEditor.fnSetShape(parseInt(toolNo));
                        } //else {
                        that.svgEditor.hideToolbox("shapesToolbar");
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                // Eventhandler for colors
                clickColor: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    var color = event.currentTarget;
                    if (color && color.id && that.svgEditor) {
                        if (color.id.length > 10) {
                            var colorNo = color.id.substr(10); // color tags
                            var nColorNo = parseInt(colorNo);
                            that.binding.color = that.svgEditor.drawcolor[nColorNo];
                            Log.print(Log.l.trace, "selected color:" + color.id + " with no=" + colorNo + " color=" + that.binding.color);
                            that.svgEditor.fnSetColor(nColorNo);
                        } //else {
                        that.svgEditor.hideToolbox("colorsToolbar");
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                        //}
                    }
                    Log.ret(Log.l.trace);
                },
                clickWidth: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.", "selected width=" + that.binding.width);
                    if (that.svgEditor) {
                        that.svgEditor.hideToolbox("widthsToolbar");
                        if (options && options.isLocal) {
                            that.svgEditor.registerTouchEvents();
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                changedWidth: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (event.currentTarget) {
                        var range = event.currentTarget;
                        if (range) {
                            that.binding.width = parseInt(range.value);
                            that.binding.styleWidth = that.binding.width.toString() + "px";
                            that.binding.styleMargin = (10 - that.binding.width).toString() + "px";
                        }
                    }
                    Log.ret(Log.l.trace);
                },
                clickShare: function (event) {
                    Log.call(Log.l.trace, "SvgSketch.Controller.");
                    if (getDocData()) {
                        var blob = utf8_decode(getDocData());
                        var encoded = b64.fromByteArray(blob);
                        var data = "data:text/svg;base64," + encoded;
                        var formattedName = "Drawing" + that.binding.dataSketch.KontaktID + "_" + that.binding.dataSketch.KontaktNotizVIEWID;
                        var subject = formattedName;
                        var message = getResourceText("contact.title") +
                            " ID: " + AppData.generalData.globalContactID + " \r\n" +
                            formattedName;
                        window.plugins.socialsharing.share(message, subject, data, null);
                    }
                    Log.ret(Log.l.trace);
                }
            }
            this.eventHandlers = eventHandlers;

            var disableHandlers = {
                clickUndo: function () {
                    if (options && options.isLocal && that.svgEditor && that.svgEditor.fnCanUndo()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickRedo: function () {
                    if (options && options.isLocal && that.svgEditor && that.svgEditor.fnCanRedo()) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickShare: function () {
                    if (getDocData()) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
            this.disableHandlers = disableHandlers;


            var removeDoc = function () {
                Log.call(Log.l.trace, "ImgSketch.Controller.");
                that.binding.noteId = null;
                that.binding.dataSketch = {};
                if (that.svgEditor) {
                    that.svgEditor.fnNewSVG();
                    that.svgEditor.modified = false;
                    if (options && options.isLocal) {
                        that.svgEditor.unregisterTouchEvents();
                    }
                }
                Log.ret(Log.l.trace);
            }
            this.removeDoc = removeDoc;

            // finally, load the data
            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData(options && options.noteId);
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();



