//
// Copyright 2012, 2016 by Xavax, Inc. All Rights Reserved
// Use of this software is allowed under the Xavax Open Software License.
// http://www.xavax.com/xosl.html
//

if ( typeof global !== "object" ) {
    var global = typeof window === "object" ? window :
        (function () { return this; }());
}

/*
 * Add methods to Array, Object, and String. If Object.defineProperty
 * is defined, make these methods unconfigurable and unenumerable. If
 * Object.defineProperty is not defined, the properties will be
 * enumerable. In this case you will need to add code to skip the
 * Object.merge method when merging objects. Look for "WARNING" below.
 */
(function() {
    var f = Object.defineProperty ? function(obj, prop, value) {
        var d = { enumerable: false, configurable: false, value: value };
        Object.defineProperty(obj, prop, d);
    } : function(obj, prop, value) {
        obj[prop] = value;
    };
    /**
     * Append the elements of an array to this array, much like Array.concat
     * except this method modifies this array.
     * @param source  an object or array of objects.
     */
    f(Array.prototype, 'append', function(source) {
        if ( source instanceof Array ) {
            for ( var i = 0; i < source.length; ++i ) {
                this.push(source[i]);
            }
        }
        else {
            this.push(source);
        }
    });
    /**
     * Returns true if object is contained in this array.
     */
    f(Array.prototype, 'contains', function(object) {
        var result = false;
        for ( var i = 0; i < this.length; ++i ) {
            if ( this[i] === object ) {
                result = true;
                break;
            }
        }
        return result;
    });
    /**
     * Iterate over each item of this array calling the function f in
     * the scope of the item and passing args as the arguments. Any
     * additional argments are passed through to f.
     * @param f  the function to call for each array item.
     */
    f(Array.prototype.foreach = function(f) {
        for ( var i = 0; i < this.length; ++i ) {
            f.apply(this[i], arguments);
        }
    });
    /**
     * Returns the index of the first occurrence of o in this array,
     * or -1 if o is not found. If startFrom is specified, begin at
     * index startFrom and return index of the next occurrence of o.
     * @param o  the object to find.
     * @param startFrom  the starting index for the search (optional).
     */
    if ( !Array.prototype.indexOf ) {
        f(Array.prototype.indexOf = function(o, startFrom) {
            var result = -1;
            var length = this.length;
            var i = startFrom && startFrom < length ? startFrom : 0;
            for ( ; i < length; ++i ) {
                if ( this[i] === o ) {
                    result = i;
                    break;
                }
            }
            return result;
        });
    }
    /**
     * Join the elements of an array using the specified separator string.
     */
    f(Array.prototype, 'join', function(separator) {
        separator = separator ? separator : "";
        var result = "";
        var first = true;
        for ( var i = 0; i < this.length; ++i ) {
            if ( first ) {
                first = false;
            }
            else {
                result += separator;
            }
            result += this[i];
        }
        return result;
    });
    /**
     * Map and reduce the elements of an array returning a single result.
     * @param mf  the mapping function, maps this item to a result.
     *            function mf(item, index, array)
     * @param rf  the reducing function, same as in Array.prototype.reduce.
     *            function rf(previous, item, index, array)
     */
    f(Array.prototype, 'mapr', function(mf, rf, initialValue) {
        var result = initialValue ? initialValue : undefined;
        for ( var i = 0; i < this.length; ++i ) {
            result = rf(result, mf(this[i], i, this), i, this);
        }
        return result;
    });
    /**
     * Merge the properties of source into this object. Only properties
     * of source that are not inherited unless mergeAll is true.
     * @param source  the object providing properties.
     * @param mergeAll  if true, merge all properties.
     */
    f(Object.prototype, 'merge', function(source, mergeAll) {
        if ( source ) {
            for ( var property in source ) {
                if ( source.hasOwnProperty(property) ) {
                    this[property] = source[property];
                }
            }
        }
        else {
            throw("merge called with undefined object");
        }
    });
    /**
     * Format a message from this string, replacing positional parameters
     * ({1}, {2}, etc.) with parameters from the arguments array.
     */
    f(String.prototype, 'format', function() {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function() {
            var arg = args[arguments[1]];
            return (arg || arg == "") ? arg : arguments[0];
        });
    });
})();

