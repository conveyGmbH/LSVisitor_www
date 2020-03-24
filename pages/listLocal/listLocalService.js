// service for page: listLocal
/// <reference path="~/www/lib/convey/scripts/strings.js" />
/// <reference path="~/www/lib/convey/scripts/logging.js" />
/// <reference path="~/www/lib/convey/scripts/dataService.js" />


(function () {
    "use strict";

    WinJS.Namespace.define("ListLocal", {
        _VApp_VisitView: {
            get: function () {
                var ret = AppData.getFormatView("VApp_Visit", 0);
                ret.maxPageSize = 500;
                return ret;
            }
        },
        VApp_VisitView: {
            update: function (complete, error, recordId, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = ListLocal._VApp_VisitView.update(complete, error, recordId, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            }
        },
        _contactView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20606); /*20601*/
                ret.maxPageSize = 20;
                return ret;
            }
        },
        _contactInsertView: {
            get: function () {
                return AppData.getFormatView("Kontakt", 0);
            }
        },
        contactView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Erfassungsdatum",
                    desc: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ListLocal.");
                var ret = ListLocal._contactView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getDbView: function () {
                return ListLocal._contactView;
            },
            insert: function (complete, error, viewResponse) {
                Log.call(Log.l.trace, "contactView.");
                var ret = ListLocal._contactInsertView.insert(complete, error, viewResponse);
                Log.ret(Log.l.trace);
                return ret;
            },
            defaultValue: {
                Titel: "",
                Vorname: "",
                Vorname2: "",
                Name: "",
                Position: "",
                Firmenname: "",
                Strasse: "",
                PLZ: "",
                Stadt: "",
                TelefonFestnetz: "",
                TelefonMobil: "",
                Fax: "",
                EMail: "",
                WebAdresse: "",
                Bemerkungen: "",
                Freitext1: "",
                HostName: (window.device && window.device.uuid),
                INITAnredeID: 0,
                INITLandID: 0,
                CreatorSiteID: "",
                CreatorRecID: ""
            }
        },
        _contactDocView: {
            get: function () {
                var ret = AppData.getFormatView("Kontakt", 20500);
                ret.maxPageSize = 20;
                return ret;
            }
        },
        contactDocView: {
            select: function (complete, error, restriction) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.select(complete, error, restriction, {
                    ordered: true,
                    orderAttribute: "Erfassungsdatum",
                    desc: true
                });
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            },
            getNextUrl: function (response) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.getNextUrl(response);
                Log.ret(Log.l.trace);
                return ret;
            },
            selectNext: function (complete, error, response, nextUrl) {
                Log.call(Log.l.trace, "ContactList.");
                var ret = ListLocal._contactDocView.selectNext(complete, error, response, nextUrl);
                // this will return a promise to controller
                Log.ret(Log.l.trace);
                return ret;
            }
        }
    });
})();

