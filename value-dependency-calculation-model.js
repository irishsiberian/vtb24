define(['knockout', 'common.helper'], function (ko, helper) {

    var valueDependencyCalculationModel = function (parentViewModel) {
        var me = this;
        me.Id = "valueDependencyCalculationModel";
        me.Context = parentViewModel;

        me.ListenFieldIds = [];

        me.TargetFieldId = '';
        
        me.MinValueExpression = null;
        me.MinValueParsedExpression = null;

        me.MaxValueExpression = null;
        me.MaxValueParsedExpression = null;

        me.Expression = null;
        me.ParsedExpression = null;

        me.PostCalcMode = null;

        me.SkipWhenRestoringValues = null;

        me.Initialize = function () {
        };

        function toLog(message) {
            helper.Log(message);
        }

        function raiseError(message) {
            throw new Error(message);
        }

        function fieldValue(fieldId) {
            return me.Context.GetFieldById(fieldId).Value();
        }

        function fieldMinValue(fieldId) {
            return me.Context.GetFieldById(fieldId).Min();
        }

        function fieldMaxValue(fieldId) {
            return me.Context.GetFieldById(fieldId).Max();
        }

        function controlGetProperty(controlId, propertyName) {
            var targetControl = me.Context.GetControlOrNull(controlId);
            if (propertyName && targetControl)
                return targetControl[propertyName];
            else
                return null;
        }

        function formatNumberValue(value, doFormat) {
            value = '' + value;

            if (TestRegExp('^[0 ]+$', value)) {
                value = value.replace(/^(0| )+|( )/g, '0');
                value = parseInt(value).toString();
            } else {
                value = value.replace(/^(0| )+|( )/g, '');
                value = parseInt(value).toString();
            }
            if (doFormat) {
                if (value.length > 4) {
                    value = parseInt(value).toString();
                    value = value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1 ');
                }
            }
            return value;
        }

        function TestRegExp (regexp, string) {
            var re = new RegExp(regexp);
            if (re.test(string)) {
                return true;
            }
            else {
                return false;
            }
        };

        function yearsNumberTextSuffix(n)
        {
            return helper.yearsNumberTextSuffix(n);
        }
        
        me.Calculate = function (sourceFieldId) {
            if (!me.Expression || !me.TargetFieldId) {
                return;
            }

            if (me.PostCalcMode && !me.Context.ServerCalculationLocked) {
                return;
            }

            if (me.SkipWhenRestoringValues && me.Context.RestoringValuesMode) {
                return;
            }

            var sourceFieldValue = fieldValue(sourceFieldId);

            var isExpressionParseError = false;
            if (me.ParsedExpression == null) {
                try {
                    var code = "me.ParsedExpression = function(context){ {" + me.Expression + "} return null;} ";
                    eval(code);
                } catch (e) {
                    isExpressionParseError = true;
                    me.ParsedExpression = function () {
                        return null;
                    };

                    toLog("ValueDependencyCalculationModel " + e.name + ": " + e.message + " Unable to parse expression: " + me.Expression);
                }
            }

            var targetFieldValue = me.ParsedExpression(me.Context);

            if (me.MinValueParsedExpression == null) {
                try {

                    var code = "me.MinValueParsedExpression = function(context){ {" + me.MinValueExpression + "} return null;} ";

                    eval(code);
                } catch (e) {
                    toLog("ValueDependencyCalculationModel " + e.name + ": " + e.message + " Unable to parse min value expression: " + me.MinValueExpression);
                }
            }

            var targetFieldMinValue = me.MinValueParsedExpression(me.Context);

            if (me.MaxValueParsedExpression == null) {
                try {
                    var code = "me.MaxValueParsedExpression = function(context){ {" + me.MaxValueExpression + "} return null;} ";
                    eval(code);
                } catch (e) {
                    toLog("ValueDependencyCalculationModel " + e.name + ": " + e.message + " Unable to parse min value expression: " + me.MaxValueExpression);
                }
            }

            var targetFieldMaxValue = me.MaxValueParsedExpression(me.Context);

            var targetField = me.Context.GetFieldById(me.TargetFieldId);
            if (targetField != null) {if (targetFieldMinValue != null) {
                    targetField.ExistMin = true;
                    targetField.Min(targetFieldMinValue);
                }
                else {
                    if (me.MinValueExpression)
                        targetField.ExistMin = false;
                }
                if (targetFieldMaxValue != null) {
                    targetField.Max(targetFieldMaxValue);
                    targetField.ExistMax = true;
                }
                else {
                    if (me.MaxValueExpression)
                        targetField.ExistMax = false;
                }

                if (me.Context.RestoringValuesMode) {
                    targetField.ExistMax = false;
                    targetField.ExistMin = false;
                }
                if (!isExpressionParseError && me.Expression) {
                    targetField.SetValue(targetFieldValue);
                }
            };

        }
    };

    return valueDependencyCalculationModel;
});