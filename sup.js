//criar 100% virtual dom
//https://github.com/livoras/simple-virtual-dom
//https://github.com/Matt-Esch/virtual-dom

//Criar slots e named slots
//criar props
//criar $emit
//criar mixins
//usar suffixo mdc por exemplo (mdc-button)
//criar evento destroy
//criar evento mounted (loaded já existe)
//implementar material web components usar como base https://github.com/matsp/material-components-vue
//https://github.com/material-components/material-components-web
//https://github.com/material-components/material-components-web/blob/master/docs/integrating-into-frameworks.md#the-simple-approach-wrapping-mdc-web-vanilla-components

function Sup(){
    var predecessor = "s-";
    var bindPredecessor = predecessor + "bind:";
    var bindPredecessor2 = ":";
    var modelPredecessor = predecessor + "model";
    var eventPredecessor =  predecessor + "on:";
    var eventPredecessor2 =  "@";
    var loopPredecessor = predecessor + "for";
    var conditionPredecessor = predecessor + "if";
    var displayPredecessor = predecessor + "show";
    var hidePredecessor = predecessor + "hide";
    var rawPredecessor = predecessor + "raw";
    var componentPredecessor = predecessor + "component";

    var _this = this;
    _this.keyCodes = {
        enter: 13,
    };

    _this.components = {};
    _this.helpers = [];
    var _emptyFunction =  (function(){});
    var genericExecutionCachedItens = {};
    var _globalExecutionContext = {};
    var ContextManager = function(){
        var self = this;
        this.names = [];
        this.values = [];
        this.component = null;

        this.executableCache = {};

        this.addValue = function(name, value){
            this.names.push(name);
            this.values.push(value);
        }
        this.pop = function(){
            this.names.pop();
            this.values.pop();
        }
        
        
        this.generateCache = function(code){
            var executionItem = { 
                parameters: this.names.join(","),
                code: code
            }; 
            var executionHash = executionItem.parameters + "|" + code;

            if( genericExecutionCachedItens[executionHash]){
                return genericExecutionCachedItens[executionHash];
            }
            
            genericExecutionCachedItens[executionHash] = new Function(executionItem.parameters, "return (" + executionItem.code + ");");
            return  genericExecutionCachedItens[executionHash];
        }
        this.execute = function(code){
            var executable = this.generateCache(code);
            return executable.apply(_globalExecutionContext, this.values);
        }
        
    }
    var _get = function(url, callback){
        var request = new XMLHttpRequest();
        request.onreadystatechange = function(){
            if(request.readyState == 4 && typeof callback == "function"){
                callback(request.responseText);
            }
        }
        request.open('GET', url, true);
        request.send();
    };

    var _cloneContext = function(context){
        
        var newContent = new ContextManager();
        newContent.component = context.component;

        if(typeof context.names.slice == "undefined"){
            newContent.names = new Array(context.names.length);
            newContent.values = new Array(context.values.length);
            for(var i = 0; i < context.names.length; i++){
                newContent.names[i] = context.names[i];
                newContent.values[i] = context.values[i];
            }
        }else{
            newContent.values = context.values.slice();
            newContent.names = context.names.slice();
        }
        
        return newContent;
    };
    var _contextError = function(context, message, objects){
        console.error( "Error in " + _contextMessage(context) + " : " + message, objects);
    };
    var _contextMessage = function(context){
        var componentMessage = "global";

        if(context.component){
            componentMessage += " > " + context.component.$name;
        }
        return componentMessage;
    };

    var _removeElement = function(element){
        while(element.attributes && element.attributes.length > 0)
            element.removeAttribute(element.attributes[0].name);
        element.style.display = "none";
        element.innerHTML = "";
        element.removeAttribute("value");
    }
    var _prepareBindParameterCache = {};
    var _prepareBindParameter = function(attribute){

        if(_prepareBindParameterCache[attribute.attribute]){
            return _prepareBindParameterCache[attribute.attribute];
        }
        var options = attribute.attribute.indexOf(eventPredecessor2) == 0 ? 
                            attribute.attribute.substring(1).split(".") :  
                            attribute.attribute.substring(eventPredecessor.length).split(".");
        var eventCode = attribute.code;
        var eventName = options.shift();
        var preventDefault = false;
        var eventOptions = {};
        var keyCodes = [];
        for(var j in options){
            if(options[j].indexOf("key:") == 0){
                var value = options[j].split("key:")[1];
                if(isNaN(parseInt(value))){
                    keyCodes.push(_this.keyCodes[value]);
                }else{
                    keyCodes.push(parseInt(value));
                }
                continue;
            }
            eventOptions[options[j]] = true;
        }
        if(eventOptions.preventDefault || eventOptions.prevent){
            preventDefault = true;
            delete eventOptions.preventDefault;
            delete eventOptions.prevent;
        }
        _prepareBindParameterCache[attribute.attribute] = {
            eventOptions: eventOptions,
            eventName: eventName,
            preventDefault: preventDefault,
            keyCodes: keyCodes
        };
        return _prepareBindParameterCache[attribute.attribute];
    }

    var _loadComponentDOM = function(attributeDOM, virtualDOM, context, callback){
        var componentName = (attributeDOM.code || "").trim();
        var componentInstance = _this.components[componentName];
        if(typeof componentInstance == "function"){
            try{
                componentInstance = new componentInstance();
            }catch(ex){
                _contextError(context, "Failed to load component " + componentName, [ ex ]);
                _removeElement(virtualDOM.element);
                callback(null);
                return;
            }
        }
        if(!_this.validateComponent(componentInstance)){
            _removeElement(virtualDOM.element);
            callback(null);
            return;
        }
        
        var component = {
            $name: componentName,
            $instance: componentInstance,
            $tickers: [],
            $context: context,
            $intervalID: setInterval(function(){
                for(var j = 0; j < context.component.$tickers.length; j++){
                    if(typeof context.component.$tickers[j] == "function"){
                        context.component.$tickers[j]();
                    }
                }
            }, 100)
        };
        
        if(context.component){
            component.$parent = context.component;
            component.$instance.parent = component.$parent.$instance;
            for(var i = 0; i < context.names.length; i++){
                if(context.names[i] == "ctx"){
                    context.values[i] = component.$instance;
                    continue;
                }
                if(context.names[i] == "parent"){
                    context.values[i] = component.$parent.$instance;
                    continue;
                }
                
            }
        }else{
            
            context.addValue("ctx", component.$instance);
            context.addValue("parent", null);
        }
        context.component = component;
        componentInstance.element = virtualDOM.element;

        component.$instance.$watch = function(obj, propertyName, callback){

            if(typeof obj == "object" && typeof callback == "function"){
                var oldValue = obj[propertyName];
                
                function watcher(){
                    if(oldValue != obj[propertyName]){
                        callback(obj[propertyName], oldValue);

                        oldValue = obj[propertyName];
                    }
                }
                component.$tickers.push(watcher);

                return function(){
                    for(var i = 0; i < component.$tickers.length; i++){
                        if(component.$tickers[i] == watcher){
                            component.$tickers.splice(i, 1);
                            break;
                        }
                    }
                };

            }
            return null;
        };
        component.$instance.$update = function(callback){
            return virtualDOM.load(context, callback);
        };
        component.$instance.$reload = function(callback){
            var newElement = virtualDOM.original.cloneNode(true);
            var fragment = document.createDocumentFragment();
            fragment.appendChild(newElement);
            
            clearInterval(component.$intervalID);
            context.component = component;
            virtualDOM.component = component;

            var newDOM = _parser(newElement);
            virtualDOM.attributes = newDOM.attributes;
            virtualDOM.childs = newDOM.childs;
            for(var k = 0; k < virtualDOM.attributes.length; k++){
                if(virtualDOM.attributes[k].type == "component"){
                    virtualDOM.attributes[k] = attributeDOM;
                    break;
                }
            }
            return virtualDOM.load(context, function(){
                virtualDOM.element.parentNode.replaceChild(fragment, virtualDOM.element);
                virtualDOM.element = newElement;
                componentInstance.element = virtualDOM.element;

                if(typeof callback == "function"){
                    callback();
                }
            });
        };
        if(typeof componentInstance.template == "string"){
            virtualDOM.element.innerHTML = componentInstance.template;

            var newDOM = _parser(virtualDOM.element);
            virtualDOM.childs = newDOM.childs;
            callback(component);
            return;
        }
        if(typeof componentInstance.templateFile == "string"){
            virtualDOM.element.style.display = "none";
            _get(componentInstance.templateFile, function(html){
                virtualDOM.element.innerHTML = html;
                componentInstance.template = html;
                virtualDOM.element.style.display = "initial";

                var newDOM = _parser(virtualDOM.element);
                virtualDOM.childs = newDOM.childs;
                callback(component);
            });
            return;
        }
        callback(component);
    }

    var _reRunLoopAttribute = function(attribute, context){
        var loopOptions = {
            isRange: attribute.isRange,
            rangeInit: attribute.rangeInitCode ? context.execute(attribute.rangeInitCode) : 1,
            rangeEnd: attribute.rangeEndCode ? context.execute(attribute.rangeEndCode) : 1,
            loopArray: attribute.loopArrayCode ? context.execute(attribute.loopArrayCode) : null,
            isArray: false,
            totalItens: 0,
            listKeys: []
        };

        if(typeof loopOptions.loopArray == "number"){
            loopOptions.isRange = true;
            loopOptions.rangeEnd = loopOptions.loopArray;
        }else{
            if(loopOptions.loopArray instanceof Array){
                loopOptions.isArray = true;
            }
        };
        if(loopOptions.isRange){
            loopOptions.totalItens = loopOptions.rangeEnd - loopOptions.rangeInit + 1;
        }else if(loopOptions.isArray){
            loopOptions.totalItens =  (loopOptions.loopArray || []).length;
        }else{
            loopOptions.listKeys = Object.keys(loopOptions.loopArray || {});
            loopOptions.totalItens = loopOptions.listKeys.length;
        }

        return loopOptions;
    }
    var _loadLoopAttribute = function(attribute, context){
            attribute.loaded = true;
            var loopParts = attribute.code.split(/(?:\s{1,})in(?:\s{1,}|[(]{1})/);
            if(loopParts.length <= 1){
                _contextError(context, "Invalid loop code " + attribute.code, [ element ]);
                return;
            }
            var loopVariable = loopParts[0].trim();
            var loopIndexVariable = null;
            var loopArray = loopParts[1].trim();
            if(loopArray.indexOf(")") == loopArray.length -1){
                loopArray = loopArray.substr(0, loopArray.length-1);
            }
            if(loopArray.indexOf("(") == 0){
                loopArray = loopArray.substr(1);
            }
            var rangeInit = 1;
            var rangeEnd = 1;
            var isRange = false;
            
            //value, index or (value, index)
            if(/^(\s*[\w|.|$|(|)|?|:| ]{1,}\s*),(\s*[\w|.|$|(|)|?|:| ]{1,}\s*)$/.test(loopVariable)){
                var loopVariableParts = loopVariable.split(",");
                loopVariable = loopVariableParts[0].trim();
                loopIndexVariable = loopVariableParts[1].trim();   
            }
            //N to N (range)
            if(/^(\s*[\w|.|$|(|)|?|:| ]{1,}\s*),(\s*[\w|.|$|(|)|?|:| ]{1,}\s*)$/.test(loopArray)){
                var rangeParts = loopArray.split(",");
                attribute.rangeInitCode = rangeParts[0];
                attribute.rangeEndCode = rangeParts[1];
                rangeInit = context.execute(rangeParts[0]);
                rangeEnd = context.execute(rangeParts[1]);
                isRange = true;
            }else{
                
                var objLoopArray = context.execute(loopArray);
                //1 to N
                if(typeof objLoopArray == "number"){
                    isRange = true;
                    rangeEnd = objLoopArray;
                    attribute.rangeEndCode = loopArray;
                }else{
                    attribute.loopArrayCode = loopArray;
                    loopArray = objLoopArray;
                    if(objLoopArray instanceof Array){
                        attribute.isArray = true;
                    }
                }
            }
            attribute.isRange = isRange;
            attribute.rangeInit = rangeInit;
            attribute.loopArray = loopArray;
            attribute.rangeEnd = rangeEnd;
            attribute.loopVariable = loopVariable;
            attribute.loopIndexVariable = loopIndexVariable;


            if(attribute.isRange){
                attribute.totalItens = attribute.rangeEnd - attribute.rangeInit + 1;
            }else if(attribute.isArray){
                attribute.totalItens =  (attribute.loopArray || []).length;
            }else{
                attribute.listKeys = Object.keys(attribute.loopArray || {});
                attribute.totalItens = attribute.listKeys.length;
            }
            return attribute;
    }
    var _cloneInterationDOM = function(element, elementToClone){
        var cloned = {
            attributes:  new Array(elementToClone.attributes.length),
            childs: new Array(elementToClone.childs.length),
            element: element,
            original: elementToClone.original ? element.cloneNode(true) : null,
            type: elementToClone.type,
            code: elementToClone.code,
            component: null,
            isComponent: elementToClone.isComponent,
            hasLoop: elementToClone.hasLoop,
            originalChildIndex: elementToClone.originalChildIndex,
            outerHTML: elementToClone.outerHTML,
            oldValue: elementToClone.oldValue,
            bindAttribute: elementToClone.bindAttribute,
            lastTextDOMValue: elementToClone.lastTextDOMValue,
            load: function(context, callback){
                return _loadDOM(cloned, context, callback);
            }
        };
        
        for(var attributeIndex = 0; attributeIndex < elementToClone.attributes.length; attributeIndex++){
            var virtualAttribute = elementToClone.attributes[attributeIndex];
            cloned.attributes[attributeIndex]  = {
                type:  virtualAttribute.type,
                attribute: virtualAttribute.attribute,
                code:  virtualAttribute.code,
                oldValue: virtualAttribute.oldValue,
                bindAttribute: virtualAttribute.bindAttribute,
                outerHTML: virtualAttribute.outerHTML,
                lastDOMValue: virtualAttribute.lastDOMValue
            };
        }
        var index = 0;
        var clonedIndexChild = 0;
        var child = element.firstChild;
        var virtualChild = null;
        do
        {
            virtualChild = elementToClone.childs[clonedIndexChild];
            if(!virtualChild)
                break;
            if(virtualChild.originalChildIndex == index){
                cloned.childs[clonedIndexChild] = _cloneInterationDOM(child, virtualChild);
                
                clonedIndexChild++;
            }
            child = child.nextSibling;
            index++;
        }
        while(child != null);

        return cloned;
    }
    var _getFragment = (function(){

        var WRAP_MAP = {
            thead: ['table', '<table>', '</table>'],
            col: ['colgroup', '<table><colgroup>', '</colgroup></table>'],
            tr: ['tbody', '<table><tbody>', '</tbody></table>'],
            td: ['tr', '<table><tr>', '</tr></table>']
        };
        WRAP_MAP.caption = WRAP_MAP.colgroup = WRAP_MAP.tbody = WRAP_MAP.tfoot = WRAP_MAP.thead;
        WRAP_MAP.th = WRAP_MAP.td;
    
        var FIRST_TAG_REGEX = /^[\s]*<([a-z][^\/\s>]+)/i;
    
        var TEMPLATE_TAG_SUPPORT = 'content' in document.createElement('template');
    
        var RANGE_SUPPORT = !!(document.createRange && 'createContextualFragment' in document.createRange());
    
    
        return function(html){
            var fragment, queryContainer, query, wrap, tag, template;
    
            if (TEMPLATE_TAG_SUPPORT) {
                template = document.createElement('template');
                template.innerHTML = html;
                return template.content;
            }
    
            // If template tag is not supported and no special wrap is needed, use Range API
            tag = (FIRST_TAG_REGEX.exec(html) || ['', ''])[1];
            wrap = WRAP_MAP[tag];
    
            if (!wrap && RANGE_SUPPORT) {
                return document.createRange().createContextualFragment(html);
            }
    
    
            // If template tag, and Range API are not supported and a special wrap is needed, wrap and return fragment
            fragment = document.createDocumentFragment();
    
            html = [wrap[1], html, wrap[2]].join('');
    
            queryContainer = document.createElement('div');
            queryContainer.insertAdjacentHTML('beforeend', html);
            query = queryContainer.querySelector(wrap[0]);
    
            while (query.firstChild) {
                fragment.appendChild(query.firstChild);
            }
    
            return fragment;
        }
    })();
    var _updateElementAttributes = function(virtualDOM, context, callback){
        var i = 0;
        function nextElement(){
            var attribute = virtualDOM.attributes[i++];
            if(!attribute){
                if(virtualDOM.component && 
                    typeof virtualDOM.component.$instance.load == "function" &&
                    !virtualDOM.component.$loaded){
                    virtualDOM.component.$loaded = true;
                        //wait for promise end
                    var result = virtualDOM.component.$instance.load();

                    if(result && typeof result.then == "function"){
                        result.then(function(){
                            
                            callback(true, context);
                        });
                    }else{
                        callback(true, context);
                    }
                }else{
                    callback(true, context);
                }
                return;
            }
            if(attribute.type == "component" && 
                !virtualDOM.component && 
                !(context.component && virtualDOM.hasLoop)){
                
                _loadComponentDOM(attribute, virtualDOM, context, function(component){

                    //failed to load component
                    if(!component){
                        callback(false, context);
                        return;
                    }
                    //success to load component
                    virtualDOM.component = component;
                    
                    nextElement();
                });
                return;
            }

            if(attribute.type == "loop"){
                virtualDOM.loadedLoopItens = virtualDOM.loadedLoopItens || [];
                var hasChangedValues = false;
                var hasChangedSize = false;
                var loopKeys = [];
                if(attribute.loaded && virtualDOM.loadedLoopItens){
                    var newLoopData = _reRunLoopAttribute(attribute, context);

                    if(newLoopData.isRange){
                        if(attribute.rangeInit != newLoopData.rangeInit || attribute.rangeEnd != newLoopData.rangeEnd)
                        {
                            hasChangedValues = true;
                            hasChangedSize = attribute.totalItens != newLoopData.totalItens;
                        }
                    }else{
                        hasChangedValues = attribute.loopArray != newLoopData.loopArray;
                        hasChangedSize = attribute.totalItens != newLoopData.totalItens;
                    }
                    attribute.isRange = newLoopData.isRange;
                    attribute.rangeInit = newLoopData.rangeInit;
                    attribute.rangeEnd = newLoopData.rangeEnd;
                    attribute.loopArray = newLoopData.loopArray;
                    attribute.isArray = newLoopData.isArray;
                    attribute.totalItens = newLoopData.totalItens;
                    attribute.loopKeys = newLoopData.loopKeys;
                    
                }else{
                    _removeElement(virtualDOM.element);
                    attribute = _loadLoopAttribute(attribute, context);
                    hasChangedValues = true;
                    hasChangedSize = true;
                }
                var elementListWrapper = null;
                
                
                if(hasChangedSize){
                    
                    //remove elements and virtualsDOMS
                    while(attribute.totalItens < virtualDOM.loadedLoopItens.length){
                        var domToRemove = virtualDOM.loadedLoopItens.pop();
                        domToRemove.item.element.parentNode.removeChild(domToRemove.item.element);
                    }
                    //create new elements and virtualDOMS
                    if(attribute.totalItens > virtualDOM.loadedLoopItens.length){
                       
                        context.addValue(attribute.loopVariable, 0);
                        if(attribute.loopIndexVariable){
                            context.addValue(attribute.loopIndexVariable, 0);
                        }
                        if(attribute.loopIndexVariable){
                            attribute.loopIndexIndex = context.values.length - 1;
                            attribute.loopValueIndex = context.values.length - 2;
                        }else{
                            attribute.loopValueIndex = context.values.length - 1;
                        }

                        //generate interation virtual DOM and HTML
                        if(!attribute.originalInterationDOM){
                            elementListWrapper = document.createElement(virtualDOM.element.parentNode.tagName);
                            elementListWrapper.insertAdjacentHTML('afterbegin', virtualDOM.outerHTML);
                            var newChild = elementListWrapper.firstChild;
                            if(!attribute.originalInterationDOM){
                                attribute.originalInterationDOM = _parser(newChild);
                                attribute.originalInterationOuterHTML =  newChild.outerHTML;
                            }
                        }

                        //create html
                        var htmlPieces = [];
                        for(var k = 0; k < attribute.totalItens - virtualDOM.loadedLoopItens.length; k++){
                            htmlPieces.push(attribute.originalInterationOuterHTML);
                        }

                        elementListWrapper = _getFragment(htmlPieces.join(""));
                        var totalElementsInListWrapper = elementListWrapper.childNodes.length;
                        
                        //assign elements to virtual DOM and context
                        for(var indexElementListWrapper = 0; indexElementListWrapper < totalElementsInListWrapper; indexElementListWrapper++)
                        {
                            var newDomContext = _cloneContext(context);
                            var clonedInterationDOM = _cloneInterationDOM(elementListWrapper.childNodes[indexElementListWrapper], attribute.originalInterationDOM);
                            virtualDOM.loadedLoopItens.push( { item: clonedInterationDOM, context: newDomContext });   
                        }
                        context.pop();
                    }
                }
                
                var updatedItens = 0;
                if(virtualDOM.loadedLoopItens.length){
                    for(var loadedItemIndex = 0; loadedItemIndex < virtualDOM.loadedLoopItens.length; loadedItemIndex++){
                        
                        //update values contexts
                        if(hasChangedValues){
                            var value = null;
                            var loopIndex = loadedItemIndex;
                            if(attribute.isArray){
                                value = attribute.loopArray[loadedItemIndex];
                            }else if(attribute.isRange){
                                value = (loadedItemIndex + attribute.rangeInit);
                            }else{
                                value = attribute.loopArray[attribute.loopKeys[loadedItemIndex]];
                                loopIndex = attribute.loopKeys[loadedItemIndex];
                            }
                            if(attribute.loopIndexVariable){
                                virtualDOM.loadedLoopItens[loadedItemIndex].context.values[attribute.loopIndexIndex] = loopIndex;
                                virtualDOM.loadedLoopItens[loadedItemIndex].context.values[attribute.loopValueIndex] = value;
                            }else{
                                virtualDOM.loadedLoopItens[loadedItemIndex].context.values[attribute.loopValueIndex] = value;
                            }
                        }

                        virtualDOM.loadedLoopItens[loadedItemIndex].item.load(virtualDOM.loadedLoopItens[loadedItemIndex].context, function(){
                            updatedItens++;
                            if(updatedItens == virtualDOM.loadedLoopItens.length){
                                
                                if(virtualDOM.parent && virtualDOM.parent.element.tagName == "SELECT"){   
                    
                                    for(var l = 0; l < virtualDOM.parent.element.attributes.length; l++){

                                        var parentAttribute = virtualDOM.parent.attributes[l];
                                        if(parentAttribute.type == "model"){
                                            var parentValue =  context.execute(parentAttribute.code);
                                            virtualDOM.parent.element.value = parentValue;
                                            break;
                                        }
                                    }
                                }
                                if(elementListWrapper){
                                    while(elementListWrapper.firstChild)
                                        virtualDOM.element.parentNode.insertBefore(elementListWrapper.firstChild, virtualDOM.element);
                                }
                                nextElement();
                            }
                        });
                    }
                }else{
                    nextElement();
                }
                return;
            }

            if(attribute.type == "if"){
                var newIfValue = context.execute(attribute.code);
                if(typeof attribute.oldIfValue == "undefined" ||
                          newIfValue != attribute.oldIfValue){
                    attribute.oldIfValue = newIfValue;
                    
                    if(newIfValue){
                        var newClone = virtualDOM.original.cloneNode(true);
                        virtualDOM.element.parentNode.replaceChild(newClone, virtualDOM.element);
                        virtualDOM.element = newClone;

                        //re-parse inner DOM
                        var newDOM = _parser(virtualDOM.element);
                        if(newDOM){
                            virtualDOM.childs = newDOM.childs;
                            virtualDOM.attributes = newDOM.attributes;
                        }
                        
                        nextElement();
                    }else{
                        _removeElement(virtualDOM.element);
                        callback(false, context);
                    }
                   
                }else{
                    nextElement();
                }
                
                return;
            }

            if(attribute.type == "model" && !attribute.binded && context.component){

                attribute.binded = true;
                var lastModelValue = context.execute(attribute.code);

                if(virtualDOM.element.tagName == "SELECT"){
                    virtualDOM.element.value = lastModelValue;
                    virtualDOM.element.setAttribute("value", lastModelValue);
                    virtualDOM.element.addEventListener("change", function(event){

                        context.addValue("$value", virtualDOM.element.value);

                        lastModelValue = virtualDOM.element.value;
                        context.execute(attribute.code + " = $value");
                        context.pop();
                        context.component.$instance.$update();
                    });
                    
                    context.component.$tickers.push(function(){
                        var newModelValue =  context.execute(attribute.code);
                        if(newModelValue != lastModelValue){
                            virtualDOM.element.value = newModelValue;
                        }
                    }); 
                    
                    nextElement();
                    return;
                }
                if(virtualDOM.element.tagName == "INPUT"){
                    

                    var type = (virtualDOM.element.getAttribute("type") || "TEXT").toUpperCase();

                    if(type == "CHECKBOX"){
                        if(lastModelValue){
                            virtualDOM.element.setAttribute("checked", "checked");
                        }else{
                            virtualDOM.element.removeAttribute("checked");
                        }

                        virtualDOM.element.addEventListener("change", function(event){
                            context.addValue("$value", virtualDOM.element.checked);
                            lastModelValue = virtualDOM.element.checked;
                            context.execute(attribute.code + " = $value");
                            
                            context.pop();
                            context.component.$instance.$update();
                        });
                        context.component.$tickers.push(function(){
                            var newModelValue =  context.execute(attribute.code);
                            if(newModelValue != lastModelValue){
                                if(newModelValue){
                                    virtualDOM.element.setAttribute("checked", "checked");
                                }else{
                                    virtualDOM.element.removeAttribute("checked");
                                }
                            }
                        });  
                    }else if(type == "RADIO"){

                        if(virtualDOM.element.value == lastModelValue){
                            virtualDOM.element.setAttribute("checked", "checked");
                        }else{
                            virtualDOM.element.removeAttribute("checked");
                        }

                        virtualDOM.element.addEventListener("change", function(event){
                            if(virtualDOM.element.checked){
                                context.addValue("$value", virtualDOM.element.value);

                                lastModelValue = virtualDOM.element.value;
                                context.execute(attribute.code + " = $value");
                                
                                context.pop();

                                context.component.$instance.$update();
                            }
                        });
                        
                        context.component.$tickers.push(function(){
                            var newModelValue =  context.execute(attribute.code);
                            if(newModelValue != lastModelValue){
                                if(virtualDOM.element.value == newModelValue){
                                    virtualDOM.element.setAttribute("checked", "checked");
                                }else{
                                    virtualDOM.element.removeAttribute("checked");
                                }
                            }
                        });  
                    }else{
                        virtualDOM.element.value = lastModelValue;

                        virtualDOM.element.addEventListener("keyup", function(event){
                            context.addValue("$value", virtualDOM.element.value);

                            lastModelValue = virtualDOM.element.value;
                            context.execute(attribute.code + " = $value");
                            
                            context.pop();

                            context.component.$instance.$update();
                        });
                        
                        context.component.$tickers.push(function(){
                            var newModelValue =  context.execute(attribute.code);
                            if(newModelValue != lastModelValue){
                                virtualDOM.element.value = newModelValue;
                            }
                        });  
                    }  
                    
                    nextElement();
                    return;
                }
                
                nextElement();
                return;
            }
            if(attribute.type == "show"){
                if(context.execute(attribute.code)){
                    virtualDOM.element.style.display = "initial";
                }else{
                    virtualDOM.element.style.display = "none";
                }
                
                nextElement();
                return;
            }
            if(attribute.type == "hide"){
                if(context.execute(attribute.code)){
                    virtualDOM.element.style.display = "none";
                }else{
                    virtualDOM.element.style.display = "initial";
                }
                
                nextElement();
                return;
            }
            if(attribute.type == "bind"){
                var oldValue = attribute.oldValue;
                if(oldValue)
                    oldValue += " ";
                var result = context.execute(attribute.code);
                
                var newValue =  "";
                if(typeof result == "object"){
                    if(result instanceof Array){
                        newValue = result.join(" ");
                    }else{
                        if(attribute.bindAttribute.toLowerCase() == "style"){
                            if(oldValue){
                                oldValue = oldValue.trim();
                                if(oldValue.indexOf(";") != oldValue.length-1){
                                    oldValue += ";";
                                }
                            }
                            var keys = Object.keys(result);
                            for(var k = 0; k < keys.length; k++){
                                
                                if(result[keys[k]] instanceof Array){
                                    for(var m = 0; m < result[keys[k]].length; m ++){
                                        newValue += keys[k] + ":" + result[keys[k]][m]  + ";";
                                    }
                                }else{
                                    newValue += keys[k] + ":" + result[keys[k]]  + ";";
                                }  
                            }
                        }else{
                            var keys = Object.keys(result);
                            for(var k = 0; k < keys.length; k++){
                                if(result[keys[k]]){
                                    newValue += keys[k] + " ";
                                }
                            }
                        }
                    }
                }else{
                    newValue = result;
                }
                var newBindDOMValue = (oldValue + newValue).trim();
                if(attribute.lastDOMValue != newBindDOMValue){
                    attribute.lastDOMValue = newBindDOMValue;
                    if(attribute.bindAttribute != "class" || (newBindDOMValue != "" && !attribute.lastDOMValue)){
                        virtualDOM.element.setAttribute(attribute.bindAttribute, newBindDOMValue);
                    }
                }
                
                
                nextElement();
                return;
            }
            if(attribute.type == "raw"){
                 var rawResult = context.execute(attribute.code);
                if(attribute.lastDOMValue != rawResult){
                    attribute.lastDOMValue = rawResult;
                    virtualDOM.element.innerHTML = rawResult;
                }
                nextElement();
                return;
            }
            
            if(attribute.type == "on" && !attribute.binded){
                var bindEventData = _prepareBindParameter(attribute);
                virtualDOM.element.addEventListener(bindEventData.eventName, function(event){
                    if(bindEventData.preventDefault && event.preventDefault){
                        event.preventDefault();
                    }
                    if(bindEventData.keyCodes.length){
                        var dontReturn = false;
                        for(var k in keyCodes){
                            if(keyCodes[k] == (event.which || event.keyCode)){
                                dontReturn = true;
                                break;
                            }
                        }
                        if(!dontReturn)
                           return false;
                    }
                    context.addValue("$event", event);
                    context.execute(attribute.code);
                    context.pop();

                    if(context.component){
                        context.component.$instance.$update();
                    }
                }, bindEventData.eventOptions);
                attribute.binded = true;

                nextElement();
                return;
            }
            
            nextElement();
            return;
        }
        nextElement();
    }
    var _textFunctionCache = {};
    var _generateTextFunction = function(text){
        if(_textFunctionCache[text]){
            return _textFunctionCache[text];
        }
        var regex = /{{([^}]*)}}/gi;
        var match = null;
        var lastIndex =  0;
        var parts = [];
        while ((match = regex.exec(text)) != null) {
            
            var part = text.substring(lastIndex, match.index);
            lastIndex = match.index + 2 + match[0].length;


            parts.push(JSON.stringify(part));
            parts.push(match[1]);
            
        }
        if(lastIndex != text.length-1){
            parts.push(JSON.stringify(text.substring(lastIndex)));
        }
        _textFunctionCache[text] = parts.join(" + ");
        return _textFunctionCache[text];
    };
    
    
    var _loadDOM = function(virtualDOM, context, callback){
        callback = (typeof callback == "function") ? callback : _emptyFunction;
        
        switch(virtualDOM.type){
            case "text":

                var textFunction  = _generateTextFunction(virtualDOM.code);
                var newTextDOMValue = context.execute(textFunction);;
                if(virtualDOM.lastTextDOMValue != newTextDOMValue){
                    virtualDOM.lastTextDOMValue = newTextDOMValue;
                    virtualDOM.element.textContent = virtualDOM.lastTextDOMValue;
                }
                
                callback();
            break;
            case "element":
                _updateElementAttributes(virtualDOM, context, function(loadChilds, newContext){   
                    if(loadChilds){
                        var results = 0;
                        if(virtualDOM.childs.length){
                            for(var i = 0; i < virtualDOM.childs.length; i++){
                                var child = virtualDOM.childs[i];
                                var childContext = newContext;
                                if(child.isComponent && child.component){
                                    childContext = child.component.$context;
                                }
                                child.load(childContext, function(){
                                    results++;
                                    if(virtualDOM.childs.length == results){
                                        callback();
                                    }
                                });
                            }
                        }else{
                            callback();
                        }

                    }else{
                        callback();
                    }
                });
                break;    
        }
        
    }
    var _binder = function(element, context, callback){
        callback = (typeof callback == "function") ? callback  : _emptyFunction;

        
        var virtualDOM = _parser(element);
        if(virtualDOM){      
            virtualDOM.load(context, function(){
                callback();
            });
        }else{
            callback();
        }
        return;
    }
    var _parser = function(element, originalChildIndex){
        if(!element.parentNode || element.tagName == "SCRIPT"){
            return null;
        }

        if(typeof element.normalize == "function")
            element.normalize();

        var virtualDOM = {
            attributes: [],
            childs: [],
            element: element,
            original: null,
            type: "element",
            code: null,
            component: null,
            isComponent: false,
            hasLoop: false,
            originalChildIndex: originalChildIndex,
            outerHTML: null,
            oldValue: null,
            bindAttribute: null,
            load: function(context, callback){
                return _loadDOM(virtualDOM, context, callback);
            }
        };
      
        if(element.nodeName == "#text"){
            virtualDOM.type = "text";
            virtualDOM.code = element.textContent || "";
            if(virtualDOM.code.indexOf("{{") == -1){
                return null;
            }
            return virtualDOM;
        }
        //ignore comments
        if(typeof element.getAttribute != "function"){
            return null;
        }

        var attribute = null;
        //component
        var componentName = element.getAttribute(componentPredecessor);
        if(componentName){
            virtualDOM.attributes.push({
                type: "component",
                attribute: componentPredecessor,
                code: componentName
            });
            virtualDOM.isComponent = true;
            virtualDOM.original = element.cloneNode(true);
            element.removeAttribute(componentPredecessor);
        }

        //loop (for)
        var loopCode = element.getAttribute(loopPredecessor);
        if(loopCode){

            virtualDOM.attributes.push({
                type: "loop",
                attribute: loopPredecessor,
                code: loopCode
            });
            virtualDOM.hasLoop = true;
            element.removeAttribute(loopPredecessor);
            virtualDOM.outerHTML = element.outerHTML;
            

            return virtualDOM;
        }

        //condition (if)
        conditionCode = element.getAttribute(conditionPredecessor);
        if(conditionCode){
            
            virtualDOM.attributes.push({
                type: "if",
                attribute: conditionPredecessor,
                code: conditionCode,
                innerHTML: element.innerHTML
            });
            if(!virtualDOM.original)
                virtualDOM.original = element.cloneNode(true);
            element.removeAttribute(conditionPredecessor);
        }

        var attributesToRemove = [];
        for (var i = 0; i < element.attributes.length; i++){
            attribute = element.attributes[i].nodeName;
            
            if(attribute.indexOf(rawPredecessor) == 0){
                
                virtualDOM.attributes.push({
                    type: "raw",
                    attribute: attribute,
                    code: element.getAttribute(attribute)
                });
            
                attributesToRemove.push(attribute);
                continue;
            }

           
            //display (show)
            if(attribute.indexOf(displayPredecessor) == 0){
              
                virtualDOM.attributes.push({
                    type: "show",
                    attribute: attribute,
                    code:  element.getAttribute(attribute)
                });
            
                attributesToRemove.push(attribute);
                continue;
            }
            //display (hide)
            if(attribute.indexOf(hidePredecessor) == 0){
                virtualDOM.attributes.push({
                    type: "hide",
                    attribute: attribute,
                    code:  element.getAttribute(attribute)
                });
            
                attributesToRemove.push(attribute);
                continue;
            }
            //model (two way value data bind)
            if(attribute.indexOf(modelPredecessor) == 0){
                virtualDOM.attributes.push({
                    type: "model",
                    attribute: attribute,
                    code:  element.getAttribute(attribute)
                });
            
                attributesToRemove.push(attribute);
                continue;
            }
            //bind
            
            if(attribute.indexOf(bindPredecessor) == 0){
                var bindAttribute = attribute.substring(bindPredecessor.length);
                var oldValue = element.getAttribute(bindAttribute) || "";

                virtualDOM.attributes.push({
                    type: "bind",
                    attribute: attribute,
                    code:  element.getAttribute(attribute),
                    oldValue: oldValue,
                    bindAttribute: bindAttribute
                });

                attributesToRemove.push(attribute);
                continue;
            }
            //bind shortcut
            if(attribute.indexOf(bindPredecessor2) == 0){
                var bindAttribute = attribute.substring(bindPredecessor2.length);
                var oldValue = element.getAttribute(bindAttribute) || "";

                virtualDOM.attributes.push({
                    type: "bind",
                    attribute: attribute,
                    code:  element.getAttribute(attribute),
                    oldValue: oldValue,
                    bindAttribute: bindAttribute
                });

                attributesToRemove.push(attribute);
                continue;
            }
            //events
            if(attribute.indexOf(eventPredecessor) == 0 || attribute.indexOf(eventPredecessor2) == 0){

                virtualDOM.attributes.push({
                    type: "on",
                    attribute: attribute,
                    code:  element.getAttribute(attribute)
                });
            
                attributesToRemove.push(attribute);
                continue;
            }
        }
        for(var i = 0; i < attributesToRemove.length; i++){
            element.removeAttribute(attributesToRemove[i]);
        }
        if(element.childNodes.length > 0){
            var i = 0;

            for(var i =0; i < element.childNodes.length; i++){
                var newDom = _parser(element.childNodes[i], i);
                if(newDom && (newDom.childs.length > 0 ||
                    newDom.attributes.length > 0 || 
                    newDom.type == "text")){
                    newDom.parent = virtualDOM;
                     
                    virtualDOM.childs.push(newDom);
                }
            }
            return virtualDOM;
        }
        return virtualDOM;
    }


    _this.bind = function(wrapperSelector, callback){
        if(typeof wrapperSelector == "string"){
            var nodes = document.querySelectorAll(wrapperSelector);
            for(var i = 0; i < nodes.length; i++){
                var node = nodes[i];
                var context = new ContextManager();
                _this.addAllHelpersToContext(context);
                _binder(node, context, callback);
            }
        }else{
            var context = new ContextManager();
            _this.addAllHelpersToContext(context);
            _binder(wrapperSelector, context, callback);
        }
    }
    _this.addAllHelpersToContext = function(context){
        for(var i = 0; i < _this.helpers.length; i++){
            _this.addToContext(context, _this.helpers[i]);
        }
    }
    _this.addToContext = function(context, component){
        if(component.isGlobal){
            var properties = Object.getOwnPropertyNames(component);
            for(var i in properties){
                var propertyName = properties[i];
                if(propertyName != "isGlobal" && propertyName != "name"){
                    context.addValue(propertyName, component[propertyName]);
                }
            }
        }else{
            context.addValue(component.name, component);
        }
    }
    _this.helper = function(component){
        if(typeof component == "function"){
            try{
                component = new component();
            }catch(ex){
                console.error("Failed to load component", component, ex);
                return false;
            }
        }
        if(_this.validateComponent(component)){
            _this.helpers.push(component);
            return true;
        }
        console.error("Failed to load component/helper, component must to be a object, class or a constructor", component);   
        return false;
        
    }
    _this.validateComponent = function(component){
        if(typeof component != "object"){
            console.error("Component must to be a object", component);
            return false;
        } 

        if(typeof component.name != "string" || component.name.trim().length == 0){
            console.error("Component must have a name", component);
            return false;
        }

        return true;
    }
    _this.component = function(componentName, component){
        if(typeof component == "function"){
            _this.components[componentName] = component;
            return;
        }
        if(typeof component == "object"){
            _this.components[componentName] = component;
            return;
        }
        console.error("Failed to load component/helper, component must to be a object, class or a constructor", componentName, component);   
    }
    _this.changePrefix = function(prefix){
        predecessor = prefix;
        bindPredecessor = predecessor + "bind:";
        modelPredecessor = predecessor + "model";
        eventPredecessor =  predecessor + "on:";
        loopPredecessor = predecessor + "for";
        conditionPredecessor = predecessor + "if";
        displayPredecessor = predecessor + "show";
        hidePredecessor = predecessor + "hide";
        rawPredecessor = predecessor + "raw";
        componentPredecessor = predecessor + "component";
    }
    _this.visible = function(obj, propertyName){
        var descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
        descriptor.enumerable = true;
        Object.defineProperty(obj, propertyName, descriptor);
    }
    _this.hidden = function(obj, propertyName){
        var descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
        descriptor.enumerable = false;
        Object.defineProperty(obj, propertyName, descriptor);
    }
}
Sup = new Sup();
window.Sup  = Sup;