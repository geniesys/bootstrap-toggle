/*
* The directive is registered in index.module.ts an should be available everywhere without having to immport anything.
* // import {ToggleController} from './bootstrap-toggle';
*
* In HTML page:
* ----------- All attributes are optional. Default values/behavior will be used for unspecified attributes. ----------
* <toggle
*  on="Enabled"                 - Alternative text value for the On state. Default is "On"
*
*  off="Disabled"               - Alternative text value for the Off state. Default is "Off"
*
*  btn-checkbox-false           - Alternative value for the "false" state. Default is boolean false, however if your model
*                                 supplies "No" or 0 (zero) and expects the same type in return, you can specify that value here.
*
*  btn-checkbox-true            - same as above, but for the "true" state
*
*  on-class="btn-warning"       - Alternative widget style. Default is btn-default. Applicable only to "On" state.
*                                 "Off" state is always gray. Acceptable values are btn-default, btn-primary,
*                                 btn-success, btn-info, btn-warning, btn-danger. The name corresponds to a css class
*                                 defined in _buttons.scss
*
*  btnsize="btn-lg"             - Allows to change widget's size. The name corresponds to a css class in _buttons.scss
*                                 and angular-bootstrap-toggle.scss
*
*  height="34px"                - Allows to specify a fixed height. This is useful for a closely arranged group of toggles.
*                                 Default is '' which relies on height sizes defined in botstrap.scss (recommended method).
*
*  width="90px"                 - Allows to specify a fixed width. This is useful for a closely arranged group of toggles.
*                                 Default is '' which triggers auto-sizing based on length of visible text.
*
*  ng-model="[ctrl].key1"       - Reference to the model value being manipulated. If controller name prefixed is not
*                                 specified, current scope is assumed.
*
*  ng-disabled="[ctrl].locked"  - Reference to the model value which controls the disabled state. A group of toggles can
*                                 refer to the same variable, if that's the intended behaviour.
*
*  ng-before-change="parent_ctrl.toggleCallbackExample" -
*                                 user-defined callback function to be called BEFORE View value changes. This can be used
*                                 to perform some validation and, if false is returned, "cancel" the action.
*                                 (see below for more information)
*
*  ng-after-change="parent_ctrl.toggleCallbackExample" -
*                                 user-defined callback function to be called AFTER View value changes. This can be used
*                                 to execute additional actions. Note that the model value is also changed at this point.
*                                 If this callback returns false, the view value is rolled back, but this is less
*                                 efficient than using before-change callback because Angular has already moved
*                                 some of its internal gears such as compute form validity and update the model.
*                                 * You may have to do some deep level debugging here since things may have not fully
*                                 updated yet. For example, while s.toggle.ngModelCtrl.$viewValue and
*                                 s.toggle.ngModelCtrl.$modelValue both say true, s.ngModel says false (?).
*
*  toggle-style - Allows to pass user-defined style to the toggle's first immediate child (first DIV inside
*                 <toggle ...> which is what you can actually see as widget's outer container).
*                 This can be used to alter widget's appearance. Use with caution! Note that "width" and "height" values
*                 will be overwritten by user-specified values from "width" and "height" attributes.
*                 (*) For significant changes in appearance please consider overwriting or providing alternative set
*                 of toggle-* css classes.
*                 The acceptable value can be a valid style definition wrapped as JSON string or reference to already
*                 parsed JS object or reference to a function that returns such object.
*
*                 Example: <toggle ... toggle-style="{'border': '1px dashed #f00'}">
* ></toggle>
*
* ------------------ User-defined callback function --------------------
*
* Syntax example:
*   The user-defined callback function should be defined in a parent controller relative to this one.
*
*       public myImportantCallback(e: angular.IAngularEvent, s: angular.IScope) {
*           // do_something
*           return <true | false | void>;
*       }
*
*       or
*
*       myImportantCallback = (e: angular.IAngularEvent, s: angular.IScope) => {
*           // do_something
*           return <true | false | void>;
*       }
*
*       or
*
*       myImportantCallback: (e: angular.IAngularEvent, s: angular.IScope) => {
*           // do_something
*           return <true | false | void>;
*       }
*
*   In HTML template:
*   <toggle ng-change="ctrl.ngToggleCallbackExample" ... >  (!) Note that there are no () after function name.
*
* Arguments:
* 1) e: IAngularEvent   - triggering event
* 2) s: angular.IScope  - current scope
* 3) callee             - reference to itself. (not used)
* 4) Symbol(Symbol.iterator) - ??? (not used)
*
* Return value:
*  Returning false stops the action and prevents model value from being changed. Any other returned value allows
*  model value to change.
*
* Each <toggle> directive creates a new instance of ToggleController and a $scope.
* First two arguments provide plenty of information to find pretty much everything you may need whether it is
* event itself or related DOM object, controller, or scope.
*/