xutils = {
    mergeMethods: function(target, declaredIn, source) {
        if ( source ) {
            for ( var property in source ) {
                if ( source.hasOwnProperty(property) ) {
                    srcprop = source[property];
                    target[property] = srcprop;
                    if ( typeof(srcprop) === "function" ) {
                        srcprop._name = property;
                        srcprop._declaredIn = declaredIn;
                    }
                }
            }
        }
        else {
            throw("merge called with undefined object");
        }
    },
    /**
     * Returns true if the object specified by a name exists.
     */
    checkName: function(name) {
        return xutils.traverseName(name, function(parts, part, current, i) {
            var ns = current[part];
            return typeof(ns) === "undefined" ?
                false : ((i == parts.length - 1) ? true : ns);
        });
    },
    /**
     * Returns the object referred to by a composite name.
     * @param name  a composite name or array of name elements.
     * @return the object specified by the name.
     */
    resolveName: function(name) {
        return xutils.traverseName(name, function(parts, part, current, i) {
            var ns = current[part];
            return ns ? ns : null;
        });
    },
    /**
     * Traverse over the elements of a name, calling tf for each element.
     * Begin with the global namespace (global) as the current namespace.
     * The return value of each call to tf becomes the current namespace.
     * @param name  a composite name or array of name elements.
     * @param f     a function to call for each element.
     * @param start  the namespace where the search begins.
     * @return the value return by the last invocation of f.
     */
    traverseName: function(name, tf, start) {
        var parts = name instanceof Array ? name :
            (typeof(name) == "string" ? name.split('.') : []);
        var current = start ? start : global;
        var length = parts.length;
        for ( var i = 0; current && i < length; ++i ) {
            current = tf(parts, parts[i], current, i);
        }
        return current;
    },
    noop: function() {}
}

/**
 * XNamespace is a class used to represent a namespace.
 * @param name  the name of this namespace.
 * @param parent  a reference to the parent namespace.
 */
function XNamespace(name, parent) {
    this._name = name;
    this._parent = parent;
}
XNamespace.prototype = {
    constructor: XNamespace,
    messages: [
        "{1} is not a valid namespace."
    ],
    /**
     * Return the fully qualified name for this namespace by recursively
     * calling this method to get the fully qualified name of the parent
     * namespace and appending the name of this namespace.
     */
    fullName: function() {
        var parent = this._parent;
        return (parent && parent instanceof XNamespace ?
                (parent.fullName() + ".") : "") + this._name;
    },
    /**
     * Returns a namespace for the specified name, which can be a composite
     * name ("a.b.c") or array of name elements. (['a','b','c']). If the
     * namespace or parent namespace does not exist, attempt to create it.
     * @param name  a composite name or array of name elements.
     * @return the namespace foe the specified name.
     */
    namespace: function(name) {
        return xutils.traverseName(name, function(parts, part, current, i) {
            if ( !current[part] ) {
                current[part] = new XNamespace(part, current);
            }
            else if ( !(current[part] instanceof XNamespace) ) {
                throw this.messages[0].format(part);
            }
            return current[part];
        });
    },
    /**
     * Returns a namespace for the specified name, or null if the namespace
     * does not exist.
     * @param name  a composite name or array of name elements.
     * @return the namespace foe the specified name.
     */
    resolve: function(name) {
        return xutils.resolveName(name);
    }
}

/**
 * XInterface represents an interface, much like a Java interface.
 */
function XInterface(fullName, className, namespace, methods) {
    this.fullName = fullName;
    this.className = className;
    this.namespace = namespace;
    this.methods = methods;
}

function XAppender(name, configuration) {
    this.name = name;
    this.configuration = configuration;
}
XAppender.prototype = {
    constructor: XAppender,
    append: function(level, message) {
        message = this.name + ":" + message;
        this.writers[level](level, message);
    },
    writers: [ xutils.noop, xutils.noop, xutils.noop, 
               xutils.noop, xutils.noop, xutils.noop ]
}

