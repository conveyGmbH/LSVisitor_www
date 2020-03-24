﻿// controller for page: barcodeEdit
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/barcodeEdit/barcodeEditService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("BarcodeEdit", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "BarcodeEdit.Controller.");
            Application.Controller.apply(this, [pageElement, {
                barcode: "",
                contact: { KontaktVIEWID: 0 }
            }, commandList]);

            var that = this;

            // define handlers
            this.eventHandlers = {
                clickBack: function (event) {
                    if (WinJS.Navigation.canGoBack === true) {
                        WinJS.Navigation.back(1).done( /* Your success and error handlers */);
                    }
                },
                clickChangeUserState: function (event) {
                    Log.call(Log.l.trace, "BarcodeEdit.Controller.");
                    Application.navigateById("userinfo", event);
                    Log.ret(Log.l.trace);
                },
                clickForward: function (event) {
                    Log.call(Log.l.trace, "BarcodeEdit.Controller.");
                    if (that.binding.barcode) {
                        Application.navigateById("questionnaire", event);
                    }
                    Log.ret(Log.l.trace);
                },
                clickListStartPage: function (event) {
                    Log.call(Log.l.trace, "ListLocal.Controller.");
                    Application.navigateById("listLocal", event);
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickBack: function () {
                    if (WinJS.Navigation.canGoBack === true) {
                        return false;
                    } else {
                        return true;
                    }
                },
                clickForward: function () {
                    return AppBar.busy;
                }
            }

            var saveData = function (complete, error) {
                var barcode = that.binding.barcode;
                Log.call(Log.l.trace, "BarcodeEdit.Controller.", "barcode=" + barcode);
                var ret = new WinJS.Promise.as().then(function() {
                    if (barcode) {
                        var newContact = {
                            HostName: (window.device && window.device.uuid),
                            MitarbeiterID: AppData.generalData.getRecordId("Mitarbeiter"),
                            VeranstaltungID: AppData.generalData.getRecordId("Veranstaltung"),
                            Nachbearbeitet: 1
                        };
                        Log.print(Log.l.trace, "insert new contactView for MitarbeiterID=" + newContact.MitarbeiterID);
                        AppData.setErrorMsg(that.binding);
                        return BarcodeEdit.contactView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "contactView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                that.binding.contact = json.d;
                                AppData.generalData.setRecordId("Kontakt", that.binding.contact.KontaktVIEWID);
                                AppData.getUserData();
                            } else {
                                var err = { status: 404, statusText: "no data found" };
                                AppData.setErrorMsg(that.binding, err);
                                error(err);
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                        }, newContact);
                    } else {
                        Log.print(Log.l.error, "no barcode");
                        complete({});
                        return WinJS.Promise.as();
                    }
                }).then(function () {
                    if (that.binding.contact.KontaktVIEWID) {
                        var newBarcode = {
                            Request_Barcode: barcode,
                            KontaktID: that.binding.contact.KontaktVIEWID
                        };
                        //load of format relation record data
                        Log.print(Log.l.trace, "insert new barcodeView for KontaktID=" + newBarcode.KontaktID);
                        return BarcodeEdit.barcodeView.insert(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "barcodeView: success!");
                            // contactData returns object already parsed from json file in response
                            if (json && json.d) {
                                AppData.generalData.setRecordId("ImportBarcodeScan", json.d.ImportBarcodeScanVIEWID);
                                AppData._barcodeType = "barcode";
                                AppData._barcodeRequest = barcode;
                                WinJS.Promise.timeout(0).then(function () {
                                    // accelarate replication
                                    if (AppData._persistentStates.odata.useOffline && AppRepl.replicator) {
                                        var numFastReqs = 10;
                                        AppRepl.replicator.run(numFastReqs);
                                    }
                                });
                                complete(json);
                            } else {
                                var err = { status: 404, statusText: "no data found" };
                                AppData.setErrorMsg(that.binding, err);
                                error(err);
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                            error(errorResponse);
                        }, newBarcode);
                    } else {
                        Log.print(Log.l.trace, "no KontaktVIEWID");
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;

            AppData.setErrorMsg(that.binding);

            that.processAll().then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Binding wireup page complete");
                WinJS.Promise.timeout(50).then(function() {
                    var inputFields = pageElement.querySelectorAll(".input_field");
                    if (inputFields && inputFields[0]) {
                        inputFields[0].focus();
                    }
                });
            });
            Log.ret(Log.l.trace);
        })
    });
})();