export class ToggleController implements ng.IDirective {
    //private $toggleSuppressError: boolean = false;
    private myDOMobj;
    private labels: HTMLElement[];
    private spans : HTMLElement[];
    private divs  : HTMLElement[];
    private ngModelCtrl: ng.INgModelController;

    public onClassList    : string[] = [];
    public offClassList   : string[] = [];
    public handleClassList: string[] = [];
    public wrapperClass   : string[] = [];
    public wrapperStyle   : any = {};

    public toggleConfig: any = {
        /**
         * This object defines supported toggle widget attributes and their default values.
         * Angular's ngClick and ngDisabled are handled separately. Search code below.
         */
        /**
         * Type: boolean | string | number
         * Default: true and false
         * Description: Values that will be used to update the model
         */
        btnCheckboxTrue : true,
        btnCheckboxFalse: false,
        /**
         * Type: string/html
         * Default: "On" and "Off"
         * Description: Visible text of the "on" and "off" state
         */
        on : 'On',
        off: 'Off',
        /**
         * Type: string
         * Default: ''
         * Description: Allows to specify one of the standard bootstrap's button sizes (css class name).
         * Possible values are btn-lg, btn-sm, btn-xs.
         */
        btnsize: '',
        /**
         * Type: string
         * Default: "btn-default"
         * Description: Class for "on" state from one of standard bootstrap button types.
         * Possible values: btn-default, btn-primary, btn-success, btn-info, btn-warning, btn-danger
         */
        onClass: 'btn-default',
        /**
         * Type: string
         * Default: "btn-default"
         * Description: Class for "off" state from one of standard bootstrap button types.
         * Possible values: btn-default, btn-primary,btn- success, btn-info, btn-warning, btn-danger
         */
        offClass: 'btn-default',
        /**
         * Type: JSON string | object | function
         * Default: ''
         * Description: Allows to pass user-defined style to the toggle's first immediate child (first DIV inside
         * <toggle ...> which is what you actually see as widget's outer container).
         * This can be used to alter widget's appearance. Use with caution! Note that "width" and "height" values
         * will be overwritten by user-specified values from "width" and "height" attributes.
         * Example: <toggle ... toggle-style="{'border': '1px dashed #f00'}">
         * (*) For significant changes in appearance please consider overwriting or providing alternative set of toggle-*
         * css classes.
         */
        toggleStyle: '',
        /**
         * Type: string
         * Default: ''
         * Description: Allows to force width and height to specified values. Use css notation such as 50px, 1%. etc.
         * This is useful when you have a group of toggles with different text in the labels and, therefore,
         * would never line-up to the same width.
         * Example: <toggle ... width="90px">
         */
        width : '',
        height: '',
        /**
         * Type: boolean
         * Default: false
         * Description: Defines "disabled" attribute for the <toggle> directive itself. The ng-disabled dirrective
         * manipulates this attribute, plus there is additional code that propagates its value to child elements.
         * Applying "disabled" to <toggle> itself apparently does nothing, but when its value is propagated to
         * two child <label> elements, it allows us to disable the widget.
         * Note that attribute "diasbled" is not the same as ng-disabled Angular directive. In most cases, you should
         * use <toggle ... ng-disabled="expression"> (not <toggle ... disabled="{{expression}}">) for this to work
         * properly.
         * [Per HTML specs, the "disabled" property does not need a value. Just mentioning it is enough. Angular will,
         * however, also add the value "disabled" (< ... disabled="disabled">)]
         */
        disabled: false
    };