function XAlertAppender() {
    XAppender.apply(this, arguments);
}
XAlertAppender.prototype = new XAppender();
XAlertAppender.prototype.alert = function(level, message) {
    alert(message);
}
XAlertAppender.prototype.merge({
    constructor: XAlertAppender,
    writers: [
        XAlertAppender.prototype.alert, XAlertAppender.prototype.alert,
        XAlertAppender.prototype.alert, XAlertAppender.prototype.alert,
        XAlertAppender.prototype.alert, XAlertAppender.prototype.alert
    ]
});

function XConsoleAppender() {
    XAppender.apply(this, arguments);
}
XConsoleAppender.prototype = new XAppender();
XConsoleAppender.prototype.merge({
    constructor: XConsoleAppender,
    writers: [
        function(level, message) {
            console.error(message);
        },
        function(level, message) {
            console.error(message);
        },
        function(level, message) {
            console.warn(message);
        },
        function(level, message) {
            console.log(message);
        },
        function(level, message) {
            console.log(message);
        },
        function(level, message) {
            console.log(message);
        }
    ]
});

function XLogger(name) {
    this.name = name;
    this.logs = [];
    this.maxLevel = -1;
    this.configure();
}
XLogger.prototype = {
    constructor: XLogger,
    fatalLevel: 0,
    errorLevel: 1,
    warnLevel:  2,
    infoLevel:  3,
    debugLevel: 4,
    traceLevel: 5,
    append: function(level, caller, message) {
        if ( level < this.levelNames.length ) {
            var levelName = this.displayNames[level];
            var msg = this.messages[0];
            var className = "";
            var methodName = "";
            if ( caller && caller._declaredIn ) {
                msg = this.messages[1];
                className = caller._declaredIn.prototype.className;
                methodName = caller._name;
            }
            var s = msg.format(levelName, className, methodName, message);
            var logs = this.logs;
            for ( var i = 0; i < logs.length; ++i ) {
                var log = logs[i];
                if ( level <= log.level ) {
                    log.appender.append(level, s);
                }
            }
        }
        else {
            var s = this.messages[4].format(level);
            console.error(s);
        }
    },
    configure: function() {
        if ( !XLogger.prototype.configuration ) {
            this.loadConfiguration();
        }
        var loggers = XLogger.prototype.configuration.loggers;
        var root = loggers['root'];
        var logs = root ? root._logs.concat([]) : [];
        xutils.traverseName(this.name, function(parts, part, current, i){
            var logger = current[part];
            if ( logger ) {
                if ( logger._logs ) {
                    if ( logger._additive ) {
                        logs.append(logger._logs);
                    }
                    else {
                        logs = logger._logs.concat([]);
                    }
                }
            }
            else {
                logger = current[part] = {};
            }
            return logger;
        }, loggers);
        var logMap = {};
        for ( var i = 0; i < logs.length; ++i ) {
            var log = logs[i];
            var name = log._appender.name;
            var level = log._level;
            var entry = logMap[name];
            if ( entry ) {
                if ( entry.level < level ) {
                    entry.level = level;
                }
            }
            else {
                entry = {
                    name: name, level: level,
                    appender: log._appender.appender
                };
                logMap[name] = entry;
                this.logs.push(entry);
            }
            if ( level > this.maxLevel ) {
                this.maxLevel = level;
            }
        }
    },
    loadConfiguration: function() {
        XLogger.prototype.configuration = {
            appenders: {},
            loggers: {}
        };
        var conf = global['XLoggerConfig'];
        conf = conf ? conf : this.defaultConfiguration;
        var items = conf.appenders;
        var appenders = XLogger.prototype.configuration.appenders;
        if ( items ) {
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                var name = item.name;
                var className = item.className;
                if ( name && className ) {
                    var ctor = xutils.resolveName(className);
                    if ( ctor && typeof(ctor) === 'function' ) {
                        var appender = new ctor(name, item);
                        appenders[name] = {
                            name: item.name, className: className,
                            appender: appender, configuration: item };
                    }
                    else {
                        console.warn(this.messages[2].format(className));
                    }
                }
                else {
                    console.warn(this.messages[3].format(item));
                }
            }
        }
        items = conf.loggers;
        if ( items ) {
            var loggers = XLogger.prototype.configuration.loggers;
            var f = function(parts, part, current, i) {
                if ( !current[part] ) {
                    current[part] = {};
                }
                return current[part];
            };
            for ( var i = 0; i < items.length; ++i ) {
                var item = items[i];
                var name = item.name;
                var logger = xutils.traverseName(name, f, loggers);
                logger._logs = [];
                var logs = item.logs;
                for ( var j = 0; j < logs.length; ++j ) {
                    var log = logs[j];
                    var aname = log.appender;
                    var a = appenders[aname];
                    if ( a ) {
                        var s = log.level ? log.level.toUpperCase() : undefined;
                        var level = s ? this.levelNames.indexOf(s) : -1;
                        if ( level >= 0 ) {
                            var entry = {
                                _appender: a,
                                _level: level,
                                _additive: log.additive ? log.additive : true
                            };
                            logger._logs.push(entry);
                        }
                        else {
                            var s = this.messages[5].format(name, aname);
                            console.error(s);
                        }
                    }
                    else {
                        var s = this.messages[6].format(name, aname);
                        console.error(s);
                    }
                }
            }
        }
    },
    fatal: function(caller, message) {
        if ( this.maxLevel >= this.fatalLevel ) {
            this.append(this.fatalLevel, caller, message);
        }
    },
    error: function(caller, message) {
        if ( this.maxLevel >= this.errorLevel ) {
            this.append(this.errorLevel, caller, message);
        }
    },
    warn: function(caller, message) {
        if ( this.maxLevel >= this.warnLevel ) {
            this.append(this.warnLevel, caller, message);
        }
    },
    info: function(caller, message) {
        if ( this.maxLevel >= this.infoLevel ) {
            this.append(this.infoLevel, caller, message);
        }
    },
    debug: function(caller, message) {
        if ( this.maxLevel >= this.debugLevel ) {
            this.append(this.debugLevel, caller, message);
        }
    },
    trace: function(caller, message) {
        if ( this.maxLevel >= this.traceLevel ) {
            this.append(this.traceLevel, caller, message);
        }
    },
    enter: function(caller) {
        if ( this.maxLevel >= this.traceLevel ) {
            this.append(this.traceLevel, caller, "enter");
        }
    },
    leave: function(caller) {
        if ( this.maxLevel >= this.traceLevel ) {
            this.append(this.traceLevel, caller, "leave");
        }
    },
    addMixin: function(target, declaredIn) {
        xutils.mergeMethods(target, declaredIn, this.loggerMixin);
    },
    loggerMixin: {
        fatal: function(args, message) {
            this.logger.fatal(args.callee, message);
        },
        error: function(args, message) {
            this.logger.error(args.callee, message);
        },
        warn: function(args, message) {
            this.logger.warn(args.callee, message);
        },
        info: function(args, message) {
            this.logger.info(args.callee, message);
        },
        debug: function(args, message) {
            this.logger.debug(args.callee, message);
        },
        trace: function(args, message) {
            this.logger.trace(args.callee, message);
        },
        enter: function(args) {
            this.logger.enter(args.callee);
        },
        leave: function(args) {
            this.logger.leave(args.callee);
        }
    },
    levelNames: [ 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE' ],
    displayNames: [ 'FATAL', 'ERROR', 'WARN ', 'INFO ', 'DEBUG', 'TRACE' ],
    messages: [
        '{0}: {3}',
        '{0}:{1}.{2}: {3}',
        'XLogger: could not resolve appender class {0}',
        'XLogger: invalid appender specification [{0}]',
        'XLogger: called with invalid log level {0}',
        'XLogger: logger {0} does not specify a valid level for appender {1}',
        'XLogger: logger {0} specifies invalid appender {1}'
    ],
    defaultConfiguration: {
        appenders: [
            { name: 'root',  className: 'XConsoleAppender' }
        ],
        loggers: [
            { name: 'root',
              logs: [
                  { level: 'warn',  appender: 'root' }
              ]
            },
        ]
    }
}

