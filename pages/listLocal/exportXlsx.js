// export Excel file for download
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/OpenXml/scripts/linq.js" />
/// <reference path="~/www/lib/OpenXml/scripts/ltxml.js" />
/// <reference path="~/www/lib/OpenXml/scripts/ltxml-extensions.js" />
/// <reference path="~/www/lib/OpenXml/scripts/jszip.js" />
/// <reference path="~/www/lib/OpenXml/scripts/jszip-load.js" />
/// <reference path="~/www/lib/OpenXml/scripts/jszip-inflate.js" />
/// <reference path="~/www/lib/OpenXml/scripts/jszip-deflate.js" />
/// <reference path="~/www/lib/OpenXml/scripts/FileSaver.js" />
/// <reference path="~/www/lib/OpenXml/scripts/openxml.js" />

(function (root) {  // root = global
    "use strict";

    var XAttribute = Ltxml.XAttribute;
    var XCData = Ltxml.XCData;
    var XComment = Ltxml.XComment;
    var XContainer = Ltxml.XContainer;
    var XDeclaration = Ltxml.XDeclaration;
    var XDocument = Ltxml.XDocument;
    var XElement = Ltxml.XElement;
    var XName = Ltxml.XName;
    var XNamespace = Ltxml.XNamespace;
    var XNode = Ltxml.XNode;
    var XObject = Ltxml.XObject;
    var XProcessingInstruction = Ltxml.XProcessingInstruction;
    var XText = Ltxml.XText;
    var XEntity = Ltxml.XEntity;
    var cast = Ltxml.cast;
    var castInt = Ltxml.castInt;

    var S = openXml.S;
    var R = openXml.R;

    var cr = false;

    WinJS.Namespace.define("ExportXlsx", {
        ExporterClass: WinJS.Class.define(function exporterClass(progress) {
            Log.call(Log.l.trace, "ExportXlsx.");
            this.progress = progress;
            this.progressFirst = 0;
            this.progressNext = 0;
            //this.progressStep = 40;
            this.xlsx = new openXml.OpenXmlPackage();
            ExportXlsx.exporter = this;
            Log.ret(Log.l.trace);
        }, {
            showProgress: function (percent, text) {
                if (this.progress && typeof this.progress === "object") {
                    if (!percent) {
                        this.progressFirst = 0;
                        this.progressNext = 0;
                        //this.progressStep = 40;
                    }
                    this.progress.percent = parseInt(percent);
                    this.progress.show = percent >= 0 && percent < 100 ? 1 : null;
                    this.progress.text = text ? text : getResourceText("reporting.progressMsg");
                }
            },
            saveFile: function (fileName, fileData) {
                // Get access to the file system
                var myFileUrl = "";
                /*  var storageLocation = "";
  
                  switch (device.platform) {
  
                      case "Android":
                          storageLocation = 'file:///storage/emulated/0/';
                          break;
                      case "iOS":
                          storageLocation = cordova.file.documentsDirectory;
                          break;
  
                  }
  
                  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                      // Create the file.
                      console.log(fileSystem.root);
                      fileSystem.root.getFile(fileName, { create: true, exclusive: false }, function (entry) {
                          // After you save the file, you can access it with this URL
                          
                          myFileUrl = entry.toURL();
                          entry.createWriter(function (writer) {
                              writer.onwriteend = function (evt) {
                                  var fileUri = "file:///data/user/0/com.convey.LSVisitorApp//files/files‌​/Visits.xlsx"
                                  alert("Successfully saved file to " + fileUri);
                                  function moveFile(fileUri) {
                                      window.resolveLocalFileSystemURL(
                                            fileUri,
                                            function (fileEntry) {
  
                                                var parentEntry = storageLocation + "Download";
  
                                                // move the file to a new directory and rename it
                                                fileEntry.moveTo(parentEntry, "Visits.xlsx", success, fail);
  
                                            },
                                            function (error) { });
                                  }
                              };
                              // Write to the file
                              writer.write(fileData);
                          }, function (error) {
                              alert("Error: Could not create file writer, " + error.code);
                          });
                      }, function (error) {
                          alert("Error: Could not create file, " + error.code);
                      });
                  }, function (evt) {
                      alert("Error: Could not access file system, " + evt.target.error.code);
                  });*/

                var storageLocation = "";
                console.log(device.platform);
                var directory = '';
                switch (device.platform) {

                    case "Android":
                        storageLocation = 'file:///storage/emulated/0/';
                        directory = 'Download';
                        break;
                    case "iOS":
                        storageLocation = cordova.file.documentsDirectory;
                        directory = '';
                        break;

                }
                window.resolveLocalFileSystemURL(storageLocation,
                    function (fileSystem) {
                        fileSystem.getDirectory(directory, {
                            create: true,
                            exclusive: false
                        }, function (directory) {
                            //You need to put the name you would like to use for the file here.
                            directory.getFile("Visits.xlsx", {
                                create: true,
                                exclusive: false
                            }, function (fileEntry) {
                                fileEntry.createWriter(function (writer) {
                                    writer.onwriteend = function () {
                                        alert("File written to" + directory.toURL())
                                    };
                                    writer.seek(0);
                                    writer.write(fileData); //You need to put the file, blob or base64 representation here.
                                }, errorCallback);
                            }, errorCallback);
                        }, errorCallback);
                    }, errorCallback);

                var errorCallback = function (e) {

                    console.log("Error: " + e)

                }
            },
            saveSpreadSheet: function (openedSpreadsheet, fileName, complete, error) {
                var that = this;
                openedSpreadsheet.saveToBlobAsync(function (blob) {
                    Log.call(Log.l.trace, "ExportXlsx.openedSpreadsheet.saveToBlobAsync.", "fileName=" + fileName);
                    that.showProgress(100);
                    try {
                        that.saveFile(fileName + ".xlsx", blob);
                        if (typeof complete === "function") {
                            complete({});
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "exception: " + (exception && exception.message));
                        if (typeof error === "function") {
                            error(exception);
                        }
                    }
                    Log.ret(Log.l.trace);
                });
            },
            writeResultToSheetData: function (sheetData, results, attribSpecs, colCount) {
                var that = this;
                var rowCount = results.length;
                Log.call(Log.l.trace, "ExportXlsx.", "rowCount=" + rowCount);
                that.progressFirst = that.progressNext;
                that.progressStep = rowCount / AppData.generalData.AnzahlKontakte * 100;
                that.progressNext += that.progressStep;

                var newCell, valueName, type, style, value;
                for (var r = 0; r < rowCount; r++) {
                    if (r == 0 || r == 1) {
                        var newRow = new XElement(S.row);
                        var row = results[r];
                        for (var c = 1; c < colCount; c++) {
                            if (!attribSpecs[c].hidden) {
                                var key = attribSpecs[c].ODataAttributeName;
                                value = row[key];
                                var attribTypeId = attribSpecs[c].AttribTypeID;
                                type = null;
                                style = null;
                                valueName = S.v;
                                if (typeof value === "undefined" ||
                                    value === null || value === "NULL") {
                                    value = "";
                                } else if (attribTypeId === 8 || attribTypeId === 6) { // timestamp or date
                                    var dateString = value.replace("\/Date(", "").replace(")\/", "");
                                    var milliseconds = parseInt(dateString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                                    var date = new Date(milliseconds);
                                    var year = date.getFullYear();
                                    var month = date.getMonth() + 1;
                                    var day = date.getDate();
                                    if (attribTypeId === 8) {
                                        var hour = date.getHours();
                                        var minute = date.getMinutes();
                                        value = year.toString() +
                                            ((month < 10) ? "-0" : "-") + month.toString() +
                                            ((day < 10) ? "-0" : "-") + day.toString() +
                                            ((hour < 10) ? "T0" : "T") + hour.toString() +
                                            ((minute < 10) ? ":0" : ":") + minute.toString() +
                                            "Z";
                                    } else {
                                        value = year.toString() +
                                            ((month < 10) ? "-0" : "-") + month.toString() +
                                            ((day < 10) ? "-0" : "-") + day.toString() +
                                            "T";
                                    }
                                    type = "d";
                                    style = 1;
                                } else if (attribTypeId === 3 || !attribTypeId) { // text
                                    valueName = S._is;
                                    type = "inlineStr";
                                    value = new XElement(S.t, value);
                                } else {
                                    type = "n";
                                }
                                newCell = new XElement(S.c, new XElement(valueName, value));
                                if (type) {
                                    newCell.setAttributeValue("t", type);
                                }
                                if (style) {
                                    newCell.setAttributeValue("s", style);
                                }
                                newRow.add(newCell);
                            }
                        }
                    }
                    else {
                        var newRow = new XElement(S.row);
                        var row = results[r];
                        for (var c = 1; c < colCount; c++) {
                            if (!attribSpecs[c].hidden) {
                                var key = attribSpecs[c].ODataAttributeName;
                                value = row[key];
                                if (key == "Erfassungsdatum" || key == "AenderungsDatum") {
                                    var attribTypeId = 6;
                                } else {
                                    var attribTypeId = attribSpecs[c].AttribTypeID;
                                }
                                type = null;
                                style = null;
                                valueName = S.v;
                                if (typeof value === "undefined" ||
                                    value === null || value === "NULL") {
                                    value = "";
                                } else if (attribTypeId === 8 || attribTypeId === 6) { // timestamp or date

                                    if (cr === false) {
                                        var dateString = value.replace("\/Date(", "").replace(")\/", "");
                                        var milliseconds = parseInt(dateString) - AppData.appSettings.odata.timeZoneAdjustment * 60000;
                                        var date = new Date(milliseconds);
                                        var year = date.getFullYear();
                                        var month = date.getMonth() + 1;
                                        var day = date.getDate();
                                        if (attribTypeId === 8) {
                                            var hour = date.getHours();
                                            var minute = date.getMinutes();
                                            value = year.toString() +
                                                ((month < 10) ? "-0" : "-") + month.toString() +
                                                ((day < 10) ? "-0" : "-") + day.toString() +
                                                ((hour < 10) ? "T0" : "T") + hour.toString() +
                                                ((minute < 10) ? ":0" : ":") + minute.toString() +
                                                "Z";
                                        } else {
                                            value = year.toString() +
                                                ((month < 10) ? "-0" : "-") + month.toString() +
                                                ((day < 10) ? "-0" : "-") + day.toString() +
                                                "T";
                                        }
                                    }
                                    else {
                                        value = value.substring(0, 16);

                                        function toDate(value) {
                                            var year = value.substring(0, 4);
                                            var month = value.substring(6, 7);
                                            var day = value.substring(9, 10);
                                            var hour = value.substring(11, 13);
                                            var minute = value.substring(14, 16);

                                            return new Date(year, month - 1, day, hour, minute);
                                        };

                                        value = toDate(value);
                                        var date = new Date();
                                        value = new Date(value - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);
                                    }
                                    type = "d";
                                    style = 1;
                                } else if (attribTypeId === 3 || !attribTypeId) { // text
                                    valueName = S._is;
                                    type = "inlineStr";
                                    value = new XElement(S.t, value);
                                } else {
                                    type = "n";
                                }
                                newCell = new XElement(S.c, new XElement(valueName, value));
                                if (type) {
                                    newCell.setAttributeValue("t", type);
                                }
                                if (style) {
                                    newCell.setAttributeValue("s", style);
                                }
                                newRow.add(newCell);
                            }
                        }
                    }
                    sheetData.add(newRow);
                }
                that.showProgress(that.progressNext);
                Log.ret(Log.l.trace);
            },
            selectNextViewData: function (nextUrl, dbView, attribSpecs, colCount, sheetData, openedSpreadsheet, fileName, complete, error) {
                Log.call(Log.l.trace, "ExportXlsx.");
                var that = this;
                dbView.selectNext(function (json) {
                    Log.print(Log.l.trace, "analysisListView: success!");
                    if (json && json.d && json.d.results) {
                        WinJS.Promise.timeout(50).then(function () {
                            that.writeResultToSheetData(sheetData, json.d.results, attribSpecs, colCount);
                        }).then(function () {
                            var nextUrl = dbView.getNextUrl(json);
                            if (nextUrl) {
                                Log.print(Log.l.trace, "analysisListView: fech more data...");
                                WinJS.Promise.timeout(0).then(function () {
                                    that.selectNextViewData(nextUrl, dbView, attribSpecs, colCount, sheetData, openedSpreadsheet, fileName, complete, error);
                                });
                            } else {
                                Log.print(Log.l.trace, "analysisListView: export file...");
                                that.saveSpreadSheet(openedSpreadsheet, fileName, complete, error);
                            }
                        });
                    } else {
                        Log.print(Log.l.error, "not data found");
                        if (typeof error === "function") {
                            error("not data found");
                        }
                    }
                }, function (errorResponse) {
                    Log.print(Log.l.error, "error: " + errorResponse.messageText);
                    if (typeof error === "function") {
                        error(errorResponse);
                    }
                }, null, nextUrl);
                Log.ret(Log.l.trace);
            },
            selectAllViewData: function (dbView, sheetData, openedSpreadsheet, fileName, complete, error, restriction, dbViewTitle) {
                var baseDbView = dbView.getDbView();
                Log.call(Log.l.trace, "ExportXlsx.", "relationName=" + baseDbView.relationName + " formatId=" + baseDbView.formatId);
                var resultsTitle = [];
                var that = this;
                var promise;
                if (dbViewTitle) {
                    promise = dbViewTitle.select(function (json) {
                        Log.print(Log.l.trace, "analysisListViewTitle: success!");
                        if (json && json.d && json.d.results && json.d.results.length > 0) {
                            resultsTitle = json.d.results;
                        }
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "error: " + errorResponse.messageText);
                        if (typeof error === "function") {
                            error(errorResponse);
                        }
                    });
                } else {
                    promise = WinJS.Promise.as();
                }
                if (!restriction) {
                    dbView.select(function (json) {
                        Log.print(Log.l.trace, "analysisListView: success!");
                        that.progressNext = 0;
                        that.showProgress(that.progressNext);
                        if (json && json.d && json.d.results) {
                            var results;
                            if (dbViewTitle) {
                                results = resultsTitle.concat(json.d.results);
                            } else {
                                results = json.d.results;
                            }

                            var attribSpecs = baseDbView.attribSpecs;
                            var colCount = attribSpecs.length;
                            if (baseDbView.relationName === "KontaktReport") {
                                cr = true;
                                for (var c = 0; c < colCount; c++) {
                                    var row = results[0];
                                    var key = attribSpecs[c].ODataAttributeName;
                                    var value = row && row[key];
                                    if (value && value !== "NULL") {
                                        attribSpecs[c].hidden = false;
                                    } else {
                                        attribSpecs[c].hidden = true;
                                    }
                                }
                            } else {
                                Log.print(Log.l.trace, colCount + " cloumns to export. Write column header...");
                                var newRow = new XElement(S.row);
                                for (var c = 1; c < colCount; c++) {
                                    var value = attribSpecs[c].Name;
                                    var type = null;
                                    var valueName = S.v;
                                    if (typeof value === "undefined" ||
                                        value === null) {
                                        value = "";
                                    } else {
                                        valueName = S._is;
                                        type = "inlineStr";
                                        value = new XElement(S.t, value);
                                    }
                                    var newCell;
                                    if (value !== "") {
                                        newCell = new XElement(S.c, new XElement(valueName, value));
                                        if (type) {
                                            newCell.setAttributeValue("t", type);
                                        }
                                        newRow.add(newCell);
                                    }
                                }
                            }
                            sheetData.replaceAll(newRow);
                            that.progressNext = that.progressNext + 1;
                            that.showProgress(that.progressNext); //35 / 36
                            Log.print(Log.l.trace, colCount + "write row data...");
                            WinJS.Promise.timeout(50).then(function () {
                                that.writeResultToSheetData(sheetData, results, attribSpecs, colCount);
                            }).then(function () {
                                var nextUrl = dbView.getNextUrl(json);
                                if (nextUrl) {
                                    Log.print(Log.l.trace, "analysisListView: fech more data...");
                                    WinJS.Promise.timeout(0).then(function () {
                                        that.selectNextViewData(nextUrl, dbView, attribSpecs, colCount, sheetData, openedSpreadsheet, fileName, complete, error);
                                    });
                                } else {
                                    Log.print(Log.l.trace, "analysisListView: export file...");
                                    that.saveSpreadSheet(openedSpreadsheet, fileName, complete, error);
                                }
                            });
                        } else {
                            Log.print(Log.l.error, "not data found");
                            if (typeof error === "function") {
                                error("not data found");
                            };
                        }
                    }, function (errorResponse) {
                        Log.print(Log.l.error, "error: " + errorResponse.messageText);
                        if (typeof error === "function") {
                            error(errorResponse);
                        }
                    }, { GenPassword: ["NOT NULL"] });
                }
                Log.ret(Log.l.trace);
            },
            saveXlsxFromView: function (dbView, fileName, complete, error, restriction, dbViewTitle, temp) {
                Log.call(Log.l.trace, "ExportXlsx.");
                /*if (fileName === "BenutzerdefinierterReport" || fileName === "CostumReport") {
                    this.template = temp;
                } else {
                    this.template = this.templateSpreadsheet;
                }*/
                this.template = this.templateSpreadsheet;
                if (!this.xlsx) {
                    Log.ret(Log.l.error, "OpenXmlPackage not created");
                    return;
                }
                if (typeof this.xlsx.openFromBase64Async !== "function") {
                    Log.ret(Log.l.error, "openFromBase64Async not supported");
                    return;
                }
                var that = this;

                //this.showProgress(1);
                that.xlsx.openFromBase64Async(that.template, function (openedSpreadsheet) {
                    Log.call(Log.l.trace, "ExportXlsx.loadXlsxFromView.openFromBase64Async.");
                    try {
                        var workbookPart = openedSpreadsheet.workbookPart();
                        var workbookStylesPart = workbookPart.workbookStylesPart();
                        var stXDoc = workbookStylesPart.getXDocument();
                        var stylesheet = stXDoc.element(S.styleSheet);
                        if (stylesheet) {
                            /*
                            var numFmts = new XElement(S.numFmts);
                            var numFmt = new XElement(S.numFmt);
                            numFmt.setAttributeValue("numFmtId", 201);
                            numFmt.setAttributeValue("formatCode", "dd.mm.yyyy hh:mm");
                            numFmts.add(numFmt);
                            numFmt = new XElement(S.numFmt);
                            numFmt.setAttributeValue("numFmtId", 202);
                            numFmt.setAttributeValue("formatCode", "dd.mm.yyyy");
                            numFmts.add(numFmt);
                            stylesheet.setElementValue("numFmts", numFmts);
                             */

                            /*
                            var cellStyleXfs = stylesheet.element(S.cellStyleXfs);
                            var xfCount = cellStyleXfs.nodesArray && cellStyleXfs.nodesArray.length;
                            var xf = new XElement(S.xf);
                            xf.setAttributeValue("borderId", 0);
                            xf.setAttributeValue("fillId", 0);
                            xf.setAttributeValue("fontId", 0);
                            xf.setAttributeValue("numFmtId", 22);
                            xf.setAttributeValue("applyNumberFormat", true);
                            cellStyleXfs.add(xf);
                            xf = new XElement(S.xf);
                            xf.setAttributeValue("borderId", 0);
                            xf.setAttributeValue("fillId", 0);
                            xf.setAttributeValue("fontId", 0);
                            xf.setAttributeValue("numFmtId", 202);
                            xf.setAttributeValue("applyNumberFormat", true);
                            cellStyleXfs.add(xf);
                             */

                            var cellXfs = stylesheet.element(S.cellXfs);
                            var xf = new XElement(S.xf);
                            xf.setAttributeValue("borderId", 0);
                            xf.setAttributeValue("fillId", 0);
                            xf.setAttributeValue("fontId", 0);
                            xf.setAttributeValue("numFmtId", 22);
                            xf.setAttributeValue("applyNumberFormat", true);
                            //xf.setAttributeValue("xfId", xfCount.toString());
                            cellXfs.add(xf);
                            /*
                            xfCount++;
                            xf = new XElement(S.xf);
                            xf.setAttributeValue("borderId", 0);
                            xf.setAttributeValue("fillId", 0);
                            xf.setAttributeValue("fontId", 0);
                            xf.setAttributeValue("numFmtId", 202);
                            xf.setAttributeValue("applyNumberFormat", true);
                            xf.setAttributeValue("xfId", xfCount.toString());
                            cellXfs.add(xf);
                             */
                        }
                        var wbXDoc = workbookPart.getXDocument();
                        var sheetElement = wbXDoc.root
                            .element(S.sheets)
                            .elements(S.sheet)
                            .firstOrDefault();
                        if (sheetElement) {
                            var id = sheetElement.attribute(R.id).value;
                            var worksheetPart = workbookPart.getPartById(id);
                            var wsXDoc = worksheetPart.getXDocument();
                            var sheetData = wsXDoc.descendants(S.sheetData).firstOrDefault();
                            if (sheetData) {
                                that.selectAllViewData(dbView, sheetData, openedSpreadsheet, fileName, complete, error, restriction, dbViewTitle, temp);
                            } else {
                                if (typeof error === "function") {
                                    error("no sheetData found in Excel template!");
                                }
                            }
                        }
                    } catch (exception) {
                        Log.print(Log.l.error, "exception: " + (exception && exception.message));
                        if (typeof error === "function") {
                            error(exception);
                        }
                    }
                    Log.ret(Log.l.trace);
                });
                Log.ret(Log.l.trace);
            },
            templateSpreadsheet:
    "UEsDBBQABgAIAAAAIQD21qXvWgEAABgFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAAC" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADM" +
    "lMtuwyAQRfeV+g+IbWWTpFJVVXGy6GPZZpF+ADVjGwUDYkia/H3H5LGo3FRRIrUbI8PMPRcYZjxd" +
    "t4atIKB2tuDDfMAZ2NIpbeuCv89fsnvOMEqrpHEWCr4B5NPJ9dV4vvGAjLItFryJ0T8IgWUDrcTc" +
    "ebC0UrnQyki/oRZelgtZgxgNBneidDaCjVnsNPhk/ASVXJrIntc0vXUSwCBnj9vAjlVw6b3RpYzk" +
    "VKys+kbJdoScMlMMNtrjDdngopfQrfwM2OW90dEErYDNZIivsiUbYm3EpwuLD+cW+XGRHpeuqnQJ" +
    "ypXLlk4gRx9AKmwAYmvyNOat1Hbv+wg/BaNIw/DCRrr9JeETfYz+iY/bP/IRqf5BpO/5V5JkfrkA" +
    "jBsDeOkyTKLHyFS/s+A80ksOcDp9/1S77MyTEISo4fBY+4r+QKQucPZ2oeszClQPW6S+NvkCAAD/" +
    "/wMAUEsDBBQABgAIAAAAIQC1VTAj9AAAAEwCAAALAAgCX3JlbHMvLnJlbHMgogQCKKAAAgAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArJJNT8Mw" +
    "DIbvSPyHyPfV3ZAQQkt3QUi7IVR+gEncD7WNoyQb3b8nHBBUGoMDR3+9fvzK2908jerIIfbiNKyL" +
    "EhQ7I7Z3rYaX+nF1ByomcpZGcazhxBF21fXV9plHSnkodr2PKqu4qKFLyd8jRtPxRLEQzy5XGgkT" +
    "pRyGFj2ZgVrGTVneYviuAdVCU+2thrC3N6Dqk8+bf9eWpukNP4g5TOzSmRXIc2Jn2a58yGwh9fka" +
    "VVNoOWmwYp5yOiJ5X2RswPNEm78T/XwtTpzIUiI0Evgyz0fHJaD1f1q0NPHLnXnENwnDq8jwyYKL" +
    "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",
            spreadsheetToSave: null,
            xlsx: null,
            template: null

        })
    });

}());