    /** @ngInject */
    constructor(
        private $scope: ng.IScope,          // ToggleController's scope
        private $attrs: ng.IAttributes,
        private $interpolate: ng.IInterpolateService,
        private $log  : ng.ILogService
        //, public  $sce  : ng.ISCEService
    ) {
        // this is ToggleController
        // $scope is this.$scope

        // console.debug('BEGIN ToggleController.constructor()');

        // This was in JS version. Temporary plug for not yet defined ngModelCtrl???
        // this.ngModelCtrl = {$setViewValue: angular.noop, $render: angular.noop};

        // Create a list of keys from our .toggleConfig object. The list is used as source of attribute names
        // to look for in the <toggle> DOM element.
        let toggleConfigKeys = Object.keys(this.toggleConfig);

        // // Copy configuration values from <toggle> DOM element attributes into ToggleController's $scope converting types
        // // and using default values for omitted attributes.
        // // toggleConfigKeys provides a list of keys to evaluate.
        // // this.toggleConfig object tells us the expected type and provides default values for omitted attributes.
        // angular.forEach( toggleConfigKeys, (k: string, i: number) => {
        //     $scope[k] = this.getAttributeValue(k);
        // });

        // Update default configuration from <toggle>'s attributes.
        // For omitted attributes, original default value will remain in effect.
        // toggleConfigKeys[] provides a list of keys to evaluate. this.toggleConfig object also tells us the expected type.
        angular.forEach( toggleConfigKeys, (k: string, i: number) => {
            if (angular.isDefined(this.$attrs[k])) {
                let v = this.getAttributeValue(k);
                console.log('Updating this.toggleConfig[' + k + ']. oldVal:' + this.toggleConfig[k] + ', newVal:' + v);
                this.toggleConfig[k] = v;
            }
        });

        // Watch attributes of our <toggle> element for changes. When change occurs, update its copy in the
        // ToggleController's $scope and recompute styles.
        // Names of the attributes to be observed come from toggleConfigKeys list.
        angular.forEach( toggleConfigKeys, (k: string, i: number) => {
            $attrs.$observe(k, (val: any) => {
                //this.$log.debug('$attrs[' + k + '] has changed. val = ', val);
                let v = this.getAttributeValue(k);
                // console.log('Updating this.toggleConfig[' + k + ']. oldVal:' + this.toggleConfig[k] + ', newVal:' + v);
                if (this.toggleConfig[k] !== v) {
                    this.toggleConfig[k] = v;
                    this.computeStyle();
                }
            });
        });

        // Watch values of ng-model attribute. ngModel's scope is a parent of current scope.
        angular.forEach(['ngModel'], (k: string) => {
            let watch = $scope.$parent.$watch($attrs[k], (
                newVal: string | number,
                oldVal: string | number,
                scope: ng.IScope
            ) => {
                //this.$log.debug(k + ' value has changed.');
                if (angular.isUndefined(this.ngModelCtrl.$viewValue)) {
                    //console.log('1) .$dirty: ' + this.ngModelCtrl.$dirty);
                    this.ngModelCtrl.$setViewValue(this.toggleConfig.btnCheckboxFalse);
                    //console.log('2) .$dirty: ' + this.ngModelCtrl.$dirty);
                    this.ngModelCtrl.$setPristine();
                    //console.log('3) .$dirty: ' + this.ngModelCtrl.$dirty);
                    this.$log.warn(
                      'Model value to which ' + this.ngModelCtrl.$name + ' toggle control is bound was undefined. ' +
                      'Control has set it to ' + this.toggleConfig.btnCheckboxFalse + '.'
                    );
                }
                // do_things
                //(this.ngModelCtrl as any).$render();
            });
            $scope.$parent.$on('$destroy', () => {
                this.$log.debug('ngModel is being destroyed. Removing watches.');
                watch();
            });
        });

        // reference to our .onSwitch()
        //($scope as any).onSwitch = this.onSwitch;

        // console.debug('END   ToggleController.constructor()');
    }

