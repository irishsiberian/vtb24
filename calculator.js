/// <reference path="http://cdnjs.cloudflare.com/ajax/libs/knockout/3.0.0/knockout-min.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.10.2.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.10.2-vsdoc.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.10.2.min.map" />

define(
    [
        'knockout',
        'underscore',
        'float_input_control',
        'integer_input_control',
        'label_control',
        'money_input_control',
        'selector_control',
        'checkbox-labeled-control',
        'toggle_control',
        'autobrand-selector-control',
        'slider-control',
        'checkbox_control',
        'tooltip_control',
        'announcement_control',
        'content-switcher-control',
        'number-placeholdered-input-control',
        'control-filter-calculation-model',
        'field',
        'credit_amounts_calculation_model',
        'currency_calculation_model',
        'currency_calculation_model_v2',
        'visibility_calculation_model',
        'announcement_calculation_model',
        'value_dependency_calculation_model',
        'value_reset_calculation_model',
        'additional_controls_model',
        'switch-content-calculation-model',
        'focus-calculation-model',
        'disable-control-calculation-model',
        'dropdown-items-calculation-model',
        'rko-results-model',
        'base-results-model',
        'tooltip_helper',
        'common.helper'
    ],
    function (
        ko,
        _,
        FloatInputControl,
        IntegerInputControl,
        LabelControl,
        MoneyInputControl,
        SelectorControl,
        CheckboxWithLabelControl,
        ToggleControl,
        AutobrandSelectorControl,
        SliderControl,
        CheckboxControl,
        TooltipControl,
        AnnouncementControl,
        ContentSwitcherControl,
        NumberInputWithPlaceholderControl,
        ControlFilterCalculationModel,
        Field,
        CreditAmountsCalculationModel,
        CurrencyCalculationModel,
        CurrencyCalculationModelV2,
        VisibilityCalculationModel,
        AnnouncementCalculationModel,
        ValueDependencyCalculationModel,
        ValueResetCalculationModel,
        AdditionalControlsModel,
        SwitchContentCalculationModel,
        ControlFocusCalculationModel,
        ControlDisableCalculationModel,
        DropdownItemsCalculationModel,
        RkoResultsModel,
        BaseResultsModel,
        TooltipHelper,
        helper
    ) {

        var calculator = function (calculatorFormData, productData) {

            var me = this;

            me.ToLog = function (message) {
                helper.Log("calculator.js: " + message);
            };
            me.RaiseError = function (message) {
                throw new Error(message);
            };

            me.ProductButtonsBuilt = ko.observable(false);
            if (productData != null) {
                me.ButtonSettings = ko.observableArray(productData.ButtonSettings);

            } else {
                me.ButtonSettings = ko.observableArray([]);
            }

            if (calculatorFormData == null) {
                me.CalculatorIsNull = true;
                me.InitializeData = function () {
                    if (me.ButtonSettings != null && me.ButtonSettings().length > 0)
                        me.ProductButtonsBuilt(true);
                };
                me.ToLog("Calculator is disabled");
                return;
            } else {
                me.CalculatorIsNull = false;
            }

            me.CalculatorFormData = calculatorFormData;
            me.ContentBlocks = [];
            me.Fields = ko.observableArray([]);
            me.Controls = ko.observableArray([]);
            me.FieldPDFItems = [];
            me.TemplateName = null;

            me.Results = ko.observableArray([]);
            me.ResultProduct = ko.observable(null);
            me.ResultProductsEqualPriority = ko.observableArray([]);
            me.ResultAsMessage = ko.observable(null);
            me.ResultsModel = null;

            me.IsProductHelperWeb = calculatorFormData.IsProductHelperWeb;
            me.WebUrl = calculatorFormData.WebUrl;
            me.LocalStorageKey = "CalculatorFieldsData" + calculatorFormData.WebUrl;
            me.AddControls = ko.observableArray([]);
            me.AdditionalParametersExpanded = ko.observable(false);
            me.ButtonMenuOpened = ko.observable(false);
            me.CalculationModels = [];
            me.CalculationModelsCallStack = [];
            me.CalculationModelsLocked = false;
            me.AllProducts = ko.observableArray();
            me.RelevantProducts = ko.observableArray();
            me.ProductsMode = ko.observable('all'); //all, relevant
            function defaultProductConfiguration() {
                return {
                    IsNull: true,
                    TitleColumnTitle: "Наименование продукта",
                    ComparisonColumnTitle: "Сравнение",
                    ComparisonColumnVisible: true,
                    ComparisonPageUrl: "",
                    Columns: []
                };
            }
            me.AllProductsConfiguration = calculatorFormData.AllProductsConfiguration != null ? calculatorFormData.AllProductsConfiguration : defaultProductConfiguration();
            me.RelevantProductsConfiguration = calculatorFormData.RelevantProductsConfiguration != null ? calculatorFormData.RelevantProductsConfiguration : defaultProductConfiguration();
            me.AllProductsComparisonPageUrl = me.AllProductsConfiguration.ComparisonPageUrl;
            me.RelevantProductsComparisonPageUrl = me.RelevantProductsConfiguration.ComparisonPageUrl;
            me.FilterConfiguration = calculatorFormData.FilterConfiguration;
            me.StoreParamsInHash = calculatorFormData.FilterConfiguration.UseHash;
            me.OrderByProductProperty = calculatorFormData.FilterConfiguration.OrderByProductProperty;
            me.HashChangedByCode = false;
            me.AllProductsTabTitle = ko.observable("Все продукты");
            me.RelevantProductsTabTitle = ko.observable("Подобранные");
            me.AllProductsColumns = ko.observableArray([]);
            me.RelevantProductsColumns = ko.observableArray([]);
            me.ServerCalculationLocked = false;
            me.CalculationIsInProgress = ko.observable(false);
            me.ServerCalculationDelayTimerId = null;
            me.FormBuilt = ko.observable(false);
            me.RunServerCalculationCalledOneMoreTime = false;
            me.RunServerCalculationRequired = false;
            me.AddedToComparisonCount = ko.observable(0);
            me.CanAddToComparison = ko.observable(true);
            me.MaxFieldLength = 10;
            me.GetFieldByIdOrNull = function (fieldId) {
                if (fieldId != null && fieldId.length > 0) {
                    fieldId = $.trim(fieldId).toLowerCase();
                    var fields = me.Fields();
                    for (var i = 0; i < fields.length; i++) {
                        if ($.trim(fields[i].Id).toLowerCase() == fieldId)
                            return fields[i];
                    }
                }
                return null;
            };
            me.GetFieldById = function (fieldId) {
                var field = me.GetFieldByIdOrNull(fieldId);
                if (field == null)
                    me.RaiseError("Field with id: '" + fieldId + "' is not found");
                return field;
            };
            me.GetControlOrNull = function (controlId) {
                if (controlId != null && controlId.length > 0) {
                    controlId = $.trim(controlId).toLowerCase();
                    var controls = me.Controls();
                    for (var i = 0; i < controls.length; i++) {
                        if ($.trim(controls[i].Id).toLowerCase() == controlId)
                            return controls[i];

                    }
                }
                return null;
            };
            me.GetControl = function (controlId, childControlId) {
                var control = me.GetControlOrNull(controlId);
                if (control == null)
                    me.RaiseError("Control with id: '" + controlId + "' is not found");
                if (childControlId) {
                    var childControl = me.GetControlOrNull(childControlId);
                    if (childControl == null)
                        me.RaiseError("Child control with id: '" + childControlId + "' is not found");
                    control.ChildControl = ko.observable(childControl);
                }
                return control;
            };
            me.GetAddControlByIdOrNull = function (addControlId) {

                function internalFindAddControl(controls, id) {
                    for (var i = 0; i < controls.length; i++) {
                        var control = controls[i];
                        if ($.trim(control.Id).toLowerCase() == id)
                            return control;

                        if (control.Columns != null) {
                            if (control.Columns.length > 0) {
                                var result1 = internalFindAddControl(control.Columns[0], id);
                                if (result1 != null)
                                    return result1;
                            }
                            if (control.Columns.length > 1) {
                                var result2 = internalFindAddControl(control.Columns[1], id);
                                if (result2 != null)
                                    return result2;
                            }
                        }
                        else if (control.Controls != null) {
                            var result3 = internalFindAddControl(control.Controls, id);
                            if (result3 != null)
                                return result3;
                        }
                    }
                    return null;
                }

                if (addControlId != null && addControlId.length > 0) {
                    addControlId = $.trim(addControlId).toLowerCase();
                    var controls = me.AddControls();
                    return internalFindAddControl(controls, addControlId);
                }
                return null;
            };
            me.GetFielsSubscribedCalculationModels = function (fieldId) {
                var models = [];
                for (var i = 0; i < me.CalculationModels.length; i++) {
                    var model = me.CalculationModels[i];
                    for (var j = 0; j < model.ListenFieldIds.length; j++) {
                        if (model.ListenFieldIds[j] == fieldId) {
                            models.push(model);
                            break;
                        }
                    }
                }
                return models;

            };
            me.RunCalculationModels = function (fieldId) {
                if (me.CalculationModelsLocked) return;
                var subscribedModels = me.GetFielsSubscribedCalculationModels(fieldId);

                for (var i = 0; i < subscribedModels.length; i++) {
                    var model = subscribedModels[i];
                    if ($.inArray(model, me.CalculationModelsCallStack) < 0) {
                        me.RunCalculationModel(model, fieldId);
                    }
                }
            };
            me.RunAllCalculationModels = function () {
                var registeredModels = {};
                var modelsRunOrder = [];

                $.each(me.Fields(), function (i, field) {
                    var subscribedModels = me.GetFielsSubscribedCalculationModels(field.Id);

                    for (var j = 0; j < subscribedModels.length; j++) {
                        var model = subscribedModels[j];
                        var modelRegistered = registeredModels[model.ModelId];
                        if (modelRegistered != true) {
                            registeredModels[model.ModelId] = true;
                            modelsRunOrder.push({ Model: model, FieldId: field.Id });
                        }
                    }
                });

                $.each(modelsRunOrder, function (i, instruction) {
                    me.RunCalculationModel(instruction.Model, instruction.FieldId);
                });
            };
            me.RunCalculationModel = function (model, fieldId) {
                me.CalculationModelsCallStack.push(model); //защита от зацикливания при перекрестных связях моделей

                model.Calculate(fieldId);

                var index = $.inArray(model, me.CalculationModelsCallStack);
                if (index > -1) me.CalculationModelsCallStack.splice(index, 1);

            };
            me.LockCalculationModels = function () {
                me.CalculationModelsLocked = true;
            };
            me.UnlockCalculationModels = function () {
                me.CalculationModelsLocked = false;
            };
            me.RegisterCalculationModel = function (model) {
                model.Initialize();
                me.CalculationModels.push(model);
            };
            me.RunServerCalculation = function () {
                if (me.ServerCalculationLocked) return;

                if (me.ServerCalculationDelayTimerId == null) {
                    //me.CalculationIsInProgress(true);
                    me.ServerCalculationDelayTimerId = setInterval(me.TryRunServerCalculationIterate, 300);
                } else {
                    me.RunServerCalculationCalledOneMoreTime = true;
                }
            };
            me.IsServerField = function (field) {
                if (field.Type == "input" || field.Type == "helper")
                    return true;
                else
                    return false;
            };
            me.TryRunServerCalculationIterate = function () {

                if (me.RunServerCalculationCalledOneMoreTime == true) {
                    //do nothing, wait for next iteration - maybe something will be changed one more time
                    me.RunServerCalculationCalledOneMoreTime = false;

                } else {
                    if (me.ServerCalculationDelayTimerId != null) {
                        clearInterval(me.ServerCalculationDelayTimerId);
                        me.ServerCalculationDelayTimerId = null;
                    }
                    me.RunServerCalculationRequired = false;
                    me.CalculationIsInProgress(true);

                    me.SaveFieldsData();
                    var fields = me.Fields();
                    var values = [];

                    for (var i = 0; i < fields.length; i++) {

                        var field = fields[i];
                        if (me.IsServerField(field)) {
                            var fieldId = field.Id;
                            fieldId = fieldId.charAt(0).toUpperCase() + fieldId.slice(1); //capitalize
                            values.push({ FieldId: fieldId, Value: field.Value() });
                        }
                    }

                    var exactProductList = [];
                    if (me.FilterConfiguration.Products != null && me.FilterConfiguration.Products.length > 0) {
                        $.each(me.FilterConfiguration.Products, function (i, product) {
                            exactProductList.push(product.Url);
                        });
                    }

                    var webMethodName = '/_vti_bin/Vtb24.Internet/CalculatorWebService.svc/GetCalcProductsResults';
                    $.ajax({
                        url: webMethodName,
                        data: JSON.stringify({
                            webUrl: me.WebUrl,
                            values: values,
                            productList: exactProductList,
                            hideWithCalcError: me.FilterConfiguration.HideWithCalcError,
                            recalcRanges: me.FilterConfiguration.RecalcRanges,
                            initFieldsByFirstProduct: me.FilterConfiguration.InitFieldsByFirstProduct
                        }),
                        contentType: "application/json",
                        type: "POST",
                    }).error(function (p1, p2, p3) {
                        me.CalculationIsInProgress(false);
                        me.ToLog("Error during send request to calculator service: " + p3);
                    }).success(function (d) {

                        if (me.RunServerCalculationCalledOneMoreTime != true) {
                            me.CalculationIsInProgress(false);
                        }
                        var calculationResult = d.GetCalcProductsResultsResult;
                        if (calculationResult != null) {
                            me.ProcessCalculationResults(calculationResult);
                            me.SaveFieldsData();
                        }
                    });
                }
            };
            me.LockServerCalculation = function () {
                me.ServerCalculationLocked = true;
            };
            me.UnlockServerCalculation = function () {
                me.ServerCalculationLocked = false;
            };
            me.ProcessCalculationResults = function (calculationResult) {

                function fieldHasPostCalcModels(field) {
                    var fieldHasModels = false;
                    var models = me.GetFielsSubscribedCalculationModels(field.Id);
                    $.each(models, function (index, model) {
                        if (model.hasOwnProperty('PostCalcMode') && model.PostCalcMode) {
                            fieldHasModels = true;
                        }
                    });
                    return fieldHasModels;
                }

                if (me.ResultsModel) {
                    me.ResultsModel.BuildResults(calculationResult.Results);
                }

                me.Results(me.ResultsModel.Results);
                me.ResultProduct(me.ResultsModel.ResultProduct);
                me.ResultProductsEqualPriority(me.ResultsModel.ResultProductsEqualPriority);
                me.ResultAsMessage(me.ResultsModel.ResultAsMessage);

                if (me.ResultsModel.RelevantProducts.length > 0) {
                    me.ProductModeSetRelevant();
                }

                if (me.ResultsModel.RelevantProducts.length == 0) {
                    me.ProductModeSetAll();
                }
                me.RelevantProducts(me.ResultsModel.RelevantProducts);

                //Обновление значений полей
                //if (me.IsProductHelperWeb != true) { -- теперь и для помощника тоже
                try {
                    me.LockServerCalculation();
                    me.LockCalculationModels();
                    var changedRangeFields = [];

                    $.each(calculationResult.Fields, function (index, resultField) {
                        var field = me.GetFieldByIdOrNull(resultField.FieldId);
                        if (field != null) {
                            var minExist = (resultField.Min != null && resultField.Min != 0);
                            var maxExist = (resultField.Max != null && resultField.Max != 0);
                            var newMin = minExist ? resultField.Min : null;
                            var newMax = maxExist ? resultField.Max : null;

                            var fieldRangeChanged = false;

                            // предварительно обновляем подписи и шаги слайдера
                            // если они были в результатах расчета - 
                            // причем сначала шаги, т.к. они могут быть использованы для
                            // определения мин. и макс. значений
                            if (resultField.SliderPoints != null) {
                                field.SetSliderPoints(resultField.SliderPoints);
                            }
                            if (resultField.SliderLabels != null) {
                                field.DisableRangeSubscriptions(true);

                                fieldRangeChanged = field.SetRange(newMin, newMax);
                                field.SetSliderLabels(resultField.SliderLabels);

                                field.DisableRangeSubscriptions(false);
                            } else {
                                fieldRangeChanged = field.SetRange(newMin, newMax);
                            }

                            if (fieldRangeChanged == true) {
                                changedRangeFields.push(field);
                                field.SetValue(field.Value());
                            }
                            else if (fieldHasPostCalcModels(field)) {
                                changedRangeFields.push(field);
                            }
                            if (field.ItemsFromExcel == true && resultField.Items != null && resultField.Items.length > 0) {
                                var newItems = [];
                                $.each(resultField.Items, function (i, itemValue) {
                                    newItems.push({ Key: itemValue, Value: itemValue });
                                });
                                field.SetItems(newItems);
                            }
                        }

                    });

                    me.UnlockCalculationModels();

                    $.each(changedRangeFields, function (index, field) {
                        me.RunCalculationModels(field.Id);
                    });
                } finally {
                    me.UnlockServerCalculation();
                }
                //}
            };
            me.CollapseAdditionalParametersButtonClick = function (data, sender) {
                var expandedValue = me.AdditionalParametersExpanded();
                expandedValue = !expandedValue;
                me.AdditionalParametersExpanded(expandedValue);
            };
            me.AdditionalParametersExpanded.subscribe(function (newValue) {
                var expandedValue = newValue;
                var hideArea = $('.b-more-options__content').first();

                if (expandedValue != true) {
                    hideArea.slideUp("slow");
                } else if (expandedValue == true) {
                    hideArea.slideDown("slow");
                }
            });
            me.OpenButtonMenuClick = function () {
                var openedValue = me.ButtonMenuOpened();
                openedValue = !openedValue;
                me.ButtonMenuOpened(openedValue);
            };
            me.ProductModeSetAll = function (data, sender) {
                if (me.ProductsMode() != 'all')
                    me.ProductsMode('all');
            };
            me.ProductModeSetRelevant = function (data, sender) {
                if (me.ProductsMode() != 'relevant')
                    me.ProductsMode('relevant');
            };
            me.GenerateGoToProductUrl = function (data) {
                var url = data.Url + '/Pages/default.aspx';
                var urlWithGeo = me.GenerateGoToUrlWithGeo(url);
                return urlWithGeo + "#dataid=" + data.TempId;
            };
            me.GenerateGoToUrlWithGeo = function (url) {
                var urlToGo = url;
                var geoAttr = getQueryParameterByName('geo', null);
                if (geoAttr) {
                    var beforeAndAfterHash = urlToGo.split('#');
                    if (beforeAndAfterHash.length > 1)
                        urlToGo = mergeParameter(beforeAndAfterHash[0], '?geo=' + geoAttr, '#' + beforeAndAfterHash[1], true);
                    else
                        urlToGo = mergeParameter(urlToGo, '?geo=' + geoAttr, '', true);
                }
                return urlToGo;
            }
            me.ProcessGoToProduct = function (data, sender) {
                me.SaveHelperData(data.TempId);
                return true;
            };
            me.ProcessGoToRequest = function (product) {
                if (product.RequestProperties) {
                    me.SaveRequestData(product.RequestProperties);
                }
                return true;
            };
            me.ProductAddToComparison = function (data, event) {
                if (me.AddedToComparisonCount() < 4)
                    data.AddedToComparison(true);
                me.UpdateAddedToComparisonCount();
            };
            me.ProductRemoveFromComparison = function (data, event) {
                data.AddedToComparison(false);
                me.UpdateAddedToComparisonCount();
            };
            me.UpdateAddedToComparisonCount = function () {
                var addedCount = 0;
                $.each(me.AllProducts(), function (index, product) {
                    if (product.AddedToComparison() == true) {
                        addedCount++;
                    }
                });
                me.AddedToComparisonCount(addedCount);
                if (addedCount < 4)
                    me.CanAddToComparison(true);
                else
                    me.CanAddToComparison(false);
            };
            me.ProductGetComparisonUrl = function (mode) {
                var compareId = '';
                $.each(me.AllProducts(), function (index, product) {
                    if (product.AddedToComparison() == true) {
                        // collect compared items ID to string
                        compareId += ((compareId.length > 0) ? ',' : '') + product.WebGuid;
                    }
                });
                var pageUrl = me.WebUrl + "/_layouts/Vtb24.Pages/ProductsComparison.aspx";
                if (mode == 'all' && me.AllProductsComparisonPageUrl) {
                    pageUrl = me.AllProductsComparisonPageUrl;
                }
                if (mode == 'relevant' && me.RelevantProductsComparisonPageUrl) {
                    pageUrl = me.RelevantProductsComparisonPageUrl;
                }
                var resultUrl = pageUrl + '#productIds=' + compareId + "&";
                return me.GenerateGoToUrlWithGeo(resultUrl);
            };
            me.ProductGetUrlMoveToComparison = function (data) {
                return me.WebUrl + "/_layouts/Vtb24.Pages/ProductsComparison.aspx#productIds=" + data.WebGuid + "&";
            };
            me.SetupControlViewModel = function (control) {
                var controlViewModel = null;
                switch (control.Type) {
                    case 'label':
                        controlViewModel = new LabelControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'integer':
                        controlViewModel = new IntegerInputControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'money':
                        controlViewModel = new MoneyInputControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'slider':
                        controlViewModel = new SliderControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'autobrand-selector':
                        controlViewModel = new AutobrandSelectorControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'selector':
                        controlViewModel = new SelectorControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'checkbox-labeled':
                        controlViewModel = new CheckboxWithLabelControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'float':
                        controlViewModel = new FloatInputControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'checkbox':
                        controlViewModel = new CheckboxControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'tooltip':
                        controlViewModel = new TooltipControl(control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'announcement':
                        controlViewModel = new AnnouncementControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'contentblock':
                        controlViewModel = new ContentSwitcherControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'number-placeholdered':
                        controlViewModel = new NumberInputWithPlaceholderControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                        break;
                    case 'toggle':
                        controlViewModel = new ToggleControl(me.GetFieldById(control.FieldId), control);
                        me.Controls.push(controlViewModel);
                    default:
                        break;
                }
                return controlViewModel;
            };
            me.SaveToPdf = function (data, event) {
                var jsonCalcAllData = JSON.stringify(getCalcAllData());
                $.ajax({
                    url: '/_layouts/Vtb24.Internet.RootWeb/CalcToSessionHandler.ashx',
                    type: 'POST',
                    cache: false,
                    contentType: 'application/json; charset=utf-8',
                    data: jsonCalcAllData,
                    success: function (result) {
                        window.location.href = "/_layouts/Vtb24.Internet.RootWeb/CalcToPdfHandler.ashx?calcAllDataKey=" + result;
                    },
                    error: function (error) {
                        alert('Error: ' + error.statusText);
                    }
                });

                function isEmptyOrWhitespaceString(value) {
                    if (!value)
                        return true;

                    if (/\S/.test(value))
                        return false;
                    else
                        return true;
                }

                function getCalcAllData() {
                    var calcAllData = {
                        SavingDescription: {
                            SavingName: getSavingName(),
                            Description: getSavingAnnotation()
                        },
                        CalcInputValues: getCalcInputValues(),
                        CalcResultValues: getCalcResultValues(),
                        CalcUserDate: new Date().getDateWithoutTime().toMSJSON()
                    };

                    return calcAllData;
                }

                function getSavingName() {
                    var savingName = 'Расчет';

                    var suitableProgramName = $('.b-suitable-program');
                    if (suitableProgramName.length > 0) {
                        savingName = $.trim(suitableProgramName.text());
                    }
                    else {
                        var pageMainHeader = $('div.pagetitle_out>h1');
                        if (pageMainHeader.length == 0) {
                            pageMainHeader = $('h1.b-heading.b-heading_level_1');
                        }
                        if (pageMainHeader.length > 0) {
                            savingName = $.trim(pageMainHeader.text());
                        }
                    }
                    return savingName;
                }

                function getSavingAnnotation() {
                    var annotation = $('div.calculator-section>div.anotation');
                    if (annotation.length == 0) {
                        annotation = $('div.b-content>div.b-pure-content>div').first();
                    }

                    if (annotation.length > 0) {
                        var savingAnnotation = $.trim(annotation.text());
                        return savingAnnotation;
                    }
                    else {
                        return '';
                    }
                }

                function getCalcInputValues() {
                    var valuesArray = [];

                    $.each(me.Fields(), function (index, field) {
                        if (field.Type == "input") {
                            if (field.Title != null && field.Title != "") {
                                var inputTitle = field.Title;
                                var inputValue = field.Value();
                                var inputDescription = "";
                                valuesArray.push(createCalculationValue(inputTitle, inputValue, '', inputDescription));
                            }
                        }
                    });
                    return valuesArray;
                }

                function createCalculationValue(title, value, value1, description) {
                    if (!value) {
                        value = '';
                    }
                    if (!value1) {
                        value1 = '';
                    }
                    if (!description) {
                        description = '';
                    }
                    var calculationValue = {
                        Title: $.trim(title),
                        Value: $.trim(value.toString()),
                        Value1: $.trim(value1.toString()),
                        Description: $.trim(description.toString())
                    };
                    return calculationValue;
                }

                function getCalcResultValues() {
                    var valuesArray = new Array();


                    $.each(me.Results(), function (index, result) {
                        var resultTitle = result.DisplayName;
                        var resultValue = result.Value();
                        var resultValue1 = '';
                        if (result.OtherValues().length > 0) {
                            $.each(result.OtherValues(), function (ii, otherValue) {
                                resultValue1 += ((resultValue1.length > 0) ? ", " : "") + otherValue.Value;
                            });
                        }

                        var resultDescription = resultValue1.Tooltip;

                        if (!isEmptyOrWhitespaceString(resultTitle) || !isEmptyOrWhitespaceString(resultValue)
                            || !isEmptyOrWhitespaceString(resultValue1) || !isEmptyOrWhitespaceString(resultDescription)) {
                            valuesArray.push(createCalculationValue(resultTitle, resultValue, resultValue1, resultDescription));
                        }
                    });

                    return valuesArray;
                }
            };
            me.LocalStorageExist = function () {
                try {
                    return 'localStorage' in window && window['localStorage'] !== null;
                } catch (e) {
                    return false;
                }
            };
            me.SaveFieldsData = function () {
                if (me.StoreParamsInHash) {
                    me.SaveFieldsDataToHash();
                } else {
                    me.SaveFieldsDataToLocalStorage(me.LocalStorageKey);
                }
            };
            me.SaveFieldsDataToHash = function () {

                var fields = me.Fields();
                var calcState = {};
                calcState.fields = [];

                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (!field.DisableClientSaving && me.IsServerField(field)) {
                        var fieldId = field.Id;
                        fieldId = fieldId.charAt(0).toUpperCase() + fieldId.slice(1); //capitalize

                        var valueItem = [];
                        valueItem.push(fieldId);
                        valueItem.push(field.Value());
                        calcState.fields.push(valueItem);
                    }
                }

                var strPageState = JSON.stringify(calcState);
                var decodedState = decodeURIComponent(strPageState);
                var newHash = "#" + decodedState;
                if (window.location.hash != newHash) {
                    me.HashChangedByCode = true;
                    helper.UpdateUrlHash(decodedState);
                } else {
                    me.HashChangedByCode = false;
                }
            };
            me.SaveFieldsDataToLocalStorage = function (keyName) {
                var storageExist = me.LocalStorageExist();
                if (storageExist) {
                    var rootContract = {
                        Id: me.WebUrl,
                        Created: (new Date()).toString(),
                        Fields: []
                    };

                    $.each(me.Fields(), function (index, field) {
                        if (!field.DisableClientSaving) {
                            var data = field.SaveToDataContract();
                            rootContract.Fields.push(data);
                        }
                    });
                    try {
                        window.localStorage.setItem(keyName, JSON.stringify(rootContract));
                    }
                    catch (err) {
                        //do nothing
                    }
                }
            };
            me.LoadFieldsData = function () {
                me.RestoringValuesMode = true;
                if (me.StoreParamsInHash) {
                    me.LoadFieldsDataFromHash();
                } else {
                    me.LoadFieldsDataFromLocalStorage(me.LocalStorageKey);
                }
                me.RestoringValuesMode = false;
            };
            me.LoadFieldsDataFromLocalStorage = function (keyName) {
                var storageExist = me.LocalStorageExist();
                if (storageExist) {
                    try {
                        var rootContractData = window.localStorage.getItem(keyName);
                        if (rootContractData == null) return;

                        var rootContract = JSON.parse(rootContractData);
                        if (rootContract == null) return;

                        if (rootContract.Created == null || rootContract.Created == undefined || rootContract.Fields == null)
                            return;

                        var nowInMs = (new Date()).getTime();
                        var createdDateInMs = Date.parse(rootContract.Created);
                        var differenceInMs = nowInMs - createdDateInMs;

                        var oneMinuteInMs = 1000 * 60;
                        var dataIsActual = (Math.round(differenceInMs / oneMinuteInMs) <= 20);
                        if (dataIsActual) {
                            $.each(rootContract.Fields, function (index, data) {
                                var field = me.GetFieldByIdOrNull(data.Id);
                                if (field != null)
                                    field.LoadFromDataContract(data);
                            });
                        }
                    } catch (e) {
                        me.ToLog(e.name + ": " + e.message);
                    }
                }
            };
            me.LoadFieldsDataFromHash = function () {
                var strPageState = window.location.hash;

                strPageState = decodeURIComponent(strPageState);

                var hashSymbolIndex = strPageState.indexOf("#");
                if (hashSymbolIndex >= 0) {
                    strPageState = strPageState.substr(hashSymbolIndex + 1);
                    try {
                        var calcState = JSON.parse(strPageState);
                        if (calcState == null || calcState.fields == null || calcState.fields.length == 0)
                            return;

                        $.each(calcState.fields, function (index, data) {
                            var field = me.GetFieldByIdOrNull(data[0]);
                            if (field != null && data[1] != null) {
                                field.SetValue(data[1]);
                            }
                        });
                    } catch (e) {
                        me.ToLog(e.name + ": " + e.message);
                    }
                }
            };
            me.ExtractHashParameter = function (parameterName) {
                var parameterHashValue = "";
                var strPageState = window.location.hash;
                strPageState = decodeURIComponent((strPageState + '').replace(/\+/g, '%20'));
                var hashSymbolIndex = strPageState.indexOf("#");
                if (hashSymbolIndex >= 0) {
                    var parameterConstant = parameterName + "=";
                    var beginIndex = strPageState.indexOf(parameterConstant, hashSymbolIndex);
                    if (beginIndex >= 0) {
                        beginIndex += parameterConstant.length;
                        var endIndex = strPageState.indexOf("&", beginIndex);
                        if (endIndex >= 0)
                            parameterHashValue = strPageState.substring(beginIndex, endIndex);
                        else
                            parameterHashValue = strPageState.substring(beginIndex);
                    }
                }
                return parameterHashValue;
            };
            me.LoadMegabannerData = function () {
                var storageExist = me.LocalStorageExist();
                if (storageExist) {
                    try {

                        //load banner data from given key
                        var megabannerStorageKey = me.ExtractHashParameter("bannerid");

                        if (megabannerStorageKey == null || megabannerStorageKey == "") return false;
                        var megabannerData = window.localStorage.getItem(megabannerStorageKey);
                        if (megabannerData == null || megabannerData == "null") return false;

                        //immediatelly clean-up MegaBannerCalculatorData
                        window.localStorage.setItem(megabannerStorageKey, null);

                        var megabannerContract = JSON.parse(megabannerData);
                        if (megabannerContract == null) return false;


                        var field1 = { Value: megabannerContract.FirstValue, FieldId: megabannerContract.FirstFieldId };
                        var field2 = { Value: megabannerContract.SecondValue, FieldId: megabannerContract.SecondFieldId };

                        if (field1.FieldId != null && field1.Value != null) {
                            var realField = me.GetFieldByIdOrNull(field1.FieldId);
                            if (realField != null)
                                realField.SetValue(field1.Value);
                        }

                        if (field2.FieldId != null && field2.Value != null) {
                            var realField = me.GetFieldByIdOrNull(field2.FieldId);
                            if (realField != null)
                                realField.SetValue(field2.Value);
                        }

                        return true;
                    } catch (e) {
                        me.ToLog(e.name + ": " + e.message);
                        return false;
                    }
                }
                return false;
            };
            me.SaveHelperData = function (keyName) {
                var storageExist = me.LocalStorageExist();
                if (storageExist) {

                    var rootContract = {
                        Id: me.WebUrl,
                        Created: (new Date()).toString(),
                        Fields: []
                    };

                    $.each(me.Fields(), function (index, field) {
                        if (field.Type == "input") {
                            var data = { FieldId: field.Id, Value: field.Value() };
                            rootContract.Fields.push(data);
                        }
                    });
                    try {
                        window.localStorage.setItem(keyName, JSON.stringify(rootContract));
                    }
                    catch (err) {
                        //do nothing
                    }
                }
            };
            me.SaveRequestData = function (properties) {
                function readFromLS(key) {
                    if (window.localStorage) {

                        var value = localStorage.getItem(key);

                        if (value == undefined || value == null || value == '')
                            return null;
                        else
                            return JSON.parse(value);
                    }
                    else {
                        return null;
                    }
                }

                var additionalInfo = properties;
                $.each(me.Fields(), function (index, field) {
                    if (field.ReqId && field.Type != "output" && !field.hasOwnProperty(field.ReqId)) {
                        additionalInfo[field.ReqId] = field.GetRequestValue();
                    }
                });

                var ard = readFromLS('AdditionalRequestData');

                if (ard != undefined &&
                    ard != null &&
                    ard != '') {
                    try {
                        if (!$.isArray(ard) || ard.length == 0) {
                            localStorage.setItem('AdditionalRequestData', JSON.stringify([additionalInfo]));
                        } else {
                            var addItem = true;
                            if (additionalInfo.hasOwnProperty('productCode')) {
                                for (var i = 0; i < ard.length; i++) {

                                    if (ard[i].hasOwnProperty('productCode') &&
                                        ard[i].productCode == additionalInfo.productCode) {
                                        addItem = false;
                                        ard[i] = additionalInfo;
                                        break;
                                    }
                                }
                            }

                            if (addItem) {
                                if (additionalInfo.hasOwnProperty('productCode')) {
                                    ard.push(additionalInfo);
                                    localStorage.setItem('AdditionalRequestData', JSON.stringify(ard));
                                }
                            } else {
                                localStorage.setItem('AdditionalRequestData', JSON.stringify(ard));
                            }
                        }
                    }
                    catch (ex) {
                        localStorage.setItem('AdditionalRequestData', JSON.stringify([additionalInfo]));
                    }
                } else {
                    if (additionalInfo.hasOwnProperty('productCode')) {
                        localStorage.setItem('AdditionalRequestData', JSON.stringify([additionalInfo]));
                    }
                }
            };
            me.LoadHelperData = function () {
                var storageExist = me.LocalStorageExist();
                if (storageExist) {
                    try {
                        me.RestoringValuesMode = true;

                        //load banner data from given key
                        var helperStorageKey = me.ExtractHashParameter("dataid");

                        if (helperStorageKey == null || helperStorageKey == "") return false;
                        var helperData = window.localStorage.getItem(helperStorageKey);
                        if (helperData == null || helperData == "null") return false;

                        //immediatelly clean-up this data storage
                        window.localStorage.setItem(helperStorageKey, null);

                        var dataContract = JSON.parse(helperData);
                        if (dataContract == null) return false;

                        $.each(dataContract.Fields, function (index, dataField) {
                            var field = me.GetFieldByIdOrNull(dataField.FieldId);
                            if (field != null) {
                                field.SetValue(dataField.Value);
                            }
                        });

                        me.RestoringValuesMode = false;

                        return true;
                    } catch (e) {
                        me.ToLog(e.name + ": " + e.message);
                        return false;
                    }
                }
                return false;
            };
            me.GetCellValueReplace = function (value, column) {
                value = '' + value;
                if (column != null && column.Replaces != null) {
                    for (var j = 0; j < column.Replaces.length; j++) {
                        var replace = column.Replaces[j];
                        var replaceValue = '' + replace.Value;
                        if (replace.Equality == "absolute" && replaceValue == value) {
                            return replace.To;
                        }
                        else if (replace.Equality == "contains" && value.indexOf(replaceValue) >= 0) {
                            return replace.To;
                        }
                    }
                }
                return null;
            };
            me.GetAllProductsCellValue = function (data) {
                var cellColumn = data.AllProductsColumn;
                var value = data.Value;

                var replacementValue = me.GetCellValueReplace(value, cellColumn);
                if (replacementValue != null)
                    return replacementValue;
                return value;
            };
            me.GetRelevantProductsCellValue = function (data) {
                var cellColumn = data.RelevantProductsColumn;
                var value = data.Value;

                var replacementValue = me.GetCellValueReplace(value, cellColumn);
                if (replacementValue != null)
                    return replacementValue;
                return value;
            };
            me.ConstructData = function () {
                function subscribeToFieldValue(field) {
                    field.Value.subscribe(function (newValue) {
                        if (me.IsServerField(field))
                            me.RunServerCalculationRequired = true;

                        me.RunCalculationModels(field.Id);

                        if (me.CalculationModelsCallStack.length == 0) //если не выполняется клиентского пересчета
                        {
                            if (me.RunServerCalculationRequired == true) {
                                me.RunServerCalculationRequired = false;
                                me.RunServerCalculation();
                            }
                        }

                        return true;
                    });
                }

                for (var i = 0; i < me.CalculatorFormData.Fields.length; i++) {
                    var fieldMetadata = me.CalculatorFormData.Fields[i];
                    var field = new Field(fieldMetadata);
                    subscribeToFieldValue(field);
                    me.Fields.push(field);
                }

                for (var i = 0; i < me.CalculatorFormData.Controls.length; i++) {
                    var control = me.CalculatorFormData.Controls[i];
                    me.SetupControlViewModel(control);
                }

                if (me.CalculatorFormData.PDFConfiguration != null) {
                    me.TemplateName = me.CalculatorFormData.PDFConfiguration.TemplateName;
                    var PDFItems = me.CalculatorFormData.PDFConfiguration
                                 ? me.CalculatorFormData.PDFConfiguration.PDFItems
                                 : [];
                    for (var i = 0; i < PDFItems.length; i++) {
                        var fieldPDFItemsMetadata = PDFItems[i];

                        var fieldPDFItem = {
                            Title: fieldPDFItemsMetadata.Title ? fieldPDFItemsMetadata.Title : fieldPDFItemsMetadata.FieldId,
                            FieldId: fieldPDFItemsMetadata.FieldId,
                            Template: fieldPDFItemsMetadata.Template,
                            CalcResultName: fieldPDFItemsMetadata.CalcResultName,
                            IsBold: !!fieldPDFItemsMetadata.IsBold,
                            TemplateFields: fieldPDFItemsMetadata.TemplateFields,
                            Evaluate: function () {
                                if (this.CalcResultName != undefined && this.CalcResultName) {
                                    var productCalcResults = me.Results();
                                    var calcResultNameChunks = this.CalcResultName.split(";");
                                    for (i = 0; i < calcResultNameChunks.length; i++) {
                                        var calcResultNameChunk = calcResultNameChunks[i];                                        
                                        var result = _.findWhere(productCalcResults, { 'DisplayName': calcResultNameChunk })
                                    if (result) {
                                        return result.Value;
                                    }
                                    }
                                    
                                }

                                if (this.FieldId != undefined && this.FieldId) {
                                    var field = me.GetFieldById(this.FieldId);
                                    return field.IsNumeric
                                        ? helper.FormatCurrencyValue(field.Value(), true)
                                        : field.Value();
                                }

                                if (this.Template != undefined && this.Template) {
                                    var value = this.Template;
                                    $.each(this.TemplateFields, function (i, field) {
                                        var templateField = me.GetFieldById(field.FieldId);
                                        var fieldValue = templateField.IsNumeric
                                            ? helper.FormatCurrencyValue(templateField.Value(), true)
                                            : templateField.Value();
                                        value = value.replace("{" + i + "}", fieldValue);
                                    })

                                    return value.replace(/\\n/g, String.fromCharCode(10));
                                }

                                return "Invalid Field Configuration";
                            }
                        };
                        me.FieldPDFItems.push(fieldPDFItem);

                    }
                }
                for (var i = 0; i < me.CalculatorFormData.ContentBlockIds.length; i++) {
                    var keyId = me.CalculatorFormData.ContentBlockIds[i].Key;
                    var blockName = me.CalculatorFormData.ContentBlockIds[i].Value;

                    var scriptId = "contentBlockScript_" + keyId;
                    me.ContentBlocks.push({ ScriptId: scriptId, Name: blockName });
                }
            };

            me.CleanObsoleteLocalStorageValues = function () {
                for (var key in window.localStorage) {
                    if (window.localStorage.key == undefined) continue;
                    var val = window.localStorage[key];
                    if (val.toString().indexOf('"Created":') != -1) {
                        try {
                            var deserializedData = JSON.parse(val);
                            if (deserializedData.hasOwnProperty('Created')) {
                                var createdDateInMs = Date.parse(deserializedData.Created);
                                var nowInMs = (new Date()).getTime();
                                var differenceInMs = nowInMs - createdDateInMs;
                                var oneMinuteInMs = 6000;
                                var dataIsActual = (Math.round(differenceInMs / oneMinuteInMs) <= 20);
                                if (!dataIsActual) {
                                    window.localStorage.setItem(key, null);
                                }
                            }
                        } catch (e) {
                            me.ToLog(e.name + ": " + e.message);
                        }
                    }
                }
            }

            me.InitializeData = function () {

                me.CleanObsoleteLocalStorageValues();

                var additionalControlsModel = new AdditionalControlsModel(me, me.CalculatorFormData.AddControls);
                me.AddControls(additionalControlsModel.RenderAdditionalControls());

                if (calculatorFormData.AllProductsConfiguration != null) {
                    me.AllProductsTabTitle(calculatorFormData.AllProductsConfiguration.Title);

                    $.each(calculatorFormData.AllProductsConfiguration.Columns, function (index, column) {
                        var tooltipModel = TooltipHelper().CreateTooltipModelIfRequired(column.Tooltip);
                        column.TooltipModel = tooltipModel;
                    });


                    if (calculatorFormData.AllProductsConfiguration.Columns != null
                        && calculatorFormData.AllProductsConfiguration.Columns.length > 0)
                        me.AllProductsColumns(calculatorFormData.AllProductsConfiguration.Columns);
                }

                if (calculatorFormData.RelevantProductsConfiguration != null) {
                    me.RelevantProductsTabTitle(calculatorFormData.RelevantProductsConfiguration.Title);

                    $.each(calculatorFormData.RelevantProductsConfiguration.Columns, function (index, column) {
                        var tooltipModel = TooltipHelper().CreateTooltipModelIfRequired(column.Tooltip);
                        column.TooltipModel = tooltipModel;
                    });

                    if (calculatorFormData.RelevantProductsConfiguration.Columns != null
                        && calculatorFormData.RelevantProductsConfiguration.Columns.length > 0)
                        me.RelevantProductsColumns(calculatorFormData.RelevantProductsConfiguration.Columns);
                }

                function getProperty(product, propertyId) {
                    for (var i = 0; i < product.Properties.length; i++) {
                        var property = product.Properties[i];
                        if (property.Title == propertyId)
                            return property;
                    }
                    return null;
                }


                for (var i = 0; i < me.CalculatorFormData.Products.length; i++) {
                    var product = me.CalculatorFormData.Products[i];
                    product.UiFields = [];
                    product.UiResultItems = ko.observableArray([]);
                    product.AddedToComparison = ko.observable(false);
                    product.CalcError = ko.observable('');
                    product.TempId = helper.CreateGUID();
                    product.RequestProperties = null;
                }

                if (calculatorFormData.AllProductsConfiguration != null
                    && calculatorFormData.AllProductsConfiguration.Columns != null
                    && calculatorFormData.AllProductsConfiguration.Columns.length > 0) {

                    var columns = calculatorFormData.AllProductsConfiguration.Columns;

                    for (var i = 0; i < me.CalculatorFormData.Products.length; i++) {
                        var product = me.CalculatorFormData.Products[i];
                        if (!product.SortOrder) {
                            var sortOrderFromProperty = getProperty(product, 'Приоритет');
                            product.SortOrder = sortOrderFromProperty ? parseInt(sortOrderFromProperty.Value) : 0;
                        }
                        for (var j = 0; j < columns.length; j++) {
                            var column = columns[j];
                            var property = getProperty(product, column.Id);
                            if (property == null)
                                property = { Title: '', Value: '' };
                            property.AllProductsColumn = column;
                            product.UiFields.push(property);
                        }
                    }
                }
                var sortedProducts = _.sortBy(me.CalculatorFormData.Products, function (product) {
                    return product.SortOrder * -1;
                });
                me.AllProducts(sortedProducts);

                //Автоматическое конструирование моделей пересчета на основании xml-параметров CalculationModels
                for (var i = 0; i < calculatorFormData.CalculationModels.length; i++) {
                    var calculationModelSettings = calculatorFormData.CalculationModels[i];
                    var newModel = null;
                    switch (calculationModelSettings.Name) {
                        case "CurrencyCalculationModel":
                            newModel = new CurrencyCalculationModel(me);
                            break;
                        case "CurrencyCalculationModelV2":
                            newModel = new CurrencyCalculationModelV2(me);
                            break;
                        case "CreditAmountsCalculationModel":
                            newModel = new CreditAmountsCalculationModel(me);
                            break;
                        case "VisibilityCalculationModel":
                            newModel = new VisibilityCalculationModel(me);
                            break;
                        case "AnnouncementCalculationModel":
                            newModel = new AnnouncementCalculationModel(me);
                            break;
                        case "ValueDependencyCalculationModel":
                            newModel = new ValueDependencyCalculationModel(me);
                            break;
                        case "ValueResetCalculationModel":
                            newModel = new ValueResetCalculationModel(me);
                            break;
                        case "SwitchContentCalculationModel":
                            newModel = new SwitchContentCalculationModel(me);
                            break;
                        case "ControlFocusCalculationModel":
                            newModel = new ControlFocusCalculationModel(me);
                            break;
                        case "ControlDisableCalculationModel":
                            newModel = new ControlDisableCalculationModel(me);
                            break;
                        case "ControlFilterCalculationModel":
                            newModel = new ControlFilterCalculationModel(me);
                            break;
                        case "DropdownItemsCalculationModel":
                            newModel = new DropdownItemsCalculationModel(me);
                            break;
                        default:
                            continue;
                            break;
                    }
                    newModel.ModelId = helper.CreateGUID();

                    function processField(newItem, itemField) {
                        if (itemField.Value != null) {
                            newItem[itemField.Name] = itemField.Value;
                        } else if (itemField.Items != null) {
                            newItem[itemField.Name] = [];
                            var list = newItem[itemField.Name];
                            $.each(itemField.Items, function (index1, listItem) {
                                if (listItem.Value != null) {
                                    list.push(listItem.Value);
                                } else if (listItem.Fields != null) {
                                    var newSubItem = {};
                                    $.each(listItem.Fields, function (index2, subItemField) {
                                        processField(newSubItem, subItemField);
                                    });
                                    list.push(newSubItem);
                                }
                            });
                        }
                    }

                    $.each(calculationModelSettings.Fields, function (index, modelField) {
                        processField(newModel, modelField);
                    });

                    me.RegisterCalculationModel(newModel);
                }

                //Автоматическое дополнение модели результата моделью из xml-параметра ResultsModelName из FilterConfiguration
                var resultsModelSettings = calculatorFormData.FilterConfiguration.ResultsModelName;
                var resultsModel = new BaseResultsModel(me, me.AllProducts());

                if (resultsModelSettings) {
                    switch (resultsModelSettings) {
                        case "RkoResultsModel":
                            var model = new RkoResultsModel();
                            _.extend(resultsModel, model);
                            break;
                    }
                }
                me.ResultsModel = resultsModel;

                try {
                    me.LockServerCalculation();
                    me.RunAllCalculationModels();
                    var megabannerLoaded = me.LoadMegabannerData();
                    if (megabannerLoaded != true) {
                        var helperLoaded = me.LoadHelperData();
                        if (helperLoaded != true) {
                            me.LoadFieldsData();
                        }
                    }
                } finally {
                    if (!me.StoreParamsInHash && window.location.hash != "")
                        helper.UpdateUrlHash('');

                    me.UnlockServerCalculation();

                    me.FormBuilt(true);
                    me.RunServerCalculation();
                }


            };
            me.ConstructData();

            // events
            $(window).on('hashchange', function () {
                if (me.HashChangedByCode == true) {
                    me.HashChangedByCode = false;
                }
                else if (me.StoreParamsInHash) {
                    me.LoadFieldsData();
                }
            });

            me.buildReportData = function () {
                var product = me.ResultProduct();
                var pdfValues = $.map(me.FieldPDFItems, function (item) {
                    var value = item.Evaluate();
                    return ({
                        Title: item.FieldId,
                        Value: value,
                        Value1: value,
                        Description: item.Title,
                        IsBold: item.IsBold
                    })
                });

                $.ajax({
                    url: '/_layouts/Vtb24.Internet.RootWeb/CalcToSessionHandler.ashx',
                    type: 'POST',
                    cache: false,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify({
                        SavingDescription: {
                            SavingName: product.Title,
                            Description: ''
                        },
                        CalcInputValues: pdfValues,
                        CalcResultValues: [],
                        CalcUserDate: me.getClientDateTime().toMSJSON()
                    }),
                    success: function (result) {
                        window.open("", "_blank").document.write("<!DOCTYPE html><html style=\"height:100%\"><script type='text/javascript'>setTimeout(\"window.location.replace('/_layouts/Vtb24.Internet.RootWeb/CalcToPdfHandler.ashx?calcAllDataKey=" + result + "&template=" + me.TemplateName + "')\",300);</script><body style=\"background-position:center;background-image:url('/_layouts/vtb24.internet.markup/images/ajax-loader-transparency.gif');background-repeat:no-repeat\"/></html>");
                    },
                    error: function (error) {
                        alert('Error: ' + error.statusText);
                    }
                });
            };

            me.getClientDateTime = function () {
                var zeroDate = new Date();
                return new Date(zeroDate.getTime() - (zeroDate.getTimezoneOffset()) * 60 * 1000);
            };
        };

        return calculator;
    });