xlogger = new XLogger("root");
XLogger.prototype.root = xlogger;

/**
 * XObject is the base class for all classes created using XClass.
 */
function XObject() {}
XObject._name = "XObject";
XObject._declaredIn = XObject;
xutils.mergeMethods(XObject.prototype, XObject, {
    constructors: [],
    constructor: XObject,
    catalog: {},
    className: "XObject",
    messages: [
        "The {0} method {1} inherits from {2} does not override a method."
    ],
    /**
     * Initialize an object by calling all constructors in its
     * constructor chain.
     * @param args  the arguments array passed to the constructor.
     */
    _init: function(args) {
        var constructors = this.constructor.prototype.constructors;
        for ( var i = 0; i < constructors.length; ++i ) {
            constructors[i].apply(this, args);
        }
    },
    /**
     * Find the function in a base class overriden by the caller
     * and call that function.
     * @param args  the arguments array passed to the caller.
     */
    inherited: function(args) {
        var f;
        var callee = args.callee;
        if ( callee ) {
            var name = callee._name;
            var entries = this.catalog[name];
            for ( var i = entries.length - 1; i >= 0; --i ) {
                var entry = entries[i];
                if ( entry.method === callee && i > 0 ) {
                    f = entries[i-1].method;
                    break;
                }
            }
        }
        if ( f ) {
            f.apply(this,args);
        }
        else {
            var declaredIn = callee._declaredIn.prototype.className;
            var s = this.messages[0].format(callee._name, this.className,
                                            declaredIn);
            this.error(arguments, s);
        }
    },
    /**
     * Returns true if this object implements the specified interface.
     */
    implements: function(xinterface) {
        return this.constructor.prototype.interfaces.contains(xinterface);
    }
});
xlogger.addMixin(XObject.prototype, XObject);

