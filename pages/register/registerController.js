// controller for page: register
/// <reference path="~/www/lib/WinJS/scripts/base.js" />
/// <reference path="~/www/lib/WinJS/scripts/ui.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/appSettings.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />
/// <reference path="~/www/lib/convey/scripts/appbar.js" />
/// <reference path="~/www/lib/convey/scripts/pageController.js" />
/// <reference path="~/www/scripts/generalData.js" />
/// <reference path="~/www/pages/register/registerService.js" />

(function () {
    "use strict";

    WinJS.Namespace.define("Register", {
        Controller: WinJS.Class.derive(Application.Controller, function Controller(pageElement, commandList) {
            Log.call(Log.l.trace, "Register.Controller.");
            Application.Controller.apply(this, [pageElement, {
                dataRegister: getEmptyDefaultValue(Register.registerView.defaultValue),
                InitLandItem: { InitLandID: 0, TITLE: "" },
                emailOkFlag: null,
                registerOkFlag: null
            }, commandList]);

            var that = this;

            // select combo
            var initLand = pageElement.querySelector("#InitLand");

            var checkIPhoneBug = function () {
                if (navigator.appVersion) {
                    var testDevice = ["iPhone OS", "iPod OS"];
                    for (var i = 0; i < testDevice.length; i++) {
                        var iPhonePod = navigator.appVersion.indexOf(testDevice[i]);
                        if (iPhonePod >= 0) {
                            return true;
                        }
                    }
                }
                return false;
            };
            var isAppleDevice = checkIPhoneBug();

            var privacyPolicyLink = pageElement.querySelector("#privacyPolicyLink");
            //window.open funktioniert auf windows nicht, da wird daraus ein x-onlick generiert im html
            if (privacyPolicyLink) {
                if (isAppleDevice) {
                    privacyPolicyLink.innerHTML = "<a onclick=\"window.open(\'" + getResourceText("login.privacyPolicyLink") + "\', \'_system\'); return false;\"href=\"#\">" + getResourceText("register.privacyPolicy") + "</a>";
                } else {
                    privacyPolicyLink.innerHTML = "<a class=\"checkbox\" href=\"" + getResourceText("login.privacyPolicyLink") + "\" target=\"_blank\">" + getResourceText("register.privacyPolicy") + "</a>";
                }
            }

            var getEmailOkFlag = function () {
                if (that.binding.dataRegister &&
                    (that.binding.dataRegister.ErfassungsStatus === 1 ||
                     that.binding.dataRegister.Freischaltung > 0)) {
                    return 1;
                } else {
                    return null;
                }
            };
            this.getEmailOkFlag = getEmailOkFlag;

            var getRegisterOkFlag = function () {
                if (that.binding.dataRegister &&
                    that.binding.dataRegister.Freischaltung === 3 &&
                    that.binding.dataRegister.ErfassungsStatus === 1) {
                    return 1;
                } else {
                    return null;
                }
            };
            this.getRegisterOkFlag = getRegisterOkFlag;

            var setDataRegister = function (newDataRegister) {
                var i, registerEmail, registerAddress, registerComplete;
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.dataRegister = newDataRegister;
                if (that.binding.dataRegister.Newsletterflag) {
                    that.binding.dataRegister.NewsletterflagChecked = true;
                } else {
                    that.binding.dataRegister.NewsletterflagChecked = false;
                }
                that.binding.emailOkFlag = that.getEmailOkFlag();
                that.binding.registerOkFlag = that.getRegisterOkFlag();
                if (that.binding.dataRegister.ErfassungsStatus === 0 &&
                    that.binding.dataRegister.Freischaltung === 0) {
                    registerAddress = pageElement.querySelectorAll(".register-address");
                    if (registerAddress && registerAddress.length > 0) {
                        for (i = 0; i < registerAddress.length; i++) {
                            if (registerAddress[i].style) {
                                registerAddress[i].style.display = "inline";
                                registerAddress[i].style.visibility = "visible";
                            }
                        }
                        //WinJS.UI.Animation.enterContent(registerAddress, null, { mechanism: "transition" });
                        WinJS.UI.Animation.slideUp(registerAddress);
                    }
                }
                if (that.binding.dataRegister.ErfassungsStatus === 1 &&
                    that.binding.dataRegister.Freischaltung === 0) {
                    that.binding.dataRegister.Freischaltung = 2;
                    /*registerEmail = pageElement.querySelectorAll(".register-email");
                    if (registerEmail && registerEmail.length > 0) {
                        WinJS.UI.Animation.exitContent(registerEmail, null).then(function() {
                            for (i = 0; i < registerEmail.length; i++) {
                                if (registerEmail[i].style) {
                                    registerEmail[i].style.visibility = "hidden";
                                    registerEmail[i].style.display = "none";
                                }
                            }
                        });
                    }
                    if (that.binding.dataRegister.Freischaltung === 2) {
                    registerAddress = pageElement.querySelectorAll(".register-address");
                    if (registerAddress && registerAddress.length > 0) {
                        for (i = 0; i < registerAddress.length; i++) {
                            if (registerAddress[i].style) {
                                registerAddress[i].style.display = "inline";
                                registerAddress[i].style.visibility = "visible";
                            }
                        }
                        //WinJS.UI.Animation.enterContent(registerAddress, null, { mechanism: "transition" });
                        WinJS.UI.Animation.slideUp(registerAddress);
                    }
                    }*/
                }
                if (that.binding.dataRegister.Freischaltung === 3) {
                    registerAddress = pageElement.querySelectorAll(".register-address");
                    if (registerAddress && registerAddress.length > 0) {
                        WinJS.UI.Animation.exitContent(registerAddress, null).then(function () {
                            for (i = 0; i < registerAddress.length; i++) {
                                if (registerAddress[i].style) {
                                    registerAddress[i].style.visibility = "hidden";
                                    registerAddress[i].style.display = "none";
                                }
                            }
                        });
                    }
                    registerComplete = pageElement.querySelectorAll(".register-complete");
                    if (registerComplete && registerComplete.length > 0) {
                        for (i = 0; i < registerComplete.length; i++) {
                            if (registerComplete[i].style) {
                                registerComplete[i].style.display = "inline";
                                registerComplete[i].style.visibility = "visible";
                            }
                        }
                        WinJS.UI.Animation.enterContent(registerComplete, null, { mechanism: "transition" });
                        WinJS.UI.Animation.slideUp(registerComplete);
                    }
                }
                if (typeof that.binding.dataRegister.Email === "undefined" || that.binding.dataRegister.Email === null) {
                    that.binding.dataRegister.Email = "";
                }
                if (that.binding.dataRegister.MessageText) {
                    AppData.setErrorMsg(that.binding, that.binding.dataRegister.MessageText);
                }
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setDataRegister = setDataRegister;

            var setInitLandItem = function (newInitLandItem) {
                var prevNotifyModified = AppBar.notifyModified;
                AppBar.notifyModified = false;
                that.binding.InitLandItem = newInitLandItem;
                AppBar.modified = false;
                AppBar.notifyModified = prevNotifyModified;
            }
            this.setInitLandItem = setInitLandItem;

            // define handlers
            this.eventHandlers = {
                clickOk: function (event) {
                    Log.call(Log.l.trace, "Register.Controller.");
                    that.saveData(function (response) {
                        // called asynchronously if ok
                    },
                        function (errorResponse) {
                        // called asynchronously on error
                    });
                    Log.ret(Log.l.trace);
                },
                clickListStartPage: function (event) {
                    Log.call(Log.l.trace, "Register.Controller.");
                    Application.navigateById("listLocal", event);
                    Log.ret(Log.l.trace);
                },
                clickRegisterPrivacyPolicy: function (event) {
                    Log.call(Log.l.trace, "Register.Controller.");
                    /**
                     * dataRegister.Email
                     */
                    if (event && (event.target)) {
                        that.binding.dataRegister.registerprivacyPolicyFlag = event.target.checked;
                        AppBar.triggerDisableHandlers();
                    }
                    Log.ret(Log.l.trace);
                }
            };

            this.disableHandlers = {
                clickOk: function () {
                    if ((!that.binding.dataRegister.Freischaltung ||
                        that.binding.dataRegister.Freischaltung < 3) && that.binding.dataRegister.registerprivacyPolicyFlag) {
                        return AppBar.busy;
                    } else {
                        return true;
                    }
                },
                clickRegisterPrivacyPolicy: function () {
                    that.binding.registerDisabled = AppBar.busy ||
                        (that.binding.dataRegister.Email.length === 0 || !that.binding.dataRegister.registerprivacyPolicyFlag);
                    if (!that.binding.dataRegister.Email) {
                        that.binding.dataRegister.registerprivacyPolicyFlag = false;
                    }
                    return that.binding.registerDisabled;
                }
            }

            var loadData = function () {
                Log.call(Log.l.trace, "Register.Controller.");
                AppData.setErrorMsg(that.binding);
                var ret = new WinJS.Promise.as().then(function () {
                    if (!Register.initLandView.getResults().length) {
                        Log.print(Log.l.trace, "calling select initLandData...");
                        //@nedra:25.09.2015: load the list of INITLand for Combobox
                        return Register.initLandView.select(function (json) {
                            // this callback will be called asynchronously
                            // when the response is available
                            Log.print(Log.l.trace, "initLandView: success!");
                            if (json && json.d && json.d.results) {
                                // Now, we call WinJS.Binding.List to get the bindable list
                                if (initLand && initLand.winControl) {
                                    initLand.winControl.data = new WinJS.Binding.List(json.d.results);
                                }
                            }
                        }, function (errorResponse) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            AppData.setErrorMsg(that.binding, errorResponse);
                        });
                    } else {
                        if (initLand && initLand.winControl) {
                            initLand.winControl.data = new WinJS.Binding.List(Register.initLandView.getResults());
                        }
                        return WinJS.Promise.as();
                    }
                });
                Log.ret(Log.l.trace);
                return ret;
            }
            this.loadData = loadData;

            var saveData = function (complete, error) {
                var err;
                Log.call(Log.l.trace, "Register.Controller.");
                // convert bool to int!
                if (that.binding.dataRegister.NewsletterflagChecked) {
                    that.binding.dataRegister.Newsletterflag = 1;
                } else {
                    that.binding.dataRegister.Newsletterflag = 0;
                }
                // reset ErfassungsStatus!
                that.binding.dataRegister.ErfassungsStatus = 0;
                AppData.setErrorMsg(that.binding);
                AppBar.busy = true;
                var ret = Register.registerView.insert(function (json) {
                    AppBar.busy = false;
                    // this callback will be called asynchronously
                    // when the response is available
                    // loginData returns object already parsed from json file in response
                    if (json && json.d) {
                        that.setDataRegister(json.d);
                    } else {
                        err = { status: 404, statusText: "no data found" };
                        AppData.setErrorMsg(that.binding, err);
                        error(err);
                    }
                    return WinJS.Promise.as();
                }, function (errorResponse) {
                    AppBar.busy = false;
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    AppData.setErrorMsg(that.binding, errorResponse);
                    error(errorResponse);
                    return WinJS.Promise.as();
                }, that.binding.dataRegister);
                Log.ret(Log.l.trace);
                return ret;
            }
            this.saveData = saveData;
            
            that.setDataRegister(getEmptyDefaultValue(Register.registerView.defaultValue));
            that.binding.dataRegister.LanguageID = AppData.getLanguageId();
            that.binding.dataRegister.AccountType = "VISITOR";
            Log.print(Log.l.trace, "LanguageID=" + that.binding.dataRegister.LanguageID);

            that.processAll().then(function () {
                Log.print(Log.l.trace, "Binding wireup page complete");
                return that.loadData();
            }).then(function () {
                AppBar.notifyModified = true;
                Log.print(Log.l.trace, "Data loaded");
            });
            Log.ret(Log.l.trace);
        })
    });
})();


