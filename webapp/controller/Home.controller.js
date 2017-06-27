sap.ui.define([
	'jquery.sap.global',
	'sap/m/MessageToast',
	'sap/ui/core/Fragment',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/Filter',
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/FilterOperator",
	"sap/m/TablePersoController",
	'sap/ui/core/util/Export',
		'sap/ui/core/util/ExportTypeCSV',
		'sap/m/MessageBox',
		'sap/ui/core/routing/History'


], function(jQuery, MessageToast, Fragment, Controller, Filter, JSONModel, ResourceModel, FilterOperator,TablePersoController,Export,ExportTypeCSV,MessageBox,History) {
	"use strict";
	var paging = new JSONModel({
		"latest": "",
		"oldest": "",
		"pageLimit": 10
	});
	var sortmodel = new JSONModel({
		sort: [{
			"title": "Username"
		}, {
			"title": "Userid"
		}, {
			"title": "Email"
		}, {
			"title": "Phone number"
		}, {
			"title": "Message"
		}]
	});
	var initPage;
	var latest="";
	var oldest="";
	var CController = Controller.extend("BlackBird_v1.controller.Home", {

		onInit: function() {
			var sortmodel = new JSONModel({
				sort: [{
					"title": "Username"
				}, {
					"title": "Userid"
				}, {
					"title": "Email"
				}, {
					"title": "Phone number"
				}, {
					"title": "Message"
				}]
			});
			var oData = {
				surl: ""
			};
			this.getView().setModel(sortmodel);
			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);
			var i18nModel = new ResourceModel({
				bundleName: "BlackBird_v1.i18n.i18n"
			});
			var oRouters = sap.ui.core.UIComponent.getRouterFor(this);
            oRouters.getRoute("currentmarket").attachPatternMatched(this._onObjectMatched, this);
            
			this.getView().setModel(i18nModel, "i18n");
			var oMessages = new JSONModel();
			this.getView().setModel(oMessages, "messages");
			this.getView().setModel(paging, "pageData");
			initPage = true;
			
		},
		_onObjectMatched: function (oEvent) {
            var obj = oEvent.getParameter("arguments").details;
            obj=obj.replace("\"","");
            obj=obj.replace("\"","");
            this.getView().byId("text").setText(obj);
        },
		
		onLogClick: function(oEvent) {
            
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.getView().unbindElement();
			oRouter.navTo("login");
		},
		nextpage: function() {
			var latest = this.getView().getModel("pageData").getProperty("/latest");
			this._loadChannelMessages(latest, "");

		},
		onMenuCick: function(oEvent) {
			var sideNavigation = this.getView().byId("SplitAppDemo");

			if (sideNavigation.getMode() == "ShowHideMode" || sideNavigation.getMode() == "StretchCompressMode") {
				sideNavigation.setMode(sap.m.SplitAppMode.HideMode);
			} else {
				sideNavigation.setMode(sap.m.SplitAppMode.StretchCompressMode);
			}
		},

		autohide: function(oEvent) {
			var sideNavigation = this.getView().byId("SplitAppDemo");

			sideNavigation.setMode(sap.m.SplitAppMode.HideMode);

		},

		onPressDetailBack: function() {
			this.getSplitAppObj().backDetail();
		},
		prevpage: function() {
			var oldest = this.getView().getModel("pageData").getProperty("/oldest");
			this._loadChannelMessages("", oldest);
		},
		getSplitAppObj: function() {
			var result = this.byId("SplitAppDemo");
			if (!result) {
				jQuery.sap.log.info("SplitApp object can't be found");
			}
			return result;
		},
		onListItemPress: function(oEvent) {
			var sToPageId = oEvent.getParameter("listItem").getCustomData()[0].getValue();

			this.getSplitAppObj().toDetail(this.createId(sToPageId));
		},
		onValueHelpRequest: function(oEvent) {
			this.getView().setModel(sortmodel);

			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("BlackBird_v1.view.dialog1", this);
				this.getView().addDependent(this._oDialog);
				this._oDialog.addStyleClass("sapUiSizeCompact");
			}
			this._oDialog.open();
		},
		handleClose: function(oEvent) {
			var property = oEvent.getParameter("selectedItem").getBindingContext().getObject();
			var oView = this.getView();
			var oTable = oView.byId("table");
			var oBinding = oTable.getBinding("items");
			var sortval;
			if (property.title === "Username") {
				sortval = "messages>userDetails/profile/real_name";
			} else if (property.title === "Userid") {
				sortval = "messages>user";
			} else if (property.title === "Email") {
				sortval = "messages>userDetails/profile/email";
			} else if (property.title === "Phone number") {
				sortval = "messages>userDetails/profile/phone";
			} else if (property.title === "Message") {
				sortval = "messages>text";
			}
			var aSorters = [];
			var sPath = sortval;
			var bDescending = true;
			var GROUP = false;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, GROUP));
			oBinding.sort(aSorters);

		},

		onValueHelp: function(oEvent) {
			if (!this._oDialoga) {
				this._oDialoga = sap.ui.xmlfragment("BlackBird_v1.view.dialog2", this);
				this.getView().addDependent(this._oDialoga);
				this._oDialoga.addStyleClass("sapUiSizeCompact");
			}
			this._oDialoga.open();
		},
		onFilterInvoices: function(oEvent) {

			// build filter array
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("userDetails/real_name", FilterOperator.Contains, sQuery));
			}

			// filter binding
			var oList = this.getView().byId("table");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
		},
		handleSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("title", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		onExport : sap.m.Table.prototype.exportData || function(oEvent) {
 
			var oExport = new Export({
 
				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType : new ExportTypeCSV({
					separatorChar : ","
				}),
 
				// Pass in the model created above
				models : this.getView().getModel("messages"),
				rows : {
					path : "/data"
				},
				columns : [{
					name : "Username",
					template : {
						content : "{userDetails/real_name}"
					}
				}, {
					name : "User ID",
					template : {
						content : "{user}"
					}
				}, {
					name : "Email",
					template : {
						content : "{userDetails/profile/email}"
					}
				}, {
					name : "Phone",
					template : {
						content : "{userDetails/profile/phone}"
					}
				}, {
					name : "Message",
					template : {
						content : "{text}"
					}
				}]
			});
 
			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		}




	});

	return CController;

});