/**
 * XClass provides a framework for creating classes that support single
 * inheritance and constructor chaining in a manner similar to Java.
 */

function XClass() {
    this.logger = new XLogger("xclass");
}
XClass.prototype = new XNamespace("xclass", global);
XClass._name = "XClass";
XClass._declaredIn = XClass;
xutils.mergeMethods(XClass.prototype, XClass, {
    constructor: XClass,
    className: "XClass",
    /**
     * Properties to be filtered when merging properties into a prototype.
     */
    filterList: ["className", "constructor", "constructors", "implements",
                 "inherited", "_init", "interfaces", "merge", "mixins",
                 "namespace", "superclass" ],
    fromThisClass: 0,
    fromSuperclass: 1,
    fromMixinClass: 2,
    messages: [
        "Declaration of class {0} failed - {1}",
        "superclass cannot be null or undefined.",
        "must inherit from XObject",
        "element {0} in superclass list does not exist.",
        "element {0} in superclass list is not allowed as a mixin class.",
        "element {0} in superclass list is not a class or interface.",
        "{0} overrides property or method in {1}",
        "interface {0} methods: {1}",
        "class must implement {0}"
    ],
    /**
     * Declare a new class using a brief, concise notation. Create the
     * constructor and prototype for the new class and mix in all of
     * provided properties. If any properties are functions, link them
     * to any function in a base class that is overriden. Build an
     * array of constructors including the constructor for the new
     * class and any base classes. If more than one superclass is
     * provided, the additional classes must be mixin classes.
     * @param fullClassName  a fully qualified classname
     * @param superclass  either a superclass or array of classes.
     * @param properties  the properties for the new class.
     */
    declare: function(fullClassName, superclass, properties) {
        this.debug(arguments, "declaring class: " + fullClassName);
        try {
            var classList = [];
            if ( superclass instanceof Array ) {
                classList = superclass;
                superclass = classList.shift();
            }
            if ( !superclass ) {
                throw(this.messages[1]);
            }
            if ( !((superclass === XObject) ||
                   (superclass.prototype instanceof XObject)) ) {
                throw(this.messages[2]);
            }
            // Find the namespace for the new class.
            var names = fullClassName.split('.');
            var className = names.pop();
            var namespace = this.namespace(names);
            // Create the prototype from the superclass.
            var f = new Function();
            f.prototype = superclass.prototype;
            var cproto = new f();
            this.addProperty(cproto, 'className', className);
            this.addProperty(cproto, 'superclass', superclass);
            this.addProperty(cproto, 'namespace', namespace);
            var mixins = this.addProperty(cproto, 'mixins', [ ]);
            var interfaces = this.addProperty(cproto, 'interfaces', [ ]);
            this.addProperty(cproto, 'catalog', { });
            this.mergeCatalog(cproto.catalog, superclass.prototype.catalog,
                              this.fromSuperclass);
            // Create an array of constructors including any
            // constructors in the base class hierarchy.
            this.addProperty(cproto, 'constructors', [ ]);
            cproto.constructors.append(superclass.prototype.constructors);
            // Create the constructor for the new class.
            eval("var newClass = function " + className +
                 "(){this._init(arguments);}");
            this.addProperty(cproto, 'constructor', newClass);
            newClass.prototype = cproto;
            newClass._name = className;
            newClass._declaredIn = newClass;
            // Merge mixin classes and make a list of interfaces.
            for ( var i = 0; i < classList.length; ++i ) {
                var cl = classList[i];
                var clproto;
                var position = i + 2;
                if ( !cl ) {
                    throw(this.messages[3].format(position));
                }
                else if ( cl instanceof XInterface ) {
                    interfaces.push(cl);
                }
                else if ( typeof(cl) === "function" &&
                          (clproto = cl.prototype) instanceof XObject ) {
                    // Test the mixin constructors to guarantee true tree.
                    var ctors = clproto.constructors;
                    for ( var j = 0; j < ctors.length; ++j ) {
                        if ( cproto.constructors.contains(ctors[j]) ) {
                            throw(this.messages[4].format(position));
                        }
                    }
                    cproto.constructors.append(ctors);
                    mixins.push(cl);
                    interfaces.merge(clproto.interfaces);
                    this.mergeCatalog(cproto.catalog, clproto.catalog,
                                      this.fromMixinClass);
                }
                else {
                    throw(this.messages[5].format(position));
                }
            }
            var loggerProps = {
                logger: new XLogger(fullClassName, superclass.prototype.logger)
            };
            this.addToCatalog(cproto.catalog, loggerProps, newClass);
            this.addToCatalog(cproto.catalog, properties, newClass);
            // Mix in all properties and link inherited functions.
            this.mergePrototype(cproto, loggerProps);
            this.mergePrototype(cproto, properties);
            // Add methods to the prototype.
            var catalog = cproto.catalog;
            for ( var name in catalog ) {
                // WARNING: Check for "merge" here!
                if ( name === 'merge' ) {
                    continue;
                }
                var entries = catalog[name];
                var top = entries.length - 1;
                var entry = entries[top];
                if ( entry.from !== this.fromSuperclass ) {
                    cproto[name] = entry.method;
                }
            }
            // Make sure all methods of all interfaces are implemented.
            for ( var i = 0; i < interfaces.length; ++i ) {
                var xi = interfaces[i];
                var methods = xi.methods;
                this.debug(arguments,
                           this.messages[7].format(xi.className, methods));
                for ( var j = 0; j < methods.length; ++j ) {
                    var methodName = xi.methods[j];
                    var f = cproto[methodName];
                    if ( !(f && f instanceof Function) ) {
                        var s = xi.namespace.fullName() + "." + methodName;
                        throw(this.messages[8].format(s));
                    }
                }
            }
            var ctorName = 'constructor';
            var ctor = properties[ctorName];
            if ( ctor ) {
                ctor._name = ctorName;
                ctor._declaredIn = newClass;
                cproto.constructors.push(ctor);
            }
            namespace[className] = newClass;
        }
        catch (err) {
            var msg = this.messages[0].format(fullClassName, err);
            this.error(arguments, msg);
            throw(msg);
        }
    },
    /**
     * Add any functions in properties to the method catalog.
     */
    addToCatalog: function(catalog, properties, constructor) {
        for ( var name in properties ) {
            var property = properties[name];
            if ( typeof(property) === "function" &&
                 !this.filterList.contains(name) ) {
                property._name = name;
                property._declaredIn = constructor;
                var entry = { method: property, from: this.fromThisClass };
                var target = catalog[name];
                if ( target ) {
                    target.push(entry);
                }
                else {
                    catalog[name] = [ entry ];
                }
            }
        }
    },
    /**
     * Merge the method catalog of a class into the catalog of this
     * class. The from value is encode as:
     *  0 = method is defined in this class.
     *  1 = method is defined in the superclass.
     *  2 = method is defined in a mixin class.
     */
    mergeCatalog: function(targetCatalog, sourceCatalog, from) {
        for ( var name in sourceCatalog ) {
            // WARNING: Check for "merge" here!
            if ( name === 'merge' ) {
                continue;
            }
            var source = sourceCatalog[name];
            var target = targetCatalog[name];
            if ( !target ) {
                target = targetCatalog[name] = [];
            }
            for ( var i = 0; i < source.length; ++i ) {
                var sourceEntry = source[i];
                var targetEntry = { method: sourceEntry.method, from: from };
                target.push(targetEntry);
            }
        }
    },
    /**
     * Declare a new interface.
     * @param fullName  a fully qualified interface name
     * @param methods   a list of methods for this interface.
     */
    declareInterface: function(fullName, methods) {
        // Find the namespace for the new class.
        var names = fullName.split('.');
        var name = names.pop();
        var namespace = this.namespace(names);
        var newInterface = new XInterface(fullName, name, namespace, methods);
        namespace[name] = newInterface;
    },
    /**
     * Add properties to a prototype. Skip properties that appear in
     * filterList. Skip functions which are handled elsewhere.
     * @param target  the target prototype to receive new properties.
     * @param properties  an object containing properties to mix in.
     */
    mergePrototype: function(target, properties) {
        for ( var property in properties ) {
            if ( !this.filterList.contains(property) &&
                 typeof(value) !== "function" ) {
                target[property] = properties[property];
            }
        }
    },
    /**
     * Create a callback function that can be called later to invoke
     * function f in the context of o, essentially hooking f to o.
     * @param  o   any object with method f.
     * @param  f   a function that is a method of o.
     */
    hook: function(o, f) {
        return function() {
            f.apply(o, arguments);
        }
    },
    /**
     * Require that a resource is loaded. If the resource cannot be
     * found, convert the resource name to a pathname and try to load
     * it. The pathname is constructed by converting the resource name
     * to a path by replaceing '.' with '/', adding the root path as a
     * prefix, and adding a ".js" suffix. The root path is derived
     * from the location where xclass.js was loaded.
     * @param resource  a resource name in dot notation such as
     *                  xfaces.Shell or yoyodyne.widgets.ScrollBar.
     */
    require: function(resource) {
        var names = resource.split('.');
        resource = names.pop();
        var namespace = this.resolve(names);
        if ( !namespace || !namespace[resource] ) {
            names.push(resource);
            var path = this.rootPath + names.join("/") + ".js";
            this.info(arguments, "loading: " + path);
            if ( this.avoidXHR ) {
                var head = document.head;
                var node = document.createElement('script');
                node.setAttribute("type", "text/javascript");
                node.setAttribute("src", path);
                head.appendChild(node);
            }
            else {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', path, false);
                xhr.send(null);
                var response = xhr.responseText;
                response += "\r\n//# sourceURL=" + path;
                eval(response);
            }
        }
    },
    /**
     * Initialize the root path. This is environment dependent. The
     * following code should work for most browsers.
     */
    init: function() {
        if ( document ) {
            var rexp = /xclass\.js$/i;
            var list = document.getElementsByTagName("script");
            for ( var i = 0; i < list.length; ++i ) {
                var node = list.item(i);
                var path = node.src;
                if ( path ) {
                    var match = path.match(rexp);
                    if ( match ) {
                        path = path.substring(0, match.index);
                        this.rootPath = path;
                    }
                }
            }
        }
    }
});
XClass.prototype.addProperty = Object.defineProperty ?
    function(obj, prop, value) {
        var d = { enumerable: false, configurable: false, value: value };
        Object.defineProperty(obj, prop, d);
        return value;
    } : function(obj, prop, value) {
        return obj[prop] = value;
    };
xlogger.addMixin(XClass.prototype, XClass);

/**
 * XMixin represents a mixin class. A mixin has no constructor
 * and does not extend another class. It is essentially like a
 * Java interface with default behavior.
 * @param className  the simple class name (no namespace).
 * @param namespace  the namespace for this class.
 */
function XMixin(className, namespace) {
    this.className = className;
    this.namespace = namespace;
}

xclass = new XClass();
xclass.init();