    private getAttributeValue(k: string) {

        let result: any = null;

        if (angular.isDefined(this.$attrs[k])) {
            switch ( typeof this.toggleConfig[k] ) {
                case 'string':
                    result = this.$interpolate(this.$attrs[k])(this.$scope.$parent);
                    break;
                case 'object':
                    result = this.$attrs[k];
                    break;
                case 'function':
                    try {
                        result = this.$scope.$parent.$eval(this.$attrs[k]);    // TBD
                    } catch (e) {
                        this.$log.debug('Unable to evaluate attribute ' + k, e);
                        this.$log.debug('Most likely cause is that ' + this.$attrs[k] + ' is not defined in parent scope.');
                    }
                    break;
                default:    // boolean, number, date
                    try {
                        result = this.$attrs[k];    // TBD
                    } catch (e) {
                        this.$log.debug('Unable to evaluate attribute ' + k, e);
                        this.$log.debug('Most likely cause is that ' + this.$attrs[k] + ' is not found in parent scope.');
                    }
            }
        } else {    // use default from .toggleConfig
            result = this.toggleConfig[k];
        }
        // console.debug('ToggleController.getAttributeValue(' + k + ') => ' + result, this.$scope[k]);
        return result;
    }

    private init(ngModelCtrl: ng.INgModelController) {
        // console.debug('BEGIN ToggleController.init()');

        this.labels = this.myDOMobj.find('label');
        this.spans  = this.myDOMobj.find('span');
        this.divs   = this.myDOMobj.find('div');
        //   ^-- divs[0] is the DIV that has class="toggle btn"
        //       divs[1] is a child of [0] and has class="toggle-group"

        // Set wigget's visible text such as On/Off or Enable/Disable
        angular.element(this.labels[0]).html(this.toggleConfig.on);
        angular.element(this.labels[1]).html(this.toggleConfig.off);

        this.computeStyle();

        //ngModelCtrl.$render = function () {
        //    this.updateWrapperClass();                    // it runs in context of NgModelController and can't see my stuff
        //};

        //ngModelCtrl.$render = this.updateWrapperClass;    // it runs in context of NgModelController and can't see my stuff

        ngModelCtrl.$render = () => {           // it runs in context of ToggleController
            //console.log('ngModelCtrl.$render()');
            this.updateWrapperClass();
        };

        // THIS IS TAKEN CARE BY " ngChange: '&' " in the directive definition
        // ng-change (for optional onChange event handler)
        // if (angular.isDefined((this.$attrs as any).ngChange)) {
        //     let ngChangeValue = (this.$attrs as any).ngChange);
        //     let ngChangeEval  = this.$scope.$eval(ngChangeValue);
        //     console.log(ngChangeEval);
        //
        //     /*
        //     ngModelCtrl.$viewChangeListeners.push(function () {
        //         this.$scope.$eval(this.$attrs.ngChange);
        //     });
        //     */
        //     /*
        //     ngModelCtrl.$viewChangeListeners.push(() => {
        //         this.$scope.$eval( (this.$attrs as any).ngChange );
        //     });
        //     */
        // }
        // console.debug('END   ToggleController.init()');
    };

    _init = this.init;

