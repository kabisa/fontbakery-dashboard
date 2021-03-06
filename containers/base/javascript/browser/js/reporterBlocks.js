define([
    'dom-tool'
  , 'isEqual'
  , 'jsonPointer'
  , 'PubSub'
], function(
    dom
  , isEqual
  , jsonPointer
  , PubSub
) {
    "use strict";
    function NotImplementedError(message, stack) {
        this.name = 'NotImplementedError';
        this.message = message || '(No message for NotImplementedError)';
        if(!stack && typeof Error.captureStackTrace === 'function')
            Error.captureStackTrace(this, NotImplementedError);
        else {
            this.stack = stack || (new Error()).stack || '(no stack available)';
        }
    }
    NotImplementedError.prototype = Object.create(Error.prototype);
    NotImplementedError.prototype.constructor = NotImplementedError;

    function KeyError(message, stack) {
        this.name = 'KeyError';
        this.message = message || '(No message for KeyError)';
        if(!stack && typeof Error.captureStackTrace === 'function')
            Error.captureStackTrace(this, KeyError);
        else {
            this.stack = stack || (new Error()).stack || '(no stack available)';
        }
    }
    KeyError.prototype = Object.create(Error.prototype);
    KeyError.prototype.constructor = KeyError;

    function ValueError(message, stack) {
        this.name = 'ValueError';
        this.message = message || '(No message for ValueError)';
        if(!stack && typeof Error.captureStackTrace === 'function')
            Error.captureStackTrace(this, ValueError);
        else {
            this.stack = stack || (new Error()).stack || '(no stack available)';
        }
    }
    ValueError.prototype = Object.create(Error.prototype);
    ValueError.prototype.constructor = ValueError;

    function HasNoChildrenError(message, stack) {
        this.name = 'HasNoChildrenError';
        this.message = message || '(No message for HasNoChildrenError)';
        if(!stack && typeof Error.captureStackTrace === 'function')
            Error.captureStackTrace(this, HasNoChildrenError);
        else {
            this.stack = stack || (new Error()).stack || '(no stack available)';
        }
    }
    HasNoChildrenError.prototype = Object.create(Error.prototype);
    HasNoChildrenError.prototype.constructor = HasNoChildrenError;

    /**
     * returns a dict like: {index: 0, pos: 'prepend'};
     * where index is an index within others when pos is not "prepend".
     * pos is one of: "after", "before" or "prepend"
     * When pos is "prepend", index is 0.
     */
    function binInsert(value, others, compare, allowEqual) {
        var length = others.length
          , start, end, middle, cmp
          ;

        if(!length)
            return {index: 0, pos: 'prepend'};

        cmp = compare || function(a, b) {
              if(a > b) return 1;
              if(a < b) return -1;
              return 0;
        };
        start = 0;
        end = length - 1;
        while(true) {
            // binary insert:
            if(cmp (value, others[end]) > 0)
                return {index: end, pos: 'after'};

            if(cmp(value,  others[start]) < 0)
                return {index: start, pos: 'before'};

            middle = start + Math.floor((end - start) / 2);

            if(cmp(value, others[middle]) < 0)
                end = middle - 1;
            else if(cmp(value, others[middle]) > 0)
                start = middle + 1;
            else if(allowEqual)
                return {index: middle, pos: 'after'};
            else
                // This should *NEVER* happen!
                throw new ValueError('An element with value "' + value
                                    + '" is already in the list.');
        }
    }
    /**
     * Convenience function, don't parse the path if it is an array already.
     * But, if it is an array, return a copy, so that it can be altered by
     * the caller without consequences for the outside world.
     */
    function prepPath(path) {
        return typeof path === 'string' ? jsonPointer.parse(path) : path.slice();
    }

    function getBlock (current, path) {
        var _current = current
          , parts = prepPath(path)
          , key
          ;
        parts.reverse();
        while((key = parts.pop()) !== undefined) {
            if (key === '')
                // This should be the case only for root anyways
                // but whenever it appears, it doesn't change th position
                // in the tree.
                continue;
            _current = _current.getChild(key);

        }
        return _current;
    }

    var _Block = (function() {
    function _Block(supreme, container, key, spec) {
        // jshint validthis: true
        this.supreme = supreme;
        this.container = container;
        this._spec = spec;

        // http://jsonpatch.com/
        // each of these need to handler JSONPatch commands
        // or dispatch them accordingly to their children
        // add, as it seems can add new objects (not just simple types)
        // thus this is similar to what we do when initialy building the
        // structure. ALSO: order may be important!
    }

    var _p = _Block.prototype;

    Object.defineProperty(_p, 'path', {
        get: function() {
            var pathParts = [this.key], parent=this.parent;
            while(parent) {
                pathParts.push(parent.key);
                parent=parent.parent;
            }
            return pathParts.reverse().join('/');
        }
    });

    /**
     * For simple values this is simply returning the value,
     * but objects and arrays need to query all their children.
     */
    Object.defineProperty(_p, 'data', {
        get: function() {
            throw new NotImplementedError('You need to implement the "data" getter.');
        }
    });

    _p.getChild = function(key) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "getChild".');
    };
    _p._insertChild = function(key, child) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_insertChild".');
    };

    _p._deleteChild = function(key) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_deleteChild".');
    };

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_makeChildContainer".');
    };

    /**
     *  insert into this.container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_insertChildContainer".');
    };

    _p._eachChild = function(callback, thisval) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_eachChild".');
    };

    _p.destroy = function() {
        this._eachChild(function(child){ child.destroy(); }, this);
    };

    _p.getBlock = function(path) {
        return getBlock(this, path);
    };

    /**
     * Reimplement in sub-class if needed.
     */
    _p._getChildFactory = function(key) {
        return (key in this._spec && this._spec[key].Type)
                    ? this._spec[key].Type
                    : this._spec[''].GenericType
                    ;
    };

    _p._getChildSpec = function(key) {
        if(this._spec[key] && 'spec' in this._spec[key])
            return this._spec[key].spec;
        return this._spec[''].genericSpec || undefined;
    };

    _p._create = function(container, key, data) {
        var constructor = this._getChildFactory(key)
          , spec = {}, childSpec
          , skipEmptyKey = new Set([''])
          , block
          ;

        function copy(from, to, skip) {
            var key;
            for(key in from) {
                if(skip && skip.has(key))
                    continue;
                to[key] = from[key];
            }
        }

        spec[''] = {};
        childSpec = this._getChildSpec(key);
        if(childSpec) {
            copy(childSpec, spec, skipEmptyKey);
            if ('' in childSpec)
                copy(childSpec[''], spec['']);
        }

        if (!('GenericType' in spec['']))
            spec[''].GenericType = this._spec[''].GenericType;

        if(constructor.constructorGetter)
            constructor = constructor(this.supreme, container, key, spec, data);

        block = Object.create(constructor.prototype);
        // so we can always calculate the path!
        // actually, having the constructor arguments always available,
        // even in the constructor, would make things easier in some
        // places.
        Object.defineProperties(block, {
            parent: { value: this, enumerable: true}
          , key: { value: key, enumerable: true}
        });
        constructor.call(block, this.supreme, container, key, spec, data);

         // find the right place to insert
        this._insertChild(key, block);
    };

    _p._getContainerForBlock = function(key, data) {
        var container = this._makeChildContainer(key, data);
        if(container)
            // allow blocks without container
            this._insertChildContainer(key, container);
        return container;
    };

    _p.add = function(key, data) {
        var container = this._getContainerForBlock(key, data);
        this._create(container, key, data);
    };

    _p.remove = function(key) {
        var block = this.getChild(key);
        block.destroy();
        this._deleteChild(key);
        if(block.container)
            dom.removeNode(block.container);
    };

    _p.replace = function(key, data) {
        var oldBlock = this.getChild(key)
        // TODO: this one, is not yet inserted into the dom
        // since we literally replace, there should be no need to
        // search for the right position.
        // alternativeley:
        // this.remove(key);
        // this.add(key, data);
        // add would have to figure out the right insertion position
          , container = this._makeChildContainer(key)
          ;
        oldBlock.destroy();
        this._deleteChild(key);
        if(oldBlock.container && container)// some blocks don't have containers
            dom.replaceNode(container, oldBlock.container);
        this._create(container, key, data);
    };
    return _Block;
    })();

    var DictionaryBlock = (function() {
    var Parent = _Block;
    function DictionaryBlock(supreme, container, key, spec, data) {
        Parent.call(this, supreme, container, key, spec);
        this._children = {};
        if(!data)
            return;
        var k;
        for(k in data)
            this.add(k, data[k]);
    }

    var _p = DictionaryBlock.prototype = Object.create(Parent.prototype);

    _p._eachChild = function(callback, thisval) {
        var key;
        for(key in this._children)
            callback.call(thisval || null, this._children[key]);
    };

    _p.hasChild = function(key) {
        return key in this._children;
    };

    _p.getChild = function(key) {
        if(!(key in this._children))
            throw new Error('Child not found "'+key+'" in "'+this+'"');
        return this._children[key];
    };

    /**
     * For simple values this is simply returning the value,
     * but objects and arrays need to query all their children.
     */
    Object.defineProperty(_p, 'data', {
        get: function() {
            var result = {}, k;
            for(k in this._children)
                result[k] = this._children[k].data;
            return result;
        }
    });

    _p._insertChild = function(key, child) {
        this._children[key] = child;
    };

    _p._deleteChild = function(key) {
        delete this._children[key];
    };

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_makeChildContainer".');
    };

    /**
     *  insert into this.container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_insertChildContainer".');
    };

    return DictionaryBlock;
    })();

    var ArrayBlock = (function() {

    var Parent = _Block;
    function ArrayBlock(supreme, container, key, spec, data) {
        Parent.call(this, supreme, container, key, spec);
        this._children = [];
        if(!data)
            return;
        var i, l;
        for(i=0, l=data.length;i<l;i++)
            this.add(i, data[i]);
    }

    var _p = ArrayBlock.prototype = Object.create(Parent.prototype);

    _p._eachChild = function(callback, thisval) {
        var i,l;
        for(i=0,l=this._children.length;i<l;i++)
            callback.call(thisval || null, this._children[i]);
    };

    _p.getChild = function(key) {
        if(this._children[key] === undefined)
            throw new Error('Child not found "'+key+'" in "'+this+'".');
        return this._children[key];
    };

    /**
     * For simple values this is simply returning the value,
     * but objects and arrays need to query all their children.
     */
    Object.defineProperty(_p, 'data', {
        get: function() {
            return this._children.map(function(child){return child.data;});
        }
    });

    _p._insertChild = function(key, child) {
        this._children.splice(key, 0, child);
    };

    _p._deleteChild = function(key) {
        this._children.splice(key, 1);
    };

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_makeChildContainer".');
    };

    /**
     *  insert into this.container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        throw new NotImplementedError('You need to implement "_insertChildContainer".');
    };

    return ArrayBlock;
    })();

    var PrimitiveValueBlock = (function() {

    var Parent = _Block;
    function PrimitiveValueBlock(supreme, container, key, spec, data) {
        Parent.call(this, supreme, container, key, spec);
        this._data = data;
    }

    var _p = PrimitiveValueBlock.prototype = Object.create(Parent.prototype);

    _p._eachChild = function(callback, thisval) {
        // jshint unused:vars
        // pass, has no children
    };

    _p.getChild = function(key) {
        throw new HasNoChildrenError('A PrimitiveValueBlock has no children, '
                                + 'requested "'+key+'" in "'+this+'".');
    };

    /**
     * For simple values this is simply returning the value,
     * but objects and arrays need to query all their children.
     */
    Object.defineProperty(_p, 'data', {
        get: function() {
            return this._data;
        }
    });

    _p._insertChild = function(key, child) {
        // jshint unused:vars
        throw new HasNoChildrenError('A PrimitiveValueBlock has no children, '
                                + 'requested "'+key+'" in "'+this+'".');
    };

    _p._deleteChild = function(key) {
        throw new HasNoChildrenError('A PrimitiveValueBlock has no children, '
                                + 'requested "'+key+'" in "'+this+'".');
    };

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        throw new HasNoChildrenError('A PrimitiveValueBlock has no children, '
                                + 'requested "'+key+'" in "'+this+'".');
    };

    /**
     *  insert into this.container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        throw new HasNoChildrenError('A PrimitiveValueBlock has no children, '
                                + 'requested "'+key+'" in "'+this+'".');
    };

    return PrimitiveValueBlock;
    })();

    // To make all the patching work here, we need the full Tree structure
    // as Generic Types. The GenericBlockType may be just a dispatcher?
    // So we need GenericDictBlock, GenericArrayBlock, GenericPrimitiveValueBlock

    var GenericDictionaryBlock = (function() {
    var Parent = DictionaryBlock;
    function GenericDictionaryBlock(supreme, container, key, spec, data) {
        // container may be null, to make this Dictionary "hidden"
        var children = [], keyMarker;
        if(!spec[''].skipKey) {
            if(container)
                keyMarker = dom.getMarkerComment(container, 'insert: key');
            if(keyMarker)
                dom.insert(keyMarker, 'after', dom.createTextNode(key));
            else
                children.push(dom.createElement(
                            spec[''].keyTag || 'strong', {}, key, false));
        }
        if(container)
            this._childrenInsertMarker = dom.getMarkerComment(
                                          container, 'insert: children');
        if(!this._childrenInsertMarker) {
            this._container = dom.createElement(spec[''].conatinerTag || 'ul');
            children.push(this._container);
        }
        if(children.length && container)
            dom.appendChildren(container, children, false);
        Parent.call(this, supreme, container, key, spec, data);
    }

    var _p = GenericDictionaryBlock.prototype = Object.create(Parent.prototype);

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        // jshint unused:vars
        var elem;
        if(this._spec[''].getElementForKeyFromTemplate)
            elem = this._spec[''].getElementForKeyFromTemplate(key);
        if(!elem)
            elem = dom.createElement(this._spec[''].childTag || 'li');
        return elem;
    };

    /**
     *  insert into this._container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        var keys = Object.keys(this._children)
          , position, reference, center, lastKey
          ;

        if(keys.length === 0) {
            // first
            if (this._childrenInsertMarker) {
                position = 'after';
                reference = this._childrenInsertMarker;
            }
            else {
                position = 'append';
                reference = this._container;
            }
        }
        else {
            // binary search
            keys.sort();
            while(keys.length) {
                center = Math.floor(keys.length-1 / 2);
                lastKey = keys[center];
                if(lastKey < key)
                    // +1 to lastKey
                    keys = keys.slice(center+1);
                else
                    keys = keys.slice(0, center);
            }
            position = lastKey <= key
                    ? 'after'
                    : 'before'
                    ;
            reference = this._children[lastKey].container;
        }
        dom.insert(reference, position, container);
    };

    return GenericDictionaryBlock;
    })();

    var GenericArrayBlock = (function() {
    var Parent = ArrayBlock;
    function GenericArrayBlock(supreme, container, key, spec, data) {
        var children = [];
        this._container = dom.createElement('ol');

        if(!spec[''].skipKey)
            children.push(dom.createElement(
                        spec[''].keyTag ||  'strong', {}, key, false));

        children.push(this._container);
        dom.appendChildren(container, children, false);
        Parent.call(this, supreme, container, key, spec, data);
    }

    var _p = GenericArrayBlock.prototype = Object.create(Parent.prototype);

        /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        // jshint unused:vars
        return dom.createElement('li', null, null, false);
    };

    /**
     *  insert into this._container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        var index  = parseInt(key, 10)
          , position, reference, target
          ;
        if(index === 0) {
            position = 'prepend';
            reference = this._container;
        }
        else if(this._children[index]) {
            position = 'before';
            reference = this._children[index].container;
        }
        else {
            target = binInsert(index, this._children.map(function(item) {
                                        return parseInt(item.key, 10);}));
            reference = this._children[target.index].container;
            position = target.pos;
        }
        dom.insert(reference, position, container);
    };

    return GenericArrayBlock;
    })();

    var GenericPrimitiveValueBlock = (function() {
    var Parent = PrimitiveValueBlock;
    function GenericPrimitiveValueBlock(supreme, container, key, spec, data) {
        var children = [], seperator, formated;
        if(!spec[''].skipKey)
            children.push(dom.createElement(
                        spec[''].keyTag ||  'strong', {}, key, false));

        if(!(spec[''].skipKey || spec[''].skipData) && spec[''].seperator) {
            if(spec[''].seperatorTag)
                seperator = dom.createElement(spec[''].seperatorTag, {}, spec[''].seperator);
            else
                seperator = dom.createTextNode(spec[''].seperator);

            children.push(seperator);
        }

        if(!spec[''].skipData) {
            if(spec[''].dataFormater)
                formated = spec[''].dataFormater(data);
            else
                formated = spec[''].dataUnescaped
                        ? data
                        : JSON.stringify(data, null, 2)
                        ;
            children.push(dom.createElement(
                        spec[''].dataTag || 'span', {}, formated, false)


            );
        }

        if(spec[''].addClasses)
            container.classList.add.apply(container.classList, spec[''].addClasses(data));

        // this should be styled as preformat
        if(container)
            dom.appendChildren(container, children, false);

        Parent.call(this, supreme, container, key, spec, data);
    }

    //var _p  =
    GenericPrimitiveValueBlock.prototype = Object.create(Parent.prototype);

    return GenericPrimitiveValueBlock;
    })();

    // not really a factory anymore :-/
    function genericBlockFactory(supreme, container, key, spec, data) {
        // jshint unused:vars
        var Constructor;
        if(data instanceof Array)
            Constructor = GenericArrayBlock;
        else if(data === null || typeof data !== 'object')
            Constructor = GenericPrimitiveValueBlock;
        else
            Constructor = GenericDictionaryBlock;
        return Constructor;
    }
    genericBlockFactory.constructorGetter = true;

    var FlexibleDocumentBlock = (function(){

    var Parent = DictionaryBlock;
    function FlexibleDocumentBlock(supreme, container, key, spec, data) {
        if(!this._genericItemsContainer)
            this._genericItemsContainer = dom.getChildElementForSelector(
                                            container, '.generic-items');
        Parent.call(this, supreme, container, key, spec, data);
    }
    var _p = FlexibleDocumentBlock.prototype = Object.create(Parent.prototype);

    _p._getClassForKey = function(key) {
        return this._spec[''].classPrefix + key;
    };

    _p._getElementFromTemplate = function(key) {
        var klass = this._getClassForKey(key);
        return this._spec[''].getElementFromTemplate(klass);
    };

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        if(this._spec[''].containerless &&  this._spec[''].containerless.has(key))
            return;
        // query the templates for {key} and return a deep copy of the result
        var container = this._getElementFromTemplate(key);
        if(!container)
            container = dom.createElement(this._spec[''].childTag || 'div',
                            {'class': this._getClassForKey(key)});
        return container;
    };

    /**
     *  insert into this._container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // custom comment markers would be nice here
        var target, position
          , insertionMarker = this._spec[''].insertionMarkerPrefix + key
          ;

        target = dom.getMarkerComment(this.container, insertionMarker);
        if(target)
            position = 'after';

        if(!target) {
            target = this._genericItemsContainer;
            position = 'append';
        }
        dom.insert(target, position, container);
    };

    return FlexibleDocumentBlock;
    })();

    var FlexibleArrayBlock = (function() {
    var Parent = ArrayBlock;
    function FlexibleArrayBlock(supreme, container, key, spec, data) {
        Parent.call(this, supreme, container, key, spec, data);
    }

    var _p = FlexibleArrayBlock.prototype = Object.create(Parent.prototype);
    _p.constructor = FlexibleArrayBlock;

    /**
     * Returns a DOM-Element, that is not yet in the document
     */
    _p._makeChildContainer = function(key) {
        //jshint unused:vars
        if(this._spec[''].containerlessChildren)
            return;
        var container = this._spec[''].getElementFromTemplate(
                                                this._spec[''].childClass);
        if(!container)
            container = dom.createElement(this._spec[''].childTag || 'li',
                            {'class': this._spec[''].childClass});
        return container;
    };

    /**
     *  insert into this.container at the right position
     */
    _p._insertChildContainer = function(key, container) {
        // jshint unused:vars
        var index  = parseInt(key, 10)
          , position, reference, target
          ;
        if(index === 0) {
            position = 'prepend';
            // this._childrenContainer can be defined by sub-classes
            reference = this._childrenContainer || this.container;
        }
        else if(this._children[index]){
            position = 'before';
            reference = this._children[index].container;
        }
        else {
            target = binInsert(index, this._children.map(function(item) {
                                        return parseInt(item.key, 10);}));
            reference = this._children[target.index].container;
            position = target.pos;
        }
        dom.insert(reference, position, container);
    };

    return FlexibleArrayBlock;
    })();

    var Supreme = (function() {
    function Supreme(RootBlock, container, rootTemplateElement
                            , rootInsertionMarker, spec) {
        this._container = container;
        this._rootInsertionMarker = rootInsertionMarker;
        this._rootTemplateElement = rootTemplateElement;
        this.RootBlock = RootBlock;
        this._root = null;
        this._spec = spec;
        this.pubSub = new PubSub();
        this._replaceRoot({});
    }

    var _p = Supreme.prototype;

    _p._replaceRoot = function(data) {
        var container = this._rootTemplateElement.cloneNode(true);
        if(this._root) {
            this._root.destroy();
            dom.replaceNode(container, this._root.container);
        }
        else
            dom.insertAtMarkerComment(this._container
                        , this._rootInsertionMarker, container, 'append');
        // Note, we don't set Parent and key is ''
        // !block.parent is a stop condition
        // key '' makes pathes absolute i.e. `pathParts.join('/')`
        this._root = new this.RootBlock(this, container, '', this._spec, data);
    };

    _p._getParent = function(path) {
        var parts = prepPath(path);
        parts.pop();
        return this._getBlock(parts);
    };

    _p._getKey = function(path) {
        return prepPath(path).pop();
    };

    _p._getBlock = function(path){
        return getBlock(this._root ,path);
    };

    _p.applyPatch = function(patch) {
        var operation = patch.op
          , args
          ;
        switch(operation) {
            case 'add':
                // falls through
            case 'replace':
                // falls through
            case 'test':
                args = [patch.path, patch.value];
                break;
            case 'remove':
                 args = [patch.path];
                 break;
            case 'copy':
                // falls through
            case 'move':
                args = [patch.from, patch.path];
                break;
            default:
                throw new Error('Unknown patch operation: "' + operation + '".');
        }
        this[operation].apply(this, args);
    };

    _p.applyPatches = function(patches) {
        var i, l;
        for(i=0,l=patches.length;i<l;i++)
            this.applyPatch(patches[i]);
    };

    _p.add = function(path, data) {
        var parent = this._getParent(path)
         , key = this._getKey(path)
         ;
        parent.add(key, data);
    };

    _p.remove = function(path) {
        var parent = this._getParent(path)
         , key = this._getKey(path)
         ;
        parent.remove(key);
    };

    _p.replace = function(path, data) {
        var parent = this._getParent(path)
         , key = this._getKey(path)
         ;

        if(key === '' && parent === this._root)
            this._replaceRoot(data);
        else
            parent.replace(key, data);
    };

    // these should be in the root controller
    _p.copy = function(from, path) {
        var data = this._getBlock(from).data;
        this.add(path, data);
    };

    _p.move = function(from, path) {
        var data = this._getBlock(from).data;
        this.remove(from);
        this.add(path, data);
    };

    _p.test = function(path, value) {
        var data = this._getBlock(path).data;
        return isEqual(value, data);
    };

    return Supreme;
    })();

    return {
        NotImplementedError: NotImplementedError
      , KeyError: KeyError
      , ValueError: ValueError
      , HasNoChildrenError: HasNoChildrenError
      , binInsert: binInsert
      , _Block: _Block
      , DictionaryBlock: DictionaryBlock
      , ArrayBlock: ArrayBlock
      , PrimitiveValueBlock: PrimitiveValueBlock
      , GenericDictionaryBlock: GenericDictionaryBlock
      , GenericArrayBlock: GenericArrayBlock
      , GenericPrimitiveValueBlock: GenericPrimitiveValueBlock
      , genericBlockFactory: genericBlockFactory
      , FlexibleDocumentBlock: FlexibleDocumentBlock
      , FlexibleArrayBlock: FlexibleArrayBlock
      , Supreme: Supreme
    };
});