    public computeStyle() {
        // console.debug('BEGIN ToggleController.computeStyle()');

        // Propagate wigget's disabled state to its child elements.
        // This action is unrelated to computing the style, but this function is the right place for it.
        // The .disabled property must be propagated to labels and span inside the toggle-group container. This
        // triggers .btn[disabled] style (cursor: not-allowed; opacity: 0.65;) but it does not prohibit the
        // click event. Click event is handled separately in .click().
        angular.element(this.labels[0]).attr('disabled', this.toggleConfig.disabled);    // this.myDOMobj[0].disabled
        angular.element(this.labels[1]).attr('disabled', this.toggleConfig.disabled);
        angular.element(this.spans[ 0]).attr('disabled', this.toggleConfig.disabled);

        //let scope = (this.$scope as any);

        // Build an object for widget's ng-style
        switch (typeof this.toggleConfig.toggleStyle) {
            case 'string':
                this.wrapperStyle = (this.toggleConfig.toggleStyle === '') ? {} : angular.fromJson(this.toggleConfig.toggleStyle);
                break;
            case 'object':
                this.toggleConfig.wrapperStyle = this.toggleConfig.toggleStyle;
                break;
            case 'function':
                //scope.wrapperStyle = this.$scope.$parent.$eval(this.toggleConfig.toggleStyle);
                this.wrapperStyle = this.$scope.$eval(this.toggleConfig.toggleStyle);
                break;
            case 'undefined':
                break;
            default:
                this.wrapperStyle = {};
                this.$log.debug((typeof this.toggleConfig.toggleStyle) + ' is not a valid type for parameter toggleStyle.');
        }

        // add/modify .width of the wrapperStyle object
        if (this.toggleConfig.width) {
            // use specified width value such as <toggle ... width="100px">
            this.wrapperStyle.width = this.toggleConfig.width;
        } else {
            /*
            let wrapperComputedWidth = Math.max(this.labels[0].offsetWidth, this.labels[1].offsetWidth);
            let wrapperWidth = this.divs[0].offsetWidth;
            let w = Math.max(wrapperWidth, wrapperComputedWidth);
            if (w > 0) {
                //this.wrapperStyle.width = w + 'px';
            }
            */
            // auto-size based on length of the visible text. "em" also accounts for different font sizes.
            let chars = Math.max(this.toggleConfig.on.length, this.toggleConfig.off.length);
            this.wrapperStyle.width = (chars - 2) + 'em';
        }

        // add/modify .height of the above object
        if (this.toggleConfig.height) {
            // use specified height value such as <toggle ... height="40px">
            this.wrapperStyle.height = this.toggleConfig.height;
        } else {
            /* DOING NOTHING HERE IS THE BEST SOLUTION
            let wrapperComputedHeight = Math.max(this.labels[0].offsetHeight, this.labels[1].offsetHeight);
            let wrapperHeight = this.divs[0].offsetHeight;
            let h = Math.max(wrapperHeight, wrapperComputedHeight);
            if (h > 0) {
                this.wrapperStyle.height = h + 'px';
            }
            */
        }

        // Build/rebuild list of classes that are referenced by widget's components.
        // This is for ng-class. Permanent classes that do not change and always apply are listed in plain class attribute
        // in the directive's template. They are 'toggle-on', 'toggle-off', and 'toggle-handle'
        this.onClassList     = [this.toggleConfig.onClass , this.toggleConfig.btnsize];
        this.offClassList    = [this.toggleConfig.offClass, this.toggleConfig.btnsize];
        this.handleClassList = [this.toggleConfig.btnsize];

        // console.debug('END   ToggleController.computeStyle()');
    };
/*
    public updateWrapperClass_usingScope() {
        console.debug('ToggleController.toggle()');
        // this function executes in context of ToggleController
        let x = [];
        let scope = (this.$scope as any);

        if (this.ngModelCtrl && angular.isDefined(this.ngModelCtrl.$viewValue)) {
            if (this.ngModelCtrl.$viewValue) {
                x = [scope.onClass, scope.btnsize]; //, scope.style
            } else {
                x = [scope.offClass, 'off ', scope.btnsize];    //, scope.style
            }
        } else {
            x = [scope.offClass, 'off ', scope.btnsize];    //, this.toggleConfig.style
        }
        scope.wrapperClass = x;
    };
*/
    public updateWrapperClass() {
        // console.debug('ToggleController.updateWrapperClass()');
        // this function executes in context of ToggleController
        let x = [];
        if (this.ngModelCtrl && angular.isDefined(this.ngModelCtrl.$viewValue)) {
            if (this.ngModelCtrl.$viewValue === this.toggleConfig.btnCheckboxTrue) {
                x = [this.toggleConfig.onClass , 'on' , this.toggleConfig.btnsize];
            } else {
                x = [this.toggleConfig.offClass, 'off', this.toggleConfig.btnsize];
            }
        } else {
            x = [this.toggleConfig.offClass, 'off ', this.toggleConfig.btnsize];
        }
        this.wrapperClass = x;
    };

    public click(evt: ng.IAngularEvent) {
        //console.debug('BEGIN ToggleController.click()');

        // this should run in context of ToggleController
        //let scope = (this.$scope as any);
        //console.log('this.disabled = ' + scope.disabled);

        if (this.toggleConfig.disabled) {    // prevent changing .$viewValue if .disabled == true
            evt.preventDefault();
            // console.debug('END   ToggleController.click() - action canceled because control is disabled.');
            return false;
        } else {

            let s = (this.$scope as any);
            if (typeof s.ngBeforeChange() === 'function') {
              if ( false === s.ngBeforeChange()(evt, this.$scope) ) {
                evt.preventDefault();
                 this.$log.debug('END   ToggleController.click() - action canceled because \
                        ngBeforeChange callback function returned false.');
                return false;
              }
            }

            switch (this.ngModelCtrl.$viewValue) {
                case undefined:
                    this.ngModelCtrl.$setViewValue(this.toggleConfig.btnCheckboxFalse);
                    this.$log.debug(
                        'Model value to which this toggle control is bound was undefined. Control has set it to ' +
                        this.toggleConfig.btnCheckboxFalse + '.'
                    );
                    break;
                case this.toggleConfig.btnCheckboxTrue:
                    this.ngModelCtrl.$setViewValue(this.toggleConfig.btnCheckboxFalse);
                    break;
                case this.toggleConfig.btnCheckboxFalse:
                    this.ngModelCtrl.$setViewValue(this.toggleConfig.btnCheckboxTrue);
                    break;
                default:
                    this.$log.warn(
                        'The type of variable this control is bound to is different from default which is boolean.\n' +
                        'If this is intended, you must add additional attributes btn-checkbox-true="<trueVal>" and ' +
                        'btn-checkbox-false="<falseVal>" to the <toggle> tag and specify respected values.'
                    );
            }
            //this.ngModelCtrl.$setViewValue(!this.ngModelCtrl.$viewValue);
            this.updateWrapperClass();

            if (typeof s.ngAfterChange() === 'function') {
              if ( false === s.ngAfterChange()(evt, this.$scope) ) {
                this.ngModelCtrl.$rollbackViewValue();
                evt.preventDefault();
                // console.debug('END   ToggleController.click() - action rolled-back because \
                //      ngAfterChange callback function returned false.');
                return false;
              }
            }
        }
        // console.debug('END   ToggleController.click()');
        return true;
    };

}


/** @ngInject */
export function toggle(): ng.IDirective {
  // "this" is Window
  return {
        restrict: 'E',
        replace : true,
        template: '<div class="toggle btn" ng-class="toggle.wrapperClass" ng-style="toggle.wrapperStyle" ' +
                       ' ng-click="toggle.click($event)">' +
                   '<div class="toggle-group">' +
                    '<label class="toggle-on  btn" ng-class="toggle.onClassList"></label>' +
                    '<label class="toggle-off btn active" ng-class="toggle.offClassList"></label>' +
                    '<span  class="toggle-handle btn btn-default" ng-class="toggle.handleClassList"></span>' +
                   '</div>' +
                  '</div>',
        scope: {
            ngModel: '=',
            ngBeforeChange: '&',
            ngAfterChange: '&'
        },
        transclude  : true,
        require     : ['toggle', 'ngModel'],
        controller  : 'ToggleController',
        controllerAs: 'toggle',

/*
        compile: (element: ng.IAugmentedJQuery, attrs: ng.IAttributes, transclude: any) => {
            // "this" is Window object
            console.log('.COMPILE()', this);
            return {
                pre: (scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) => {
                    console.log('pre()', arguments, this);  // "this" is Window object
                    ctrls[0].ngModelCtrl = ctrls[1];
                },

                post: (scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) => {
                    console.log('post()', arguments, this);  // "this" is Window object

                    let toggleCtrl  = ctrls[0];
                    let ngModelCtrl = ctrls[1];
                    toggleCtrl.myDOMobj = element;
                    toggleCtrl.init(ngModelCtrl);
                }
            };
        }
*/

        compile: function (element: ng.IAugmentedJQuery, attrs: ng.IAttributes, transclude: any) {
            // "this" is this directive object which is being returned);

            return {
                pre: function(scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) {
                    //console.log('pre()', arguments, this);  // "this" -> Window object
                    ctrls[0].ngModelCtrl = ctrls[1];
                },

                post: function(scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) {
                    //console.log('post()', arguments, this);  // "this" -> Window object

                    let toggleCtrl  = ctrls[0];
                    let ngModelCtrl = ctrls[1];
                    toggleCtrl.myDOMobj = element;
                    toggleCtrl.init(ngModelCtrl);
                }

                /*
                pre: (scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) => {
                    console.log('pre()', arguments, this);  // "this" is this directive object
                },

                post: (scope: ng.IScope, element: JQuery, attrs: ng.IAttributes, ctrls: any[], transclude: any) => {
                    console.log('post()', arguments, this);  // "this" is this directive object
                }
                */
            };
        }
    };
}
