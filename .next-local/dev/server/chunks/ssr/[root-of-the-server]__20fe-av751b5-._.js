module.exports = [
"[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
var mod = await __turbopack_context__.y("pg-587764f78a6c7a9c");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/node_modules/@opentelemetry/api/dist/api/context.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContextAPI",
    ()=>ContextAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$NoopContextManager$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/context/NoopContextManager.mjs [app-rsc] (ecmascript)");
;
;
;
//#region src/api/context.ts
const API_NAME = "context";
const NOOP_CONTEXT_MANAGER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$NoopContextManager$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NoopContextManager"]();
const NOOP_TOKEN = Object.freeze({
    dispose: ()=>{}
});
/**
* Singleton object which represents the entry point to the OpenTelemetry Context API
*
* @since 1.0.0
*/ var ContextAPI = class ContextAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){
        this._attachUnsupportedWarned = false;
    }
    /** Get the singleton instance of the Context API */ static getInstance() {
        if (!this._instance) this._instance = new ContextAPI();
        return this._instance;
    }
    /**
	* Set the current context manager.
	*
	* @returns true if the context manager was successfully registered, else false
	*/ setGlobalContextManager(contextManager) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, contextManager, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
	* Get the currently active context
	*/ active() {
        return this._getContextManager().active();
    }
    /**
	* Execute a function with an active context
	*
	* @param context context to be active during function execution
	* @param fn function to execute in a context
	* @param thisArg optional receiver to be used for calling fn
	* @param args optional arguments forwarded to fn
	*/ with(context, fn, thisArg, ...args) {
        return this._getContextManager().with(context, fn, thisArg, ...args);
    }
    /**
	* Bind a context to a target function or event emitter
	*
	* @param context context to bind to the event emitter or function. Defaults to the currently active context
	* @param target function or event emitter to bind
	*/ bind(context, target) {
        return this._getContextManager().bind(context, target);
    }
    /**
	* Imperatively sets `context` as active, returning a {@link ContextManagementToken} whose
	* {@link ContextManagementToken.dispose} restores the previous context.
	*
	* This is a delicate, low-level API - prefer {@link with}/{@link bind}, which
	* restore context automatically. Use `attach` only to bridge callback
	* boundaries that `with` cannot wrap. Call `token.dispose()` when the
	* operation is done.
	*
	* **Caveat for async functions:** If called inside an async function before
	* the first `await`, the context change may leak into the caller's context
	* and remain active there. Prefer {@link with} for async code.
	*
	* Support is best-effort and varies by the active ContextManager (see
	* {@link ContextManager.attach}); if it does not implement `attach`, this logs
	* a warning and returns a no-op token.
	*
	* @param context The Context to attach
	* @returns A {@link ContextManagementToken} whose dispose() restores the previous Context
	* @since 1.10.0
	* @experimental This API is experimental and may change in minor releases without prior notice.
	*/ attach(context) {
        const contextManager = this._getContextManager();
        if (contextManager.attach) return contextManager.attach(context);
        if (!this._attachUnsupportedWarned) {
            this._attachUnsupportedWarned = true;
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance().warn("The current ContextManager does not implement attach(). The context will not be attached. Use a ContextManager that supports attach() (e.g. AsyncLocalStorageContextManager) or use with()/bind() instead.");
        }
        return NOOP_TOKEN;
    }
    _getContextManager() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || NOOP_CONTEXT_MANAGER;
    }
    /** Disable and remove the global context manager */ disable() {
        this._getContextManager().disable();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagAPI",
    ()=>DiagAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$diag$2f$ComponentLogger$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/diag/ComponentLogger.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$diag$2f$internal$2f$logLevelLogger$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/diag/internal/logLevelLogger.mjs [app-rsc] (ecmascript)");
;
;
;
;
//#region src/api/diag.ts
const API_NAME = "diag";
/**
* Singleton object which represents the entry point to the OpenTelemetry internal
* diagnostic API
*
* @since 1.0.0
*/ var DiagAPI = class DiagAPI {
    /** Get the singleton instance of the DiagAPI API */ static instance() {
        if (!this._instance) this._instance = new DiagAPI();
        return this._instance;
    }
    /**
	* Private internal constructor
	* @private
	*/ constructor(){
        function _logProxy(funcName) {
            return function(...args) {
                const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])("diag");
                if (!logger) return;
                return logger[funcName](...args);
            };
        }
        const self = this;
        const setLogger = (logger, optionsOrLogLevel = {
            logLevel: 60
        })=>{
            var _optionsOrLogLevel$lo;
            if (logger === self) {
                var _err$stack;
                const err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
                self.error((_err$stack = err.stack) !== null && _err$stack !== void 0 ? _err$stack : err.message);
                return false;
            }
            if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = {
                logLevel: optionsOrLogLevel
            };
            const oldLogger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])("diag");
            const newLogger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$diag$2f$internal$2f$logLevelLogger$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createLogLevelDiagLogger"])((_optionsOrLogLevel$lo = optionsOrLogLevel.logLevel) !== null && _optionsOrLogLevel$lo !== void 0 ? _optionsOrLogLevel$lo : 60, logger);
            if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
                var _Error$stack;
                const stack = (_Error$stack = /* @__PURE__ */ new Error().stack) !== null && _Error$stack !== void 0 ? _Error$stack : "<failed to generate stacktrace>";
                oldLogger.warn(`Current logger will be overwritten from ${stack}`);
                newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerGlobal"])("diag", newLogger, self, true);
        };
        self.setLogger = setLogger;
        self.disable = ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, self);
        };
        self.createComponentLogger = (options)=>{
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$diag$2f$ComponentLogger$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagComponentLogger"](options);
        };
        self.verbose = _logProxy("verbose");
        self.debug = _logProxy("debug");
        self.info = _logProxy("info");
        self.warn = _logProxy("warn");
        self.error = _logProxy("error");
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/api/metrics.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MetricsAPI",
    ()=>MetricsAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$metrics$2f$NoopMeterProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/metrics/NoopMeterProvider.mjs [app-rsc] (ecmascript)");
;
;
;
//#region src/api/metrics.ts
const API_NAME = "metrics";
/**
* Singleton object which represents the entry point to the OpenTelemetry Metrics API
*
* @since 1.4.1
*/ var MetricsAPI = class MetricsAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){}
    /** Get the singleton instance of the Metrics API */ static getInstance() {
        if (!this._instance) this._instance = new MetricsAPI();
        return this._instance;
    }
    /**
	* Set the current global meter provider.
	* Returns true if the meter provider was successfully registered, else false.
	*/ setGlobalMeterProvider(provider) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, provider, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
	* Returns the global meter provider.
	*/ getMeterProvider() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$metrics$2f$NoopMeterProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NOOP_METER_PROVIDER"];
    }
    /**
	* Returns a meter from the global meter provider.
	*/ getMeter(name, version, options) {
        return this.getMeterProvider().getMeter(name, version, options);
    }
    /** Remove the global meter provider */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/api/propagation.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PropagationAPI",
    ()=>PropagationAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/baggage/utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$propagation$2f$TextMapPropagator$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/propagation/TextMapPropagator.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$propagation$2f$NoopTextMapPropagator$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/propagation/NoopTextMapPropagator.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$context$2d$helpers$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/baggage/context-helpers.mjs [app-rsc] (ecmascript)");
;
;
;
;
;
;
//#region src/api/propagation.ts
const API_NAME = "propagation";
const NOOP_TEXT_MAP_PROPAGATOR = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$propagation$2f$NoopTextMapPropagator$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NoopTextMapPropagator"]();
/**
* Singleton object which represents the entry point to the OpenTelemetry Propagation API
*
* @since 1.0.0
*/ var PropagationAPI = class PropagationAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){
        this.createBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createBaggage"];
        this.getBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$context$2d$helpers$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBaggage"];
        this.getActiveBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$context$2d$helpers$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getActiveBaggage"];
        this.setBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$context$2d$helpers$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setBaggage"];
        this.deleteBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$context$2d$helpers$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteBaggage"];
    }
    /** Get the singleton instance of the Propagator API */ static getInstance() {
        if (!this._instance) this._instance = new PropagationAPI();
        return this._instance;
    }
    /**
	* Set the current propagator.
	*
	* @returns true if the propagator was successfully registered, else false
	*/ setGlobalPropagator(propagator) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, propagator, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
	* Inject context into a carrier to be propagated inter-process
	*
	* @param context Context carrying tracing data to inject
	* @param carrier carrier to inject context into
	* @param setter Function used to set values on the carrier
	*/ inject(context, carrier, setter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$propagation$2f$TextMapPropagator$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["defaultTextMapSetter"]) {
        return this._getGlobalPropagator().inject(context, carrier, setter);
    }
    /**
	* Extract context from a carrier
	*
	* @param context Context which the newly created context will inherit from
	* @param carrier Carrier to extract context from
	* @param getter Function used to extract keys from a carrier
	*/ extract(context, carrier, getter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$propagation$2f$TextMapPropagator$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["defaultTextMapGetter"]) {
        return this._getGlobalPropagator().extract(context, carrier, getter);
    }
    /**
	* Return a list of all fields which may be used by the propagator.
	*/ fields() {
        return this._getGlobalPropagator().fields();
    }
    /** Remove the global propagator */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    _getGlobalPropagator() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/api/trace.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TraceAPI",
    ()=>TraceAPI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/context-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$spancontext$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/spancontext-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$ProxyTracerProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/ProxyTracerProvider.mjs [app-rsc] (ecmascript)");
;
;
;
;
;
//#region src/api/trace.ts
const API_NAME = "trace";
/**
* Singleton object which represents the entry point to the OpenTelemetry Tracing API
*
* @since 1.0.0
*/ var TraceAPI = class TraceAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){
        this._proxyTracerProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$ProxyTracerProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProxyTracerProvider"]();
        this.wrapSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$spancontext$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wrapSpanContext"];
        this.isSpanContextValid = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$spancontext$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isSpanContextValid"];
        this.deleteSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSpan"];
        this.getSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSpan"];
        this.getActiveSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getActiveSpan"];
        this.getSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSpanContext"];
        this.setSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSpan"];
        this.setSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSpanContext"];
    }
    /** Get the singleton instance of the Trace API */ static getInstance() {
        if (!this._instance) this._instance = new TraceAPI();
        return this._instance;
    }
    /**
	* Set the current global tracer.
	*
	* @returns true if the tracer provider was successfully registered, else false
	*/ setGlobalTracerProvider(provider) {
        const success = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, this._proxyTracerProvider, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
        if (success) this._proxyTracerProvider.setDelegate(provider);
        return success;
    }
    /**
	* Returns the global tracer provider.
	*/ getTracerProvider() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || this._proxyTracerProvider;
    }
    /**
	* Returns a tracer from the global tracer provider.
	*/ getTracer(name, version) {
        return this.getTracerProvider().getTracer(name, version);
    }
    /** Remove the global tracer provider */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
        this._proxyTracerProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$ProxyTracerProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProxyTracerProvider"]();
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/baggage/context-helpers.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteBaggage",
    ()=>deleteBaggage,
    "getActiveBaggage",
    ()=>getActiveBaggage,
    "getBaggage",
    ()=>getBaggage,
    "setBaggage",
    ()=>setBaggage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/context/context.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/context.mjs [app-rsc] (ecmascript)");
;
;
//#region src/baggage/context-helpers.ts
/**
* Baggage key
*/ const BAGGAGE_KEY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContextKey"])("OpenTelemetry Baggage Key");
/**
* Retrieve the current baggage from the given context
*
* @param {Context} Context that manage all context values
* @returns {Baggage} Extracted baggage from the context
*/ function getBaggage(context) {
    return context.getValue(BAGGAGE_KEY) || void 0;
}
/**
* Retrieve the current baggage from the active/current context
*
* @returns {Baggage} Extracted baggage from the context
*/ function getActiveBaggage() {
    return getBaggage(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance().active());
}
/**
* Store a baggage in the given context
*
* @param {Context} Context that manage all context values
* @param {Baggage} baggage that will be set in the actual context
*/ function setBaggage(context, baggage) {
    return context.setValue(BAGGAGE_KEY, baggage);
}
/**
* Delete the baggage stored in the given context
*
* @param {Context} Context that manage all context values
*/ function deleteBaggage(context) {
    return context.deleteValue(BAGGAGE_KEY);
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/baggage/internal/baggage-impl.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BaggageImpl",
    ()=>BaggageImpl
]);
//#region src/baggage/internal/baggage-impl.ts
var BaggageImpl = class BaggageImpl {
    constructor(entries){
        this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
    }
    getEntry(key) {
        const entry = this._entries.get(key);
        if (!entry) return;
        return Object.assign({}, entry);
    }
    getAllEntries() {
        return Array.from(this._entries.entries());
    }
    setEntry(key, entry) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
    }
    removeEntry(key) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
    }
    removeEntries(...keys) {
        const newBaggage = new BaggageImpl(this._entries);
        for (const key of keys)newBaggage._entries.delete(key);
        return newBaggage;
    }
    clear() {
        return new BaggageImpl();
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/baggage/internal/symbol.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "baggageEntryMetadataSymbol",
    ()=>baggageEntryMetadataSymbol
]);
//#region src/baggage/internal/symbol.ts
/**
* Symbol used to make BaggageEntryMetadata an opaque type
*/ const baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
;
}),
"[project]/node_modules/@opentelemetry/api/dist/baggage/utils.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "baggageEntryMetadataFromString",
    ()=>baggageEntryMetadataFromString,
    "createBaggage",
    ()=>createBaggage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/diag.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$internal$2f$baggage$2d$impl$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/baggage/internal/baggage-impl.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$internal$2f$symbol$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/baggage/internal/symbol.mjs [app-rsc] (ecmascript)");
;
;
;
//#region src/baggage/utils.ts
const diag = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$diag$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DiagAPI"].instance();
/**
* Create a new Baggage with optional entries
*
* @param entries An array of baggage entries the new baggage should contain
*/ function createBaggage(entries = {}) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$internal$2f$baggage$2d$impl$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["BaggageImpl"](new Map(Object.entries(entries)));
}
/**
* Create a serializable BaggageEntryMetadata object from a string.
*
* @param str string metadata. Format is currently not defined by the spec and has no special meaning.
*
* @since 1.0.0
*/ function baggageEntryMetadataFromString(str) {
    if (typeof str !== "string") {
        diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
        str = "";
    }
    return {
        __TYPE__: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$baggage$2f$internal$2f$symbol$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["baggageEntryMetadataSymbol"],
        toString () {
            return str;
        }
    };
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/context-api.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "context",
    ()=>context
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/context.mjs [app-rsc] (ecmascript)");
;
//#region src/context-api.ts
/**
* Entrypoint for context API
* @since 1.0.0
*/ const context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/context/NoopContextManager.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopContextManager",
    ()=>NoopContextManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/context/context.mjs [app-rsc] (ecmascript)");
;
//#region src/context/NoopContextManager.ts
var NoopContextManager = class {
    active() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ROOT_CONTEXT"];
    }
    with(_context, fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
    }
    bind(_context, target) {
        return target;
    }
    enable() {
        return this;
    }
    disable() {
        return this;
    }
    /** @experimental This API is experimental and may change in minor releases without prior notice. */ attach(_context) {
        return {
            dispose () {}
        };
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/context/context.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ROOT_CONTEXT",
    ()=>ROOT_CONTEXT,
    "createContextKey",
    ()=>createContextKey
]);
//#region src/context/context.ts
/**
* Get a key to uniquely identify a context value
*
* @since 1.0.0
*/ function createContextKey(description) {
    return Symbol.for(description);
}
/**
* The root context is used as the default parent context when there is no active context
*
* @since 1.0.0
*/ const ROOT_CONTEXT = new class BaseContext {
    /**
	* Construct a new context which inherits values from an optional parent context.
	*
	* @param parentContext a context from which to inherit values
	*/ constructor(parentContext){
        const self = this;
        self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
        self.getValue = (key)=>self._currentContext.get(key);
        self.setValue = (key, value)=>{
            const context = new BaseContext(self._currentContext);
            context._currentContext.set(key, value);
            return context;
        };
        self.deleteValue = (key)=>{
            const context = new BaseContext(self._currentContext);
            context._currentContext.delete(key);
            return context;
        };
    }
}();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/diag/ComponentLogger.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagComponentLogger",
    ()=>DiagComponentLogger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)");
;
//#region src/diag/ComponentLogger.ts
/**
* Component Logger which is meant to be used as part of any component which
* will add automatically additional namespace in front of the log message.
* It will then forward all message to global diag logger
* @example
* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
* cLogger.debug('test');
* // @opentelemetry/instrumentation-http test
*/ var DiagComponentLogger = class {
    constructor(props){
        this._namespace = props.namespace || "DiagComponentLogger";
    }
    debug(...args) {
        return logProxy("debug", this._namespace, args);
    }
    error(...args) {
        return logProxy("error", this._namespace, args);
    }
    info(...args) {
        return logProxy("info", this._namespace, args);
    }
    warn(...args) {
        return logProxy("warn", this._namespace, args);
    }
    verbose(...args) {
        return logProxy("verbose", this._namespace, args);
    }
};
function logProxy(funcName, namespace, args) {
    const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$global$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobal"])("diag");
    if (!logger) return;
    return logger[funcName](namespace, ...args);
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/diag/internal/logLevelLogger.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLogLevelDiagLogger",
    ()=>createLogLevelDiagLogger
]);
;
//#region src/diag/internal/logLevelLogger.ts
function createLogLevelDiagLogger(maxLevel, logger) {
    if (maxLevel < 0) maxLevel = 0;
    else if (maxLevel > 9999) maxLevel = 9999;
    logger = logger || {};
    function _filterFunc(funcName, theLevel) {
        const theFunc = logger[funcName];
        if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
        return function() {};
    }
    return {
        error: _filterFunc("error", 30),
        warn: _filterFunc("warn", 50),
        info: _filterFunc("info", 60),
        debug: _filterFunc("debug", 70),
        verbose: _filterFunc("verbose", 80)
    };
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/internal/global-utils.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGlobal",
    ()=>getGlobal,
    "registerGlobal",
    ()=>registerGlobal,
    "unregisterGlobal",
    ()=>unregisterGlobal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/version.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$semver$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/internal/semver.mjs [app-rsc] (ecmascript)");
;
;
//#region src/internal/global-utils.ts
const major = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"].split(".")[0];
const GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
const _global = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ("TURBOPACK compile-time truthy", 1) ? /*TURBOPACK member replacement*/ __turbopack_context__.g : "TURBOPACK unreachable";
function _makeGlobalApi() {
    return Object.defineProperty({}, "version", {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"],
        enumerable: true,
        writable: false,
        configurable: false
    });
}
function registerGlobal(type, instance, diag, allowOverride = false) {
    var _global$GLOBAL_OPENTE;
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_global$GLOBAL_OPENTE = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _global$GLOBAL_OPENTE !== void 0 ? _global$GLOBAL_OPENTE : _makeGlobalApi();
    if (!allowOverride && api[type]) {
        const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
        diag.error(err.stack || err.message);
        return false;
    }
    if (api.version !== "1.10.0") {
        const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"]}`);
        diag.error(err.stack || err.message);
        return false;
    }
    api[type] = instance;
    diag.debug(`@opentelemetry/api: Registered a global for ${type} v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"]}.`);
    return true;
}
let _compatibleGlobalApi;
function getGlobal(type) {
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
    if (api == null) return;
    if (api !== _compatibleGlobalApi) {
        if (!api.version || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$internal$2f$semver$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCompatible"])(api.version)) return;
        _compatibleGlobalApi = api;
    }
    return api[type];
}
function unregisterGlobal(type, diag) {
    diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"]}.`);
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
    if (api) delete api[type];
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/internal/semver.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_makeCompatibilityCheck",
    ()=>_makeCompatibilityCheck,
    "isCompatible",
    ()=>isCompatible
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/version.mjs [app-rsc] (ecmascript)");
;
//#region src/internal/semver.ts
const re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
/**
* Create a function to test an API version to see if it is compatible with the provided ownVersion.
*
* The returned function has the following semantics:
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param ownVersion version which should be checked against
*/ function _makeCompatibilityCheck(ownVersion) {
    const acceptedVersions = /* @__PURE__ */ new Set([
        ownVersion
    ]);
    const rejectedVersions = /* @__PURE__ */ new Set();
    const myVersionMatch = ownVersion.match(re);
    if (!myVersionMatch) return ()=>false;
    const ownVersionParsed = {
        major: +myVersionMatch[1],
        minor: +myVersionMatch[2],
        patch: +myVersionMatch[3],
        prerelease: myVersionMatch[4]
    };
    if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
        return globalVersion === ownVersion;
    };
    function _reject(v) {
        rejectedVersions.add(v);
        return false;
    }
    function _accept(v) {
        acceptedVersions.add(v);
        return true;
    }
    return function isCompatible(globalVersion) {
        if (acceptedVersions.has(globalVersion)) return true;
        if (rejectedVersions.has(globalVersion)) return false;
        const globalVersionMatch = globalVersion.match(re);
        if (!globalVersionMatch) return _reject(globalVersion);
        const globalVersionParsed = {
            major: +globalVersionMatch[1],
            minor: +globalVersionMatch[2],
            patch: +globalVersionMatch[3],
            prerelease: globalVersionMatch[4]
        };
        if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
        if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
        if (ownVersionParsed.major === 0) {
            if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
            return _reject(globalVersion);
        }
        if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
        return _reject(globalVersion);
    };
}
/**
* Test an API version to see if it is compatible with this API.
*
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param version version of the API requesting an instance of the global API
*/ const isCompatible = _makeCompatibilityCheck(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$version$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["VERSION"]);
;
}),
"[project]/node_modules/@opentelemetry/api/dist/metrics-api.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "metrics",
    ()=>metrics
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$metrics$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/metrics.mjs [app-rsc] (ecmascript)");
;
//#region src/metrics-api.ts
/**
* Entrypoint for metrics API
*
* @since 1.3.0
*/ const metrics = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$metrics$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["MetricsAPI"].getInstance();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/metrics/NoopMeter.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NOOP_COUNTER_METRIC",
    ()=>NOOP_COUNTER_METRIC,
    "NOOP_GAUGE_METRIC",
    ()=>NOOP_GAUGE_METRIC,
    "NOOP_HISTOGRAM_METRIC",
    ()=>NOOP_HISTOGRAM_METRIC,
    "NOOP_METER",
    ()=>NOOP_METER,
    "NOOP_OBSERVABLE_COUNTER_METRIC",
    ()=>NOOP_OBSERVABLE_COUNTER_METRIC,
    "NOOP_OBSERVABLE_GAUGE_METRIC",
    ()=>NOOP_OBSERVABLE_GAUGE_METRIC,
    "NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC",
    ()=>NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC,
    "NOOP_UP_DOWN_COUNTER_METRIC",
    ()=>NOOP_UP_DOWN_COUNTER_METRIC,
    "NoopCounterMetric",
    ()=>NoopCounterMetric,
    "NoopGaugeMetric",
    ()=>NoopGaugeMetric,
    "NoopHistogramMetric",
    ()=>NoopHistogramMetric,
    "NoopMeter",
    ()=>NoopMeter,
    "NoopMetric",
    ()=>NoopMetric,
    "NoopObservableCounterMetric",
    ()=>NoopObservableCounterMetric,
    "NoopObservableGaugeMetric",
    ()=>NoopObservableGaugeMetric,
    "NoopObservableMetric",
    ()=>NoopObservableMetric,
    "NoopObservableUpDownCounterMetric",
    ()=>NoopObservableUpDownCounterMetric,
    "NoopUpDownCounterMetric",
    ()=>NoopUpDownCounterMetric,
    "createNoopMeter",
    ()=>createNoopMeter
]);
//#region src/metrics/NoopMeter.ts
/**
* NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
* constant NoopMetrics for all of its methods.
*/ var NoopMeter = class {
    constructor(){}
    /**
	* @see {@link Meter.createGauge}
	*/ createGauge(_name, _options) {
        return NOOP_GAUGE_METRIC;
    }
    /**
	* @see {@link Meter.createHistogram}
	*/ createHistogram(_name, _options) {
        return NOOP_HISTOGRAM_METRIC;
    }
    /**
	* @see {@link Meter.createCounter}
	*/ createCounter(_name, _options) {
        return NOOP_COUNTER_METRIC;
    }
    /**
	* @see {@link Meter.createUpDownCounter}
	*/ createUpDownCounter(_name, _options) {
        return NOOP_UP_DOWN_COUNTER_METRIC;
    }
    /**
	* @see {@link Meter.createObservableGauge}
	*/ createObservableGauge(_name, _options) {
        return NOOP_OBSERVABLE_GAUGE_METRIC;
    }
    /**
	* @see {@link Meter.createObservableCounter}
	*/ createObservableCounter(_name, _options) {
        return NOOP_OBSERVABLE_COUNTER_METRIC;
    }
    /**
	* @see {@link Meter.createObservableUpDownCounter}
	*/ createObservableUpDownCounter(_name, _options) {
        return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
    }
    /**
	* @see {@link Meter.addBatchObservableCallback}
	*/ addBatchObservableCallback(_callback, _observables) {}
    /**
	* @see {@link Meter.removeBatchObservableCallback}
	*/ removeBatchObservableCallback(_callback) {}
};
var NoopMetric = class {
};
var NoopCounterMetric = class extends NoopMetric {
    add(_value, _attributes) {}
};
var NoopUpDownCounterMetric = class extends NoopMetric {
    add(_value, _attributes) {}
};
var NoopGaugeMetric = class extends NoopMetric {
    record(_value, _attributes) {}
};
var NoopHistogramMetric = class extends NoopMetric {
    record(_value, _attributes) {}
};
var NoopObservableMetric = class {
    addCallback(_callback) {}
    removeCallback(_callback) {}
};
var NoopObservableCounterMetric = class extends NoopObservableMetric {
};
var NoopObservableGaugeMetric = class extends NoopObservableMetric {
};
var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {
};
const NOOP_METER = new NoopMeter();
const NOOP_COUNTER_METRIC = new NoopCounterMetric();
const NOOP_GAUGE_METRIC = new NoopGaugeMetric();
const NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
const NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
const NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
const NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
const NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
/**
* Create a no-op Meter
*
* @since 1.3.0
*/ function createNoopMeter() {
    return NOOP_METER;
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/metrics/NoopMeterProvider.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NOOP_METER_PROVIDER",
    ()=>NOOP_METER_PROVIDER,
    "NoopMeterProvider",
    ()=>NoopMeterProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$metrics$2f$NoopMeter$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/metrics/NoopMeter.mjs [app-rsc] (ecmascript)");
;
//#region src/metrics/NoopMeterProvider.ts
/**
* An implementation of the {@link MeterProvider} which returns an impotent Meter
* for all calls to `getMeter`
*/ var NoopMeterProvider = class {
    getMeter(_name, _version, _options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$metrics$2f$NoopMeter$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NOOP_METER"];
    }
};
const NOOP_METER_PROVIDER = new NoopMeterProvider();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/propagation-api.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "propagation",
    ()=>propagation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$propagation$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/propagation.mjs [app-rsc] (ecmascript)");
;
//#region src/propagation-api.ts
/**
* Entrypoint for propagation API
*
* @since 1.0.0
*/ const propagation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$propagation$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PropagationAPI"].getInstance();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/propagation/NoopTextMapPropagator.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopTextMapPropagator",
    ()=>NoopTextMapPropagator
]);
//#region src/propagation/NoopTextMapPropagator.ts
/**
* No-op implementations of {@link TextMapPropagator}.
*/ var NoopTextMapPropagator = class {
    /** Noop inject function does nothing */ inject(_context, _carrier) {}
    /** Noop extract function does nothing and returns the input context */ extract(context, _carrier) {
        return context;
    }
    fields() {
        return [];
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/propagation/TextMapPropagator.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultTextMapGetter",
    ()=>defaultTextMapGetter,
    "defaultTextMapSetter",
    ()=>defaultTextMapSetter
]);
//#region src/propagation/TextMapPropagator.ts
/**
* @since 1.0.0
*/ const defaultTextMapGetter = {
    get (carrier, key) {
        if (carrier == null) return;
        return carrier[key];
    },
    keys (carrier) {
        if (carrier == null) return [];
        return Object.keys(carrier);
    }
};
/**
* @since 1.0.0
*/ const defaultTextMapSetter = {
    set (carrier, key, value) {
        if (carrier == null) return;
        carrier[key] = value;
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace-api.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "trace",
    ()=>trace
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$trace$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/trace.mjs [app-rsc] (ecmascript)");
;
//#region src/trace-api.ts
/**
* Entrypoint for trace API
*
* @since 1.0.0
*/ const trace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$trace$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TraceAPI"].getInstance();
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/NonRecordingSpan.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NonRecordingSpan",
    ()=>NonRecordingSpan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$invalid$2d$span$2d$constants$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/invalid-span-constants.mjs [app-rsc] (ecmascript)");
;
//#region src/trace/NonRecordingSpan.ts
/**
* The NonRecordingSpan is the default {@link Span} that is used when no Span
* implementation is available. All operations are no-op including context
* propagation.
*/ var NonRecordingSpan = class {
    constructor(spanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$invalid$2d$span$2d$constants$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["INVALID_SPAN_CONTEXT"]){
        this._spanContext = spanContext;
    }
    spanContext() {
        return this._spanContext;
    }
    setAttribute(_key, _value) {
        return this;
    }
    setAttributes(_attributes) {
        return this;
    }
    addEvent(_name, _attributes) {
        return this;
    }
    addLink(_link) {
        return this;
    }
    addLinks(_links) {
        return this;
    }
    setStatus(_status) {
        return this;
    }
    updateName(_name) {
        return this;
    }
    end(_endTime) {}
    isRecording() {
        return false;
    }
    recordException(_exception, _time) {}
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/NoopTracer.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopTracer",
    ()=>NoopTracer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/context.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NonRecordingSpan.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/context-utils.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$spancontext$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/spancontext-utils.mjs [app-rsc] (ecmascript)");
;
;
;
;
//#region src/trace/NoopTracer.ts
const contextApi = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance();
/**
* No-op implementations of {@link Tracer}.
*/ var NoopTracer = class {
    startSpan(name, options, context = contextApi.active()) {
        if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NonRecordingSpan"]();
        const parentFromContext = context && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSpanContext"])(context);
        if (isSpanContext(parentFromContext) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$spancontext$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isSpanContextValid"])(parentFromContext)) return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NonRecordingSpan"](parentFromContext);
        else return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NonRecordingSpan"]();
    }
    startActiveSpan(name, arg2, arg3, arg4) {
        var _ctx;
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) return;
        else if (arguments.length === 2) fn = arg2;
        else if (arguments.length === 3) {
            opts = arg2;
            fn = arg3;
        } else {
            opts = arg2;
            ctx = arg3;
            fn = arg4;
        }
        const parentContext = (_ctx = ctx) !== null && _ctx !== void 0 ? _ctx : contextApi.active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$context$2d$utils$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSpan"])(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, void 0, span);
    }
};
function isSpanContext(spanContext) {
    return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/NoopTracerProvider.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopTracerProvider",
    ()=>NoopTracerProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NoopTracer.mjs [app-rsc] (ecmascript)");
;
//#region src/trace/NoopTracerProvider.ts
/**
* An implementation of the {@link TracerProvider} which returns an impotent
* Tracer for all calls to `getTracer`.
*
* All operations are no-op.
*/ var NoopTracerProvider = class {
    getTracer(_name, _version, _options) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NoopTracer"]();
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/ProxyTracer.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProxyTracer",
    ()=>ProxyTracer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NoopTracer.mjs [app-rsc] (ecmascript)");
;
//#region src/trace/ProxyTracer.ts
const NOOP_TRACER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NoopTracer"]();
/**
* Proxy tracer provided by the proxy tracer provider
*
* @since 1.0.0
*/ var ProxyTracer = class {
    constructor(provider, name, version, options){
        this._provider = provider;
        this.name = name;
        this.version = version;
        this.options = options;
    }
    startSpan(name, options, context) {
        return this._getTracer().startSpan(name, options, context);
    }
    startActiveSpan(_name, _options, _context, _fn) {
        const tracer = this._getTracer();
        return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    }
    /**
	* Try to get a tracer from the proxy tracer provider.
	* If the proxy tracer provider has no delegate, return a noop tracer.
	*/ _getTracer() {
        if (this._delegate) return this._delegate;
        const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer) return NOOP_TRACER;
        this._delegate = tracer;
        return this._delegate;
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/ProxyTracerProvider.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProxyTracerProvider",
    ()=>ProxyTracerProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$ProxyTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/ProxyTracer.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracerProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NoopTracerProvider.mjs [app-rsc] (ecmascript)");
;
;
//#region src/trace/ProxyTracerProvider.ts
const NOOP_TRACER_PROVIDER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NoopTracerProvider$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NoopTracerProvider"]();
/**
* Tracer provider which provides {@link ProxyTracer}s.
*
* Before a delegate is set, tracers provided are NoOp.
*   When a delegate is set, traces are provided from the delegate.
*   When a delegate is set after tracers have already been provided,
*   all tracers already provided will use the provided delegate implementation.
*
* @deprecated This will be removed in the next major version.
* @since 1.0.0
*/ var ProxyTracerProvider = class {
    /**
	* Get a {@link ProxyTracer}
	*/ getTracer(name, version, options) {
        var _this$getDelegateTrac;
        return (_this$getDelegateTrac = this.getDelegateTracer(name, version, options)) !== null && _this$getDelegateTrac !== void 0 ? _this$getDelegateTrac : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$ProxyTracer$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProxyTracer"](this, name, version, options);
    }
    getDelegate() {
        var _this$_delegate;
        return (_this$_delegate = this._delegate) !== null && _this$_delegate !== void 0 ? _this$_delegate : NOOP_TRACER_PROVIDER;
    }
    /**
	* Set the delegate tracer provider
	*/ setDelegate(delegate) {
        this._delegate = delegate;
    }
    getDelegateTracer(name, version, options) {
        var _this$_delegate2;
        return (_this$_delegate2 = this._delegate) === null || _this$_delegate2 === void 0 ? void 0 : _this$_delegate2.getTracer(name, version, options);
    }
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/context-utils.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteSpan",
    ()=>deleteSpan,
    "getActiveSpan",
    ()=>getActiveSpan,
    "getSpan",
    ()=>getSpan,
    "getSpanContext",
    ()=>getSpanContext,
    "setSpan",
    ()=>setSpan,
    "setSpanContext",
    ()=>setSpanContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/context/context.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/api/context.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NonRecordingSpan.mjs [app-rsc] (ecmascript)");
;
;
;
//#region src/trace/context-utils.ts
/**
* span key
*/ const SPAN_KEY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$context$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContextKey"])("OpenTelemetry Context Key SPAN");
/**
* Return the span if one exists
*
* @param context context to get span from
*/ function getSpan(context) {
    return context.getValue(SPAN_KEY) || void 0;
}
/**
* Gets the span from the current context, if one exists.
*/ function getActiveSpan() {
    return getSpan(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$api$2f$context$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance().active());
}
/**
* Set the span on a context
*
* @param context context to use as parent
* @param span span to set active
*/ function setSpan(context, span) {
    return context.setValue(SPAN_KEY, span);
}
/**
* Remove current span stored in the context
*
* @param context context to delete span from
*/ function deleteSpan(context) {
    return context.deleteValue(SPAN_KEY);
}
/**
* Wrap span context in a NoopSpan and set as span in a new
* context
*
* @param context context to set active span on
* @param spanContext span context to be wrapped
*/ function setSpanContext(context, spanContext) {
    return setSpan(context, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NonRecordingSpan"](spanContext));
}
/**
* Get the span context of the span if it exists.
*
* @param context context to get values from
*/ function getSpanContext(context) {
    var _getSpan;
    return (_getSpan = getSpan(context)) === null || _getSpan === void 0 ? void 0 : _getSpan.spanContext();
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/invalid-span-constants.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INVALID_SPANID",
    ()=>INVALID_SPANID,
    "INVALID_SPAN_CONTEXT",
    ()=>INVALID_SPAN_CONTEXT,
    "INVALID_TRACEID",
    ()=>INVALID_TRACEID
]);
;
//#region src/trace/invalid-span-constants.ts
/**
* @since 1.0.0
*/ const INVALID_SPANID = "0000000000000000";
/**
* @since 1.0.0
*/ const INVALID_TRACEID = "00000000000000000000000000000000";
/**
* @since 1.0.0
*/ const INVALID_SPAN_CONTEXT = {
    traceId: INVALID_TRACEID,
    spanId: INVALID_SPANID,
    traceFlags: 0
};
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/span_kind.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpanKind",
    ()=>SpanKind
]);
//#region src/trace/span_kind.ts
/**
* @since 1.0.0
*/ let SpanKind = /* @__PURE__ */ function(SpanKind) {
    /** Default value. Indicates that the span is used internally. */ SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
    /**
	* Indicates that the span covers server-side handling of an RPC or other
	* remote request.
	*/ SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
    /**
	* Indicates that the span covers the client-side wrapper around an RPC or
	* other remote request.
	*/ SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
    /**
	* Indicates that the span describes producer sending a message to a
	* broker. Unlike client and server, there is no direct critical path latency
	* relationship between producer and consumer spans.
	*/ SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
    /**
	* Indicates that the span describes consumer receiving a message from a
	* broker. Unlike client and server, there is no direct critical path latency
	* relationship between producer and consumer spans.
	*/ SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
    return SpanKind;
}({});
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/spancontext-utils.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSpanContextValid",
    ()=>isSpanContextValid,
    "isValidSpanId",
    ()=>isValidSpanId,
    "isValidTraceId",
    ()=>isValidTraceId,
    "wrapSpanContext",
    ()=>wrapSpanContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/dist/trace/NonRecordingSpan.mjs [app-rsc] (ecmascript)");
;
;
//#region src/trace/spancontext-utils.ts
const isHex = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1
]);
function isValidHex(id, length) {
    if (typeof id !== "string" || id.length !== length) return false;
    let r = 0;
    for(let i = 0; i < id.length; i += 4)r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
    return r === length;
}
/**
* @since 1.0.0
*/ function isValidTraceId(traceId) {
    return isValidHex(traceId, 32) && traceId !== "00000000000000000000000000000000";
}
/**
* @since 1.0.0
*/ function isValidSpanId(spanId) {
    return isValidHex(spanId, 16) && spanId !== "0000000000000000";
}
/**
* Returns true if this {@link SpanContext} is valid.
* @return true if this {@link SpanContext} is valid.
*
* @since 1.0.0
*/ function isSpanContextValid(spanContext) {
    return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
/**
* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
*
* @param spanContext span context to be wrapped
* @returns a new non-recording {@link Span} with the provided context
*/ function wrapSpanContext(spanContext) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$dist$2f$trace$2f$NonRecordingSpan$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["NonRecordingSpan"](spanContext);
}
;
}),
"[project]/node_modules/@opentelemetry/api/dist/trace/status.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpanStatusCode",
    ()=>SpanStatusCode
]);
//#region src/trace/status.ts
/**
* An enumeration of status codes.
*
* @since 1.0.0
*/ let SpanStatusCode = /* @__PURE__ */ function(SpanStatusCode) {
    /**
	* The default status.
	*/ SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
    /**
	* The operation has been validated by an Application developer or
	* Operator to have completed successfully.
	*/ SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
    /**
	* The operation contains an error.
	*/ SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
    return SpanStatusCode;
}({});
;
}),
"[project]/node_modules/@opentelemetry/api/dist/version.mjs [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "VERSION",
    ()=>VERSION
]);
//#region src/version.ts
const VERSION = "1.10.0";
;
}),
"[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    trueFunc: function trueFunc() {
        return true;
    },
    falseFunc: function falseFunc() {
        return false;
    }
};
}),
"[project]/node_modules/cheerio-select/lib/esm/helpers.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDocumentRoot",
    ()=>getDocumentRoot,
    "groupSelectors",
    ()=>groupSelectors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio-select/lib/esm/positionals.js [app-rsc] (ecmascript)");
;
function getDocumentRoot(node) {
    while(node.parent)node = node.parent;
    return node;
}
function groupSelectors(selectors) {
    const filteredSelectors = [];
    const plainSelectors = [];
    for (const selector of selectors){
        if (selector.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isFilter"])) {
            filteredSelectors.push(selector);
        } else {
            plainSelectors.push(selector);
        }
    }
    return [
        plainSelectors,
        filteredSelectors
    ];
}
}),
"[project]/node_modules/cheerio-select/lib/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "filter",
    ()=>filter,
    "is",
    ()=>is,
    "select",
    ()=>select,
    "some",
    ()=>some
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio-select/lib/esm/helpers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio-select/lib/esm/positionals.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const UNIVERSAL_SELECTOR = {
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Universal,
    namespace: null
};
const SCOPE_PSEUDO = {
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo,
    name: "scope",
    data: null
};
function is(element, selector, options = {}) {
    return some([
        element
    ], selector, options);
}
function some(elements, selector, options = {}) {
    if (typeof selector === "function") return elements.some(selector);
    const [plain, filtered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["groupSelectors"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(selector));
    return plain.length > 0 && elements.some((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["_compileToken"])(plain, options)) || filtered.some((sel)=>filterBySelector(sel, elements, options).length > 0);
}
function filterByPosition(filter, elems, data, options) {
    const num = typeof data === "string" ? parseInt(data, 10) : NaN;
    switch(filter){
        case "first":
        case "lt":
            // Already done in `getLimit`
            return elems;
        case "last":
            return elems.length > 0 ? [
                elems[elems.length - 1]
            ] : elems;
        case "nth":
        case "eq":
            return isFinite(num) && Math.abs(num) < elems.length ? [
                num < 0 ? elems[elems.length + num] : elems[num]
            ] : [];
        case "gt":
            return isFinite(num) ? elems.slice(num + 1) : [];
        case "even":
            return elems.filter((_, i)=>i % 2 === 0);
        case "odd":
            return elems.filter((_, i)=>i % 2 === 1);
        case "not":
            {
                const filtered = new Set(filterParsed(data, elems, options));
                return elems.filter((e)=>!filtered.has(e));
            }
    }
}
function filter(selector, elements, options = {}) {
    return filterParsed((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(selector), elements, options);
}
/**
 * Filter a set of elements by a selector.
 *
 * Will return elements in the original order.
 *
 * @param selector Selector to filter by.
 * @param elements Elements to filter.
 * @param options Options for selector.
 */ function filterParsed(selector, elements, options) {
    if (elements.length === 0) return [];
    const [plainSelectors, filteredSelectors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["groupSelectors"])(selector);
    let found;
    if (plainSelectors.length) {
        const filtered = filterElements(elements, plainSelectors, options);
        // If there are no filters, just return
        if (filteredSelectors.length === 0) {
            return filtered;
        }
        // Otherwise, we have to do some filtering
        if (filtered.length) {
            found = new Set(filtered);
        }
    }
    for(let i = 0; i < filteredSelectors.length && (found === null || found === void 0 ? void 0 : found.size) !== elements.length; i++){
        const filteredSelector = filteredSelectors[i];
        const missing = found ? elements.filter((e)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.isTag(e) && !found.has(e)) : elements;
        if (missing.length === 0) break;
        const filtered = filterBySelector(filteredSelector, elements, options);
        if (filtered.length) {
            if (!found) {
                /*
                 * If we haven't found anything before the last selector,
                 * just return what we found now.
                 */ if (i === filteredSelectors.length - 1) {
                    return filtered;
                }
                found = new Set(filtered);
            } else {
                filtered.forEach((el)=>found.add(el));
            }
        }
    }
    return typeof found !== "undefined" ? found.size === elements.length ? elements : elements.filter((el)=>found.has(el)) : [];
}
function filterBySelector(selector, elements, options) {
    var _a;
    if (selector.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"])) {
        /*
         * Get root node, run selector with the scope
         * set to all of our nodes.
         */ const root = (_a = options.root) !== null && _a !== void 0 ? _a : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDocumentRoot"])(elements[0]);
        const opts = {
            ...options,
            context: elements,
            relativeSelector: false
        };
        selector.push(SCOPE_PSEUDO);
        return findFilterElements(root, selector, opts, true, elements.length);
    }
    // Performance optimization: If we don't have to traverse, just filter set.
    return findFilterElements(elements, selector, options, false, elements.length);
}
function select(selector, root, options = {}, limit = Infinity) {
    if (typeof selector === "function") {
        return find(root, selector);
    }
    const [plain, filtered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["groupSelectors"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(selector));
    const results = filtered.map((sel)=>findFilterElements(root, sel, options, true, limit));
    // Plain selectors can be queried in a single go
    if (plain.length) {
        results.push(findElements(root, plain, options, limit));
    }
    if (results.length === 0) {
        return [];
    }
    // If there was only a single selector, just return the result
    if (results.length === 1) {
        return results[0];
    }
    // Sort results, filtering for duplicates
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.uniqueSort(results.reduce((a, b)=>[
            ...a,
            ...b
        ]));
}
/**
 *
 * @param root Element(s) to search from.
 * @param selector Selector to look for.
 * @param options Options for querying.
 * @param queryForSelector Query multiple levels deep for the initial selector, even if it doesn't contain a traversal.
 */ function findFilterElements(root, selector, options, queryForSelector, totalLimit) {
    const filterIndex = selector.findIndex(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isFilter"]);
    const sub = selector.slice(0, filterIndex);
    const filter = selector[filterIndex];
    // If we are at the end of the selector, we can limit the number of elements to retrieve.
    const partLimit = selector.length - 1 === filterIndex ? totalLimit : Infinity;
    /*
     * Set the number of elements to retrieve.
     * Eg. for :first, we only have to get a single element.
     */ const limit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLimit"])(filter.name, filter.data, partLimit);
    if (limit === 0) return [];
    /*
     * Skip `findElements` call if our selector starts with a positional
     * pseudo.
     */ const elemsNoLimit = sub.length === 0 && !Array.isArray(root) ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.getChildren(root).filter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.isTag) : sub.length === 0 ? (Array.isArray(root) ? root : [
        root
    ]).filter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.isTag) : queryForSelector || sub.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"]) ? findElements(root, [
        sub
    ], options, limit) : filterElements(root, [
        sub
    ], options);
    const elems = elemsNoLimit.slice(0, limit);
    let result = filterByPosition(filter.name, elems, filter.data, options);
    if (result.length === 0 || selector.length === filterIndex + 1) {
        return result;
    }
    const remainingSelector = selector.slice(filterIndex + 1);
    const remainingHasTraversal = remainingSelector.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"]);
    if (remainingHasTraversal) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"])(remainingSelector[0])) {
            const { type } = remainingSelector[0];
            if (type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Sibling || type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Adjacent) {
                // If we have a sibling traversal, we need to also look at the siblings.
                result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareContext"])(result, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, true);
            }
            // Avoid a traversal-first selector error.
            remainingSelector.unshift(UNIVERSAL_SELECTOR);
        }
        options = {
            ...options,
            // Avoid absolutizing the selector
            relativeSelector: false,
            /*
             * Add a custom root func, to make sure traversals don't match elements
             * that aren't a part of the considered tree.
             */ rootFunc: (el)=>result.includes(el)
        };
    } else if (options.rootFunc && options.rootFunc !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["trueFunc"]) {
        options = {
            ...options,
            rootFunc: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["trueFunc"]
        };
    }
    /*
     * If we have another filter, recursively call `findFilterElements`,
     * with the `recursive` flag disabled. We only have to look for more
     * elements when we see a traversal.
     *
     * Otherwise,
     */ return remainingSelector.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$positionals$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isFilter"]) ? findFilterElements(result, remainingSelector, options, false, totalLimit) : remainingHasTraversal ? findElements(result, [
        remainingSelector
    ], options, totalLimit) : filterElements(result, [
        remainingSelector
    ], options);
}
function findElements(root, sel, options, limit) {
    const query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["_compileToken"])(sel, options, root);
    return find(root, query, limit);
}
function find(root, query, limit = Infinity) {
    const elems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["prepareContext"])(root, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, query.shouldTestNextSiblings);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.find((node)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.isTag(node) && query(node), elems, true, limit);
}
function filterElements(elements, sel, options) {
    const els = (Array.isArray(elements) ? elements : [
        elements
    ]).filter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__.isTag);
    if (els.length === 0) return els;
    const query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["_compileToken"])(sel, options);
    return query === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["trueFunc"] ? els : els.filter(query);
}
}),
"[project]/node_modules/cheerio-select/lib/esm/positionals.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "filterNames",
    ()=>filterNames,
    "getLimit",
    ()=>getLimit,
    "isFilter",
    ()=>isFilter
]);
const filterNames = new Set([
    "first",
    "last",
    "eq",
    "gt",
    "nth",
    "lt",
    "even",
    "odd"
]);
function isFilter(s) {
    if (s.type !== "pseudo") return false;
    if (filterNames.has(s.name)) return true;
    if (s.name === "not" && Array.isArray(s.data)) {
        // Only consider `:not` with embedded filters
        return s.data.some((s)=>s.some(isFilter));
    }
    return false;
}
function getLimit(filter, data, partLimit) {
    const num = data != null ? parseInt(data, 10) : NaN;
    switch(filter){
        case "first":
            return 1;
        case "nth":
        case "eq":
            return isFinite(num) ? num >= 0 ? num + 1 : Infinity : 0;
        case "lt":
            return isFinite(num) ? num >= 0 ? Math.min(num, partLimit) : Infinity : 0;
        case "gt":
            return isFinite(num) ? Infinity : 0;
        case "odd":
            return 2 * partLimit;
        case "even":
            return 2 * partLimit - 1;
        case "last":
        case "not":
            return Infinity;
    }
}
}),
"[project]/node_modules/cheerio/dist/esm/api/attributes.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addClass",
    ()=>addClass,
    "attr",
    ()=>attr,
    "data",
    ()=>data,
    "hasClass",
    ()=>hasClass,
    "prop",
    ()=>prop,
    "removeAttr",
    ()=>removeAttr,
    "removeClass",
    ()=>removeClass,
    "toggleClass",
    ()=>toggleClass,
    "val",
    ()=>val
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Root$3e$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Root>");
/**
 * Methods for getting and modifying attributes.
 *
 * @module cheerio/attributes
 */ var _a;
;
;
;
;
;
const hasOwn = // @ts-expect-error `hasOwn` is a standard object method
(_a = Object.hasOwn) !== null && _a !== void 0 ? _a : (object, prop)=>Object.prototype.hasOwnProperty.call(object, prop);
const rspace = /\s+/;
const dataAttrPrefix = 'data-';
// Attributes that are booleans
const rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;
// Matches strings that look like JSON objects or arrays
const rbrace = /^{[^]*}$|^\[[^]*]$/;
function getAttr(elem, name, xmlMode) {
    var _a;
    if (!elem || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) return undefined;
    (_a = elem.attribs) !== null && _a !== void 0 ? _a : elem.attribs = {};
    // Return the entire attribs object if no attribute specified
    if (!name) {
        return elem.attribs;
    }
    if (hasOwn(elem.attribs, name)) {
        // Get the (decoded) attribute
        return !xmlMode && rboolean.test(name) ? name : elem.attribs[name];
    }
    // Mimic the DOM and return text content as value for `option's`
    if (elem.name === 'option' && name === 'value') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["text"])(elem.children);
    }
    // Mimic DOM with default value for radios/checkboxes
    if (elem.name === 'input' && (elem.attribs['type'] === 'radio' || elem.attribs['type'] === 'checkbox') && name === 'value') {
        return 'on';
    }
    return undefined;
}
/**
 * Sets the value of an attribute. The attribute will be deleted if the value is
 * `null`.
 *
 * @private
 * @param el - The element to set the attribute on.
 * @param name - The attribute's name.
 * @param value - The attribute's value.
 */ function setAttr(el, name, value) {
    if (value === null) {
        removeAttribute(el, name);
    } else {
        el.attribs[name] = `${value}`;
    }
}
function attr(name, value) {
    // Set the value (with attr map support)
    if (typeof name === 'object' || value !== undefined) {
        if (typeof value === 'function') {
            if (typeof name !== 'string') {
                {
                    throw new Error('Bad combination of arguments.');
                }
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) setAttr(el, name, value.call(el, i, el.attribs[name]));
            });
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return;
            if (typeof name === 'object') {
                for (const objName of Object.keys(name)){
                    const objValue = name[objName];
                    setAttr(el, objName, objValue);
                }
            } else {
                setAttr(el, name, value);
            }
        });
    }
    return arguments.length > 1 ? this : getAttr(this[0], name, this.options.xmlMode);
}
/**
 * Gets a node's prop.
 *
 * @private
 * @category Attributes
 * @param el - Element to get the prop of.
 * @param name - Name of the prop.
 * @param xmlMode - Disable handling of special HTML attributes.
 * @returns The prop's value.
 */ function getProp(el, name, xmlMode) {
    return name in el ? el[name] : !xmlMode && rboolean.test(name) ? getAttr(el, name, false) !== undefined : getAttr(el, name, xmlMode);
}
/**
 * Sets the value of a prop.
 *
 * @private
 * @param el - The element to set the prop on.
 * @param name - The prop's name.
 * @param value - The prop's value.
 * @param xmlMode - Disable handling of special HTML attributes.
 */ function setProp(el, name, value, xmlMode) {
    if (name in el) {
        // @ts-expect-error Overriding value
        el[name] = value;
    } else {
        setAttr(el, name, !xmlMode && rboolean.test(name) ? value ? '' : null : `${value}`);
    }
}
function prop(name, value) {
    var _a;
    if (typeof name === 'string' && value === undefined) {
        const el = this[0];
        if (!el) return undefined;
        switch(name){
            case 'style':
                {
                    const property = this.css();
                    const keys = Object.keys(property);
                    for(let i = 0; i < keys.length; i++){
                        property[i] = keys[i];
                    }
                    property.length = keys.length;
                    return property;
                }
            case 'tagName':
            case 'nodeName':
                {
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return undefined;
                    return el.name.toUpperCase();
                }
            case 'href':
            case 'src':
                {
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return undefined;
                    const prop = (_a = el.attribs) === null || _a === void 0 ? void 0 : _a[name];
                    if (typeof URL !== 'undefined' && (name === 'href' && (el.tagName === 'a' || el.tagName === 'link') || name === 'src' && (el.tagName === 'img' || el.tagName === 'iframe' || el.tagName === 'audio' || el.tagName === 'video' || el.tagName === 'source')) && prop !== undefined && this.options.baseURI) {
                        return new URL(prop, this.options.baseURI).href;
                    }
                    return prop;
                }
            case 'innerText':
                {
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["innerText"])(el);
                }
            case 'textContent':
                {
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["textContent"])(el);
                }
            case 'outerHTML':
                {
                    if (el.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Root$3e$__["ElementType"].Root) return this.html();
                    return this.clone().wrap('<container />').parent().html();
                }
            case 'innerHTML':
                {
                    return this.html();
                }
            default:
                {
                    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return undefined;
                    return getProp(el, name, this.options.xmlMode);
                }
        }
    }
    if (typeof name === 'object' || value !== undefined) {
        if (typeof value === 'function') {
            if (typeof name === 'object') {
                throw new TypeError('Bad combination of arguments.');
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                    setProp(el, name, value.call(el, i, getProp(el, name, this.options.xmlMode)), this.options.xmlMode);
                }
            });
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return;
            if (typeof name === 'object') {
                for (const key of Object.keys(name)){
                    const val = name[key];
                    setProp(el, key, val, this.options.xmlMode);
                }
            } else {
                setProp(el, name, value, this.options.xmlMode);
            }
        });
    }
    return undefined;
}
/**
 * Sets the value of a data attribute.
 *
 * @private
 * @param elem - The element to set the data attribute on.
 * @param name - The data attribute's name.
 * @param value - The data attribute's value.
 */ function setData(elem, name, value) {
    var _a;
    (_a = elem.data) !== null && _a !== void 0 ? _a : elem.data = {};
    if (typeof name === 'object') Object.assign(elem.data, name);
    else if (typeof name === 'string' && value !== undefined) {
        elem.data[name] = value;
    }
}
/**
 * Read _all_ HTML5 `data-*` attributes from the equivalent HTML5 `data-*`
 * attribute, and cache the value in the node's internal data store.
 *
 * @private
 * @category Attributes
 * @param el - Element to get the data attribute of.
 * @returns A map with all of the data attributes.
 */ function readAllData(el) {
    for (const domName of Object.keys(el.attribs)){
        if (!domName.startsWith(dataAttrPrefix)) {
            continue;
        }
        const jsName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["camelCase"])(domName.slice(dataAttrPrefix.length));
        if (!hasOwn(el.data, jsName)) {
            el.data[jsName] = parseDataValue(el.attribs[domName]);
        }
    }
    return el.data;
}
/**
 * Read the specified attribute from the equivalent HTML5 `data-*` attribute,
 * and (if present) cache the value in the node's internal data store.
 *
 * @private
 * @category Attributes
 * @param el - Element to get the data attribute of.
 * @param name - Name of the data attribute.
 * @returns The data attribute's value.
 */ function readData(el, name) {
    const domName = dataAttrPrefix + (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cssCase"])(name);
    const data = el.data;
    if (hasOwn(data, name)) {
        return data[name];
    }
    if (hasOwn(el.attribs, domName)) {
        return data[name] = parseDataValue(el.attribs[domName]);
    }
    return undefined;
}
/**
 * Coerce string data-* attributes to their corresponding JavaScript primitives.
 *
 * @private
 * @category Attributes
 * @param value - The value to parse.
 * @returns The parsed value.
 */ function parseDataValue(value) {
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (value === String(num)) return num;
    if (rbrace.test(value)) {
        try {
            return JSON.parse(value);
        } catch  {
        /* Ignore */ }
    }
    return value;
}
function data(name, value) {
    var _a;
    const elem = this[0];
    if (!elem || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) return;
    const dataEl = elem;
    (_a = dataEl.data) !== null && _a !== void 0 ? _a : dataEl.data = {};
    // Return the entire data object if no data specified
    if (name == null) {
        return readAllData(dataEl);
    }
    // Set the value (with attr map support)
    if (typeof name === 'object' || value !== undefined) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                if (typeof name === 'object') setData(el, name);
                else setData(el, name, value);
            }
        });
        return this;
    }
    return readData(dataEl, name);
}
function val(value) {
    const querying = arguments.length === 0;
    const element = this[0];
    if (!element || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(element)) return querying ? undefined : this;
    switch(element.name){
        case 'textarea':
            {
                return this.text(value);
            }
        case 'select':
            {
                const option = this.find('option:selected');
                if (!querying) {
                    if (this.attr('multiple') == null && typeof value === 'object') {
                        return this;
                    }
                    this.find('option').removeAttr('selected');
                    const values = typeof value === 'object' ? value : [
                        value
                    ];
                    for (const val of values){
                        this.find(`option[value="${val}"]`).attr('selected', '');
                    }
                    return this;
                }
                return this.attr('multiple') ? option.toArray().map((el)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["text"])(el.children)) : option.attr('value');
            }
        case 'button':
        case 'input':
        case 'option':
            {
                return querying ? this.attr('value') : this.attr('value', value);
            }
    }
    return undefined;
}
/**
 * Remove an attribute.
 *
 * @private
 * @param elem - Node to remove attribute from.
 * @param name - Name of the attribute to remove.
 */ function removeAttribute(elem, name) {
    if (!elem.attribs || !hasOwn(elem.attribs, name)) return;
    delete elem.attribs[name];
}
/**
 * Splits a space-separated list of names to individual names.
 *
 * @category Attributes
 * @param names - Names to split.
 * @returns - Split names.
 */ function splitNames(names) {
    return names ? names.trim().split(rspace) : [];
}
function removeAttr(name) {
    const attrNames = splitNames(name);
    for (const attrName of attrNames){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (elem)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) removeAttribute(elem, attrName);
        });
    }
    return this;
}
function hasClass(className) {
    return this.toArray().some((elem)=>{
        const clazz = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.attribs['class'];
        let idx = -1;
        if (clazz && className.length > 0) {
            while((idx = clazz.indexOf(className, idx + 1)) > -1){
                const end = idx + className.length;
                if ((idx === 0 || rspace.test(clazz[idx - 1])) && (end === clazz.length || rspace.test(clazz[end]))) {
                    return true;
                }
            }
        }
        return false;
    });
}
function addClass(value) {
    // Support functions
    if (typeof value === 'function') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                const className = el.attribs['class'] || '';
                addClass.call([
                    el
                ], value.call(el, i, className));
            }
        });
    }
    // Return if no value or not a string or function
    if (!value || typeof value !== 'string') return this;
    const classNames = value.split(rspace);
    const numElements = this.length;
    for(let i = 0; i < numElements; i++){
        const el = this[i];
        // If selected element isn't a tag, move on
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) continue;
        // If we don't already have classes — always set xmlMode to false here, as it doesn't matter for classes
        const className = getAttr(el, 'class', false);
        if (className) {
            let setClass = ` ${className} `;
            // Check if class already exists
            for (const cn of classNames){
                const appendClass = `${cn} `;
                if (!setClass.includes(` ${appendClass}`)) setClass += appendClass;
            }
            setAttr(el, 'class', setClass.trim());
        } else {
            setAttr(el, 'class', classNames.join(' ').trim());
        }
    }
    return this;
}
function removeClass(name) {
    // Handle if value is a function
    if (typeof name === 'function') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                removeClass.call([
                    el
                ], name.call(el, i, el.attribs['class'] || ''));
            }
        });
    }
    const classes = splitNames(name);
    const numClasses = classes.length;
    const removeAll = arguments.length === 0;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return;
        if (removeAll) {
            // Short circuit the remove all case as this is the nice one
            el.attribs['class'] = '';
        } else {
            const elClasses = splitNames(el.attribs['class']);
            let changed = false;
            for(let j = 0; j < numClasses; j++){
                const index = elClasses.indexOf(classes[j]);
                if (index !== -1) {
                    elClasses.splice(index, 1);
                    changed = true;
                    /*
                     * We have to do another pass to ensure that there are not duplicate
                     * classes listed
                     */ j--;
                }
            }
            if (changed) {
                el.attribs['class'] = elClasses.join(' ');
            }
        }
    });
}
function toggleClass(value, stateVal) {
    // Support functions
    if (typeof value === 'function') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                toggleClass.call([
                    el
                ], value.call(el, i, el.attribs['class'] || '', stateVal), stateVal);
            }
        });
    }
    // Return if no value or not a string or function
    if (!value || typeof value !== 'string') return this;
    const classNames = value.split(rspace);
    const numClasses = classNames.length;
    const state = typeof stateVal === 'boolean' ? stateVal ? 1 : -1 : 0;
    const numElements = this.length;
    for(let i = 0; i < numElements; i++){
        const el = this[i];
        // If selected element isn't a tag, move on
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) continue;
        const elementClasses = splitNames(el.attribs['class']);
        // Check if class already exists
        for(let j = 0; j < numClasses; j++){
            // Check if the class name is currently defined
            const index = elementClasses.indexOf(classNames[j]);
            // Add if stateValue === true or we are toggling and there is no value
            if (state >= 0 && index === -1) {
                elementClasses.push(classNames[j]);
            } else if (state <= 0 && index !== -1) {
                // Otherwise remove but only if the item exists
                elementClasses.splice(index, 1);
            }
        }
        el.attribs['class'] = elementClasses.join(' ');
    }
    return this;
}
}),
"[project]/node_modules/cheerio/dist/esm/api/css.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "css",
    ()=>css
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
;
function css(prop, val) {
    if (prop != null && val != null || typeof prop === 'object' && !Array.isArray(prop)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) {
                // `prop` can't be an array here anymore.
                setCss(el, prop, val, i);
            }
        });
    }
    if (this.length === 0) {
        return undefined;
    }
    return getCss(this[0], prop);
}
/**
 * Set styles of all elements.
 *
 * @private
 * @param el - Element to set style of.
 * @param prop - Name of property.
 * @param value - Value to set property to.
 * @param idx - Optional index within the selection.
 */ function setCss(el, prop, value, idx) {
    if (typeof prop === 'string') {
        const styles = getCss(el);
        const val = typeof value === 'function' ? value.call(el, idx, styles[prop]) : value;
        if (val === '') {
            delete styles[prop];
        } else if (val != null) {
            styles[prop] = val;
        }
        el.attribs['style'] = stringify(styles);
    } else if (typeof prop === 'object') {
        const keys = Object.keys(prop);
        for(let i = 0; i < keys.length; i++){
            const k = keys[i];
            setCss(el, k, prop[k], i);
        }
    }
}
function getCss(el, prop) {
    if (!el || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el)) return;
    const styles = parse(el.attribs['style']);
    if (typeof prop === 'string') {
        return styles[prop];
    }
    if (Array.isArray(prop)) {
        const newStyles = {};
        for (const item of prop){
            if (styles[item] != null) {
                newStyles[item] = styles[item];
            }
        }
        return newStyles;
    }
    return styles;
}
/**
 * Stringify `obj` to styles.
 *
 * @private
 * @category CSS
 * @param obj - Object to stringify.
 * @returns The serialized styles.
 */ function stringify(obj) {
    return Object.keys(obj).reduce((str, prop)=>`${str}${str ? ' ' : ''}${prop}: ${obj[prop]};`, '');
}
/**
 * Parse `styles`.
 *
 * @private
 * @category CSS
 * @param styles - Styles to be parsed.
 * @returns The parsed styles.
 */ function parse(styles) {
    styles = (styles || '').trim();
    if (!styles) return {};
    const obj = {};
    let key;
    for (const str of styles.split(';')){
        const n = str.indexOf(':');
        // If there is no :, or if it is the first/last character, add to the previous item's value
        if (n < 1 || n === str.length - 1) {
            const trimmed = str.trimEnd();
            if (trimmed.length > 0 && key !== undefined) {
                obj[key] += `;${trimmed}`;
            }
        } else {
            key = str.slice(0, n).trim();
            obj[key] = str.slice(n + 1).trim();
        }
    }
    return obj;
}
}),
"[project]/node_modules/cheerio/dist/esm/api/extract.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extract",
    ()=>extract
]);
function getExtractDescr(descr) {
    var _a;
    if (typeof descr === 'string') {
        return {
            selector: descr,
            value: 'textContent'
        };
    }
    return {
        selector: descr.selector,
        value: (_a = descr.value) !== null && _a !== void 0 ? _a : 'textContent'
    };
}
function extract(map) {
    const ret = {};
    for(const key in map){
        const descr = map[key];
        const isArray = Array.isArray(descr);
        const { selector, value } = getExtractDescr(isArray ? descr[0] : descr);
        const fn = typeof value === 'function' ? value : typeof value === 'string' ? (el)=>this._make(el).prop(value) : (el)=>this._make(el).extract(value);
        if (isArray) {
            ret[key] = this._findBySelector(selector, Number.POSITIVE_INFINITY).map((_, el)=>fn(el, key, ret)).get();
        } else {
            const $ = this._findBySelector(selector, 1);
            ret[key] = $.length > 0 ? fn($[0], key, ret) : undefined;
        }
    }
    return ret;
}
}),
"[project]/node_modules/cheerio/dist/esm/api/forms.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "serialize",
    ()=>serialize,
    "serializeArray",
    ()=>serializeArray
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
/*
 * https://github.com/jquery/jquery/blob/2.1.3/src/manipulation/var/rcheckableType.js
 * https://github.com/jquery/jquery/blob/2.1.3/src/serialize.js
 */ const submittableSelector = 'input,select,textarea,keygen';
const r20 = /%20/g;
const rCRLF = /\r?\n/g;
function serialize() {
    // Convert form elements into name/value objects
    const arr = this.serializeArray();
    // Serialize each element into a key/value string
    const retArr = arr.map((data)=>`${encodeURIComponent(data.name)}=${encodeURIComponent(data.value)}`);
    // Return the resulting serialization
    return retArr.join('&').replace(r20, '+');
}
function serializeArray() {
    // Resolve all form elements from either forms or collections of form elements
    return this.map((_, elem)=>{
        const $elem = this._make(elem);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.name === 'form') {
            return $elem.find(submittableSelector).toArray();
        }
        return $elem.filter(submittableSelector).toArray();
    }).filter(// Verify elements have a name (`attr.name`) and are not disabled (`:enabled`)
    '[name!=""]:enabled' + // And cannot be clicked (`[type=submit]`) or are used in `x-www-form-urlencoded` (`[type=file]`)
    ':not(:submit, :button, :image, :reset, :file)' + // And are either checked/don't have a checkable state
    ':matches([checked], :not(:checkbox, :radio))').map((_, elem)=>{
        var _a;
        const $elem = this._make(elem);
        const name = $elem.attr('name'); // We have filtered for elements with a name before.
        // If there is no value set (e.g. `undefined`, `null`), then default value to empty
        const value = (_a = $elem.val()) !== null && _a !== void 0 ? _a : '';
        // If we have an array of values (e.g. `<select multiple>`), return an array of key/value pairs
        if (Array.isArray(value)) {
            return value.map((val)=>/*
             * We trim replace any line endings (e.g. `\r` or `\r\n` with `\r\n`) to guarantee consistency across platforms
             * These can occur inside of `<textarea>'s`
             */ ({
                    name,
                    value: val.replace(rCRLF, '\r\n')
                }));
        }
        // Otherwise (e.g. `<input type="text">`, return only one key/value pair
        return {
            name,
            value: value.replace(rCRLF, '\r\n')
        };
    }).toArray();
}
}),
"[project]/node_modules/cheerio/dist/esm/api/manipulation.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_makeDomArray",
    ()=>_makeDomArray,
    "after",
    ()=>after,
    "append",
    ()=>append,
    "appendTo",
    ()=>appendTo,
    "before",
    ()=>before,
    "clone",
    ()=>clone,
    "empty",
    ()=>empty,
    "html",
    ()=>html,
    "insertAfter",
    ()=>insertAfter,
    "insertBefore",
    ()=>insertBefore,
    "prepend",
    ()=>prepend,
    "prependTo",
    ()=>prependTo,
    "remove",
    ()=>remove,
    "replaceWith",
    ()=>replaceWith,
    "text",
    ()=>text,
    "toString",
    ()=>toString,
    "unwrap",
    ()=>unwrap,
    "wrap",
    ()=>wrap,
    "wrapAll",
    ()=>wrapAll,
    "wrapInner",
    ()=>wrapInner
]);
/**
 * Methods for modifying the DOM structure.
 *
 * @module cheerio/manipulation
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/manipulation.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Tag$3e$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Tag>");
;
;
;
;
;
;
function _makeDomArray(elem, clone) {
    if (elem == null) {
        return [];
    }
    if (typeof elem === 'string') {
        return this._parse(elem, this.options, false, null).children.slice(0);
    }
    if ('length' in elem) {
        if (elem.length === 1) {
            return this._makeDomArray(elem[0], clone);
        }
        const result = [];
        for(let i = 0; i < elem.length; i++){
            const el = elem[i];
            if (typeof el === 'object') {
                if (el == null) {
                    continue;
                }
                if (!('length' in el)) {
                    result.push(clone ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cloneNode"])(el, true) : el);
                    continue;
                }
            }
            result.push(...this._makeDomArray(el, clone));
        }
        return result;
    }
    return [
        clone ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cloneNode"])(elem, true) : elem
    ];
}
function _insert(concatenator) {
    return function(...elems) {
        const lastIdx = this.length - 1;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return;
            const domSrc = typeof elems[0] === 'function' ? elems[0].call(el, i, this._render(el.children)) : elems;
            const dom = this._makeDomArray(domSrc, i < lastIdx);
            concatenator(dom, el.children, el);
        });
    };
}
/**
 * Modify an array in-place, removing some number of elements and adding new
 * elements directly following them.
 *
 * @private
 * @category Manipulation
 * @param array - Target array to splice.
 * @param spliceIdx - Index at which to begin changing the array.
 * @param spliceCount - Number of elements to remove from the array.
 * @param newElems - Elements to insert into the array.
 * @param parent - The parent of the node.
 * @returns The spliced array.
 */ function uniqueSplice(array, spliceIdx, spliceCount, newElems, parent) {
    var _a, _b;
    const spliceArgs = [
        spliceIdx,
        spliceCount,
        ...newElems
    ];
    const prev = spliceIdx === 0 ? null : array[spliceIdx - 1];
    const next = spliceIdx + spliceCount >= array.length ? null : array[spliceIdx + spliceCount];
    /*
     * Before splicing in new elements, ensure they do not already appear in the
     * current array.
     */ for(let idx = 0; idx < newElems.length; ++idx){
        const node = newElems[idx];
        const oldParent = node.parent;
        if (oldParent) {
            const oldSiblings = oldParent.children;
            const prevIdx = oldSiblings.indexOf(node);
            if (prevIdx !== -1) {
                oldParent.children.splice(prevIdx, 1);
                if (parent === oldParent && spliceIdx > prevIdx) {
                    spliceArgs[0]--;
                }
            }
        }
        node.parent = parent;
        if (node.prev) {
            node.prev.next = (_a = node.next) !== null && _a !== void 0 ? _a : null;
        }
        if (node.next) {
            node.next.prev = (_b = node.prev) !== null && _b !== void 0 ? _b : null;
        }
        node.prev = idx === 0 ? prev : newElems[idx - 1];
        node.next = idx === newElems.length - 1 ? next : newElems[idx + 1];
    }
    if (prev) {
        prev.next = newElems[0];
    }
    if (next) {
        next.prev = newElems[newElems.length - 1];
    }
    return array.splice(...spliceArgs);
}
function appendTo(target) {
    const appendTarget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(target) ? target : this._make(target);
    appendTarget.append(this);
    return this;
}
function prependTo(target) {
    const prependTarget = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(target) ? target : this._make(target);
    prependTarget.prepend(this);
    return this;
}
const append = _insert((dom, children, parent)=>{
    uniqueSplice(children, children.length, 0, dom, parent);
});
const prepend = _insert((dom, children, parent)=>{
    uniqueSplice(children, 0, 0, dom, parent);
});
function _wrap(insert) {
    return function(wrapper) {
        const lastIdx = this.length - 1;
        const lastParent = this.parents().last();
        for(let i = 0; i < this.length; i++){
            const el = this[i];
            const wrap = typeof wrapper === 'function' ? wrapper.call(el, i, el) : typeof wrapper === 'string' && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHtml"])(wrapper) ? lastParent.find(wrapper).clone() : wrapper;
            const [wrapperDom] = this._makeDomArray(wrap, i < lastIdx);
            if (!wrapperDom || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(wrapperDom)) continue;
            let elInsertLocation = wrapperDom;
            /*
             * Find the deepest child. Only consider the first tag child of each node
             * (ignore text); stop if no children are found.
             */ let j = 0;
            while(j < elInsertLocation.children.length){
                const child = elInsertLocation.children[j];
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(child)) {
                    elInsertLocation = child;
                    j = 0;
                } else {
                    j++;
                }
            }
            insert(el, elInsertLocation, [
                wrapperDom
            ]);
        }
        return this;
    };
}
const wrap = _wrap((el, elInsertLocation, wrapperDom)=>{
    const { parent } = el;
    if (!parent) return;
    const siblings = parent.children;
    const index = siblings.indexOf(el);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])([
        el
    ], elInsertLocation);
    /*
     * The previous operation removed the current element from the `siblings`
     * array, so the `dom` array can be inserted without removing any
     * additional elements.
     */ uniqueSplice(siblings, index, 0, wrapperDom, parent);
});
const wrapInner = _wrap((el, elInsertLocation, wrapperDom)=>{
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])(el.children, elInsertLocation);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])(wrapperDom, el);
});
function unwrap(selector) {
    this.parent(selector).not('body').each((_, el)=>{
        this._make(el).replaceWith(el.children);
    });
    return this;
}
function wrapAll(wrapper) {
    const el = this[0];
    if (el) {
        const wrap = this._make(typeof wrapper === 'function' ? wrapper.call(el, 0, el) : wrapper).insertBefore(el);
        // If html is given as wrapper, wrap may contain text elements
        let elInsertLocation;
        for(let i = 0; i < wrap.length; i++){
            if (wrap[i].type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Tag$3e$__["ElementType"].Tag) {
                elInsertLocation = wrap[i];
            }
        }
        let j = 0;
        /*
         * Find the deepest child. Only consider the first tag child of each node
         * (ignore text); stop if no children are found.
         */ while(elInsertLocation && j < elInsertLocation.children.length){
            const child = elInsertLocation.children[j];
            if (child.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Tag$3e$__["ElementType"].Tag) {
                elInsertLocation = child;
                j = 0;
            } else {
                j++;
            }
        }
        if (elInsertLocation) this._make(elInsertLocation).append(this);
    }
    return this;
}
function after(...elems) {
    const lastIdx = this.length - 1;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el) || !el.parent) {
            return;
        }
        const siblings = el.parent.children;
        const index = siblings.indexOf(el);
        // If not found, move on
        /* istanbul ignore next */ if (index === -1) return;
        const domSrc = typeof elems[0] === 'function' ? elems[0].call(el, i, this._render(el.children)) : elems;
        const dom = this._makeDomArray(domSrc, i < lastIdx);
        // Add element after `this` element
        uniqueSplice(siblings, index + 1, 0, dom, el.parent);
    });
}
function insertAfter(target) {
    if (typeof target === 'string') {
        target = this._make(target);
    }
    this.remove();
    const clones = [];
    for (const el of this._makeDomArray(target)){
        const clonedSelf = this.clone().toArray();
        const { parent } = el;
        if (!parent) {
            continue;
        }
        const siblings = parent.children;
        const index = siblings.indexOf(el);
        // If not found, move on
        /* istanbul ignore next */ if (index === -1) continue;
        // Add cloned `this` element(s) after target element
        uniqueSplice(siblings, index + 1, 0, clonedSelf, parent);
        clones.push(...clonedSelf);
    }
    return this._make(clones);
}
function before(...elems) {
    const lastIdx = this.length - 1;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el) || !el.parent) {
            return;
        }
        const siblings = el.parent.children;
        const index = siblings.indexOf(el);
        // If not found, move on
        /* istanbul ignore next */ if (index === -1) return;
        const domSrc = typeof elems[0] === 'function' ? elems[0].call(el, i, this._render(el.children)) : elems;
        const dom = this._makeDomArray(domSrc, i < lastIdx);
        // Add element before `el` element
        uniqueSplice(siblings, index, 0, dom, el.parent);
    });
}
function insertBefore(target) {
    const targetArr = this._make(target);
    this.remove();
    const clones = [];
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(targetArr, (el)=>{
        const clonedSelf = this.clone().toArray();
        const { parent } = el;
        if (!parent) {
            return;
        }
        const siblings = parent.children;
        const index = siblings.indexOf(el);
        // If not found, move on
        /* istanbul ignore next */ if (index === -1) return;
        // Add cloned `this` element(s) after target element
        uniqueSplice(siblings, index, 0, clonedSelf, parent);
        clones.push(...clonedSelf);
    });
    return this._make(clones);
}
function remove(selector) {
    // Filter if we have selector
    const elems = selector ? this.filter(selector) : this;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(elems, (el)=>{
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeElement"])(el);
        el.prev = el.next = el.parent = null;
    });
    return this;
}
function replaceWith(content) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>{
        const { parent } = el;
        if (!parent) {
            return;
        }
        const siblings = parent.children;
        const cont = typeof content === 'function' ? content.call(el, i, el) : content;
        const dom = this._makeDomArray(cont);
        /*
         * In the case that `dom` contains nodes that already exist in other
         * structures, ensure those nodes are properly removed.
         */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])(dom, null);
        const index = siblings.indexOf(el);
        // Completely remove old element
        uniqueSplice(siblings, index, 1, dom, parent);
        if (!dom.includes(el)) {
            el.parent = el.prev = el.next = null;
        }
    });
}
function empty() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return;
        for (const child of el.children){
            child.next = child.prev = child.parent = null;
        }
        el.children.length = 0;
    });
}
function html(str) {
    if (str === undefined) {
        const el = this[0];
        if (!el || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return null;
        return this._render(el.children);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return;
        for (const child of el.children){
            child.next = child.prev = child.parent = null;
        }
        const content = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(str) ? str.toArray() : this._parse(`${str}`, this.options, false, el).children;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])(content, el);
    });
}
function toString() {
    return this._render(this);
}
function text(str) {
    // If `str` is undefined, act as a "getter"
    if (str === undefined) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["text"])(this);
    }
    if (typeof str === 'function') {
        // Function support
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el, i)=>this._make(el).text(str.call(el, i, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["text"])([
                el
            ]))));
    }
    // Append text node to each selected elements
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (el)=>{
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(el)) return;
        for (const child of el.children){
            child.next = child.prev = child.parent = null;
        }
        const textNode = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Text"](`${str}`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["update"])(textNode, el);
    });
}
function clone() {
    const clone = Array.prototype.map.call(this.get(), (el)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cloneNode"])(el, true));
    // Add a root node around the cloned nodes
    const root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"](clone);
    for (const node of clone){
        node.parent = root;
    }
    return this._make(clone);
}
}),
"[project]/node_modules/cheerio/dist/esm/api/traversing.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_findBySelector",
    ()=>_findBySelector,
    "add",
    ()=>add,
    "addBack",
    ()=>addBack,
    "children",
    ()=>children,
    "closest",
    ()=>closest,
    "contents",
    ()=>contents,
    "each",
    ()=>each,
    "end",
    ()=>end,
    "eq",
    ()=>eq,
    "filter",
    ()=>filter,
    "filterArray",
    ()=>filterArray,
    "find",
    ()=>find,
    "first",
    ()=>first,
    "get",
    ()=>get,
    "has",
    ()=>has,
    "index",
    ()=>index,
    "is",
    ()=>is,
    "last",
    ()=>last,
    "map",
    ()=>map,
    "next",
    ()=>next,
    "nextAll",
    ()=>nextAll,
    "nextUntil",
    ()=>nextUntil,
    "not",
    ()=>not,
    "parent",
    ()=>parent,
    "parents",
    ()=>parents,
    "parentsUntil",
    ()=>parentsUntil,
    "prev",
    ()=>prev,
    "prevAll",
    ()=>prevAll,
    "prevUntil",
    ()=>prevUntil,
    "siblings",
    ()=>siblings,
    "slice",
    ()=>slice,
    "toArray",
    ()=>toArray
]);
/**
 * Methods for traversing the DOM structure.
 *
 * @module cheerio/traversing
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/cheerio-select/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/traversal.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/helpers.js [app-rsc] (ecmascript)");
;
;
;
;
;
const reContextSelector = /^\s*(?:[+~]|:scope\b)/;
function find(selectorOrHaystack) {
    if (!selectorOrHaystack) {
        return this._make([]);
    }
    if (typeof selectorOrHaystack !== 'string') {
        const haystack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(selectorOrHaystack) ? selectorOrHaystack.toArray() : [
            selectorOrHaystack
        ];
        const context = this.toArray();
        return this._make(haystack.filter((elem)=>context.some((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["contains"])(node, elem))));
    }
    return this._findBySelector(selectorOrHaystack, Number.POSITIVE_INFINITY);
}
function _findBySelector(selector, limit) {
    var _a;
    const context = this.toArray();
    const elems = reContextSelector.test(selector) ? context : this.children().toArray();
    const options = {
        context,
        root: (_a = this._root) === null || _a === void 0 ? void 0 : _a[0],
        // Pass options that are recognized by `cheerio-select`
        xmlMode: this.options.xmlMode,
        lowerCaseTags: this.options.lowerCaseTags,
        lowerCaseAttributeNames: this.options.lowerCaseAttributeNames,
        pseudos: this.options.pseudos,
        quirksMode: this.options.quirksMode
    };
    return this._make(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["select"](selector, elems, options, limit));
}
/**
 * Creates a matcher, using a particular mapping function. Matchers provide a
 * function that finds elements using a generating function, supporting
 * filtering.
 *
 * @private
 * @param matchMap - Mapping function.
 * @returns - Function for wrapping generating functions.
 */ function _getMatcher(matchMap) {
    return function(fn, ...postFns) {
        return function(selector) {
            var _a;
            let matched = matchMap(fn, this);
            if (selector) {
                matched = filterArray(matched, selector, this.options.xmlMode, (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]);
            }
            return this._make(// Post processing is only necessary if there is more than one element.
            this.length > 1 && matched.length > 1 ? postFns.reduce((elems, fn)=>fn(elems), matched) : matched);
        };
    };
}
/** Matcher that adds multiple elements for each entry in the input. */ const _matcher = _getMatcher((fn, elems)=>{
    let ret = [];
    for(let i = 0; i < elems.length; i++){
        const value = fn(elems[i]);
        if (value.length > 0) ret = ret.concat(value);
    }
    return ret;
});
/** Matcher that adds at most one element for each entry in the input. */ const _singleMatcher = _getMatcher((fn, elems)=>{
    const ret = [];
    for(let i = 0; i < elems.length; i++){
        const value = fn(elems[i]);
        if (value !== null) {
            ret.push(value);
        }
    }
    return ret;
});
/**
 * Matcher that supports traversing until a condition is met.
 *
 * @param nextElem - Function that returns the next element.
 * @param postFns - Post processing functions.
 * @returns A function usable for `*Until` methods.
 */ function _matchUntil(nextElem, ...postFns) {
    // We use a variable here that is used from within the matcher.
    let matches = null;
    const innerMatcher = _getMatcher((nextElem, elems)=>{
        const matched = [];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(elems, (elem)=>{
            for(let next; next = nextElem(elem); elem = next){
                // FIXME: `matched` might contain duplicates here and the index is too large.
                if (matches === null || matches === void 0 ? void 0 : matches(next, matched.length)) break;
                matched.push(next);
            }
        });
        return matched;
    })(nextElem, ...postFns);
    return function(selector, filterSelector) {
        // Override `matches` variable with the new target.
        matches = typeof selector === 'string' ? (elem)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["is"](elem, selector, this.options) : selector ? getFilterFn(selector) : null;
        const ret = innerMatcher.call(this, filterSelector);
        // Set `matches` to `null`, so we don't waste memory.
        matches = null;
        return ret;
    };
}
function _removeDuplicates(elems) {
    return elems.length > 1 ? Array.from(new Set(elems)) : elems;
}
const parent = _singleMatcher(({ parent })=>parent && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(parent) ? parent : null, _removeDuplicates);
const parents = _matcher((elem)=>{
    const matched = [];
    while(elem.parent && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(elem.parent)){
        matched.push(elem.parent);
        elem = elem.parent;
    }
    return matched;
}, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uniqueSort"], // eslint-disable-next-line unicorn/no-array-reverse
(elems)=>elems.reverse());
const parentsUntil = _matchUntil(({ parent })=>parent && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(parent) ? parent : null, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uniqueSort"], // eslint-disable-next-line unicorn/no-array-reverse
(elems)=>elems.reverse());
function closest(selector) {
    var _a;
    const set = [];
    if (!selector) {
        return this._make(set);
    }
    const selectOpts = {
        xmlMode: this.options.xmlMode,
        root: (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]
    };
    const selectFn = typeof selector === 'string' ? (elem)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["is"](elem, selector, selectOpts) : getFilterFn(selector);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["domEach"])(this, (elem)=>{
        if (elem && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(elem) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) {
            elem = elem.parent;
        }
        while(elem && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)){
            if (selectFn(elem, 0)) {
                // Do not add duplicate elements to the set
                if (!set.includes(elem)) {
                    set.push(elem);
                }
                break;
            }
            elem = elem.parent;
        }
    });
    return this._make(set);
}
const next = _singleMatcher((elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nextElementSibling"])(elem));
const nextAll = _matcher((elem)=>{
    const matched = [];
    while(elem.next){
        elem = elem.next;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) matched.push(elem);
    }
    return matched;
}, _removeDuplicates);
const nextUntil = _matchUntil((el)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nextElementSibling"])(el), _removeDuplicates);
const prev = _singleMatcher((elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prevElementSibling"])(elem));
const prevAll = _matcher((elem)=>{
    const matched = [];
    while(elem.prev){
        elem = elem.prev;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem)) matched.push(elem);
    }
    return matched;
}, _removeDuplicates);
const prevUntil = _matchUntil((el)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prevElementSibling"])(el), _removeDuplicates);
const siblings = _matcher((elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSiblings"])(elem).filter((el)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(el) && el !== elem), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uniqueSort"]);
const children = _matcher((elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getChildren"])(elem).filter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"]), _removeDuplicates);
function contents() {
    const elems = this.toArray().reduce((newElems, elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(elem) ? newElems.concat(elem.children) : newElems, []);
    return this._make(elems);
}
function each(fn) {
    let i = 0;
    const len = this.length;
    while(i < len && fn.call(this[i], i, this[i]) !== false)++i;
    return this;
}
function map(fn) {
    let elems = [];
    for(let i = 0; i < this.length; i++){
        const el = this[i];
        const val = fn.call(el, i, el);
        if (val != null) {
            elems = elems.concat(val);
        }
    }
    return this._make(elems);
}
/**
 * Creates a function to test if a filter is matched.
 *
 * @param match - A filter.
 * @returns A function that determines if a filter has been matched.
 */ function getFilterFn(match) {
    if (typeof match === 'function') {
        return (el, i)=>match.call(el, i, el);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(match)) {
        return (el)=>Array.prototype.includes.call(match, el);
    }
    return function(el) {
        return match === el;
    };
}
function filter(match) {
    var _a;
    return this._make(filterArray(this.toArray(), match, this.options.xmlMode, (_a = this._root) === null || _a === void 0 ? void 0 : _a[0]));
}
function filterArray(nodes, match, xmlMode, root) {
    return typeof match === 'string' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["filter"](match, nodes, {
        xmlMode,
        root
    }) : nodes.filter(getFilterFn(match));
}
function is(selector) {
    const nodes = this.toArray();
    return typeof selector === 'string' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["some"](nodes.filter(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"]), selector, this.options) : selector ? nodes.some(getFilterFn(selector)) : false;
}
function not(match) {
    let nodes = this.toArray();
    if (typeof match === 'string') {
        const matches = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2d$select$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["filter"](match, nodes, this.options));
        nodes = nodes.filter((el)=>!matches.has(el));
    } else {
        const filterFn = getFilterFn(match);
        nodes = nodes.filter((el, i)=>!filterFn(el, i));
    }
    return this._make(nodes);
}
function has(selectorOrHaystack) {
    return this.filter(typeof selectorOrHaystack === 'string' ? `:has(${selectorOrHaystack})` : (_, el)=>this._make(el).find(selectorOrHaystack).length > 0);
}
function first() {
    return this.length > 1 ? this._make(this[0]) : this;
}
function last() {
    return this.length > 0 ? this._make(this[this.length - 1]) : this;
}
function eq(i) {
    var _a;
    i = +i;
    // Use the first identity optimization if possible
    if (i === 0 && this.length <= 1) return this;
    if (i < 0) i = this.length + i;
    return this._make((_a = this[i]) !== null && _a !== void 0 ? _a : []);
}
function get(i) {
    if (i == null) {
        return this.toArray();
    }
    return this[i < 0 ? this.length + i : i];
}
function toArray() {
    return Array.prototype.slice.call(this);
}
function index(selectorOrNeedle) {
    let $haystack;
    let needle;
    if (selectorOrNeedle == null) {
        $haystack = this.parent().children();
        needle = this[0];
    } else if (typeof selectorOrNeedle === 'string') {
        $haystack = this._make(selectorOrNeedle);
        needle = this[0];
    } else {
        // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
        $haystack = this;
        needle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(selectorOrNeedle) ? selectorOrNeedle[0] : selectorOrNeedle;
    }
    return Array.prototype.indexOf.call($haystack, needle);
}
function slice(start, end) {
    return this._make(Array.prototype.slice.call(this, start, end));
}
function end() {
    var _a;
    return (_a = this.prevObject) !== null && _a !== void 0 ? _a : this._make([]);
}
function add(other, context) {
    const selection = this._make(other, context);
    const contents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uniqueSort"])([
        ...this.get(),
        ...selection.get()
    ]);
    return this._make(contents);
}
function addBack(selector) {
    return this.prevObject ? this.add(selector ? this.prevObject.filter(selector) : this.prevObject) : this;
}
}),
"[project]/node_modules/cheerio/dist/esm/cheerio.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Cheerio",
    ()=>Cheerio
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$attributes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/attributes.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$traversing$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/traversing.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/manipulation.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$css$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/css.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$forms$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/forms.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$extract$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/api/extract.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
class Cheerio {
    /**
     * Instance of cheerio. Methods are specified in the modules. Usage of this
     * constructor is not recommended. Please use `$.load` instead.
     *
     * @private
     * @param elements - The new selection.
     * @param root - Sets the root node.
     * @param options - Options for the instance.
     */ constructor(elements, root, options){
        this.length = 0;
        this.options = options;
        this._root = root;
        if (elements) {
            for(let idx = 0; idx < elements.length; idx++){
                this[idx] = elements[idx];
            }
            this.length = elements.length;
        }
    }
}
/** Set a signature of the object. */ Cheerio.prototype.cheerio = '[cheerio object]';
/*
 * Make cheerio an array-like object
 */ Cheerio.prototype.splice = Array.prototype.splice;
// Support for (const element of $(...)) iteration:
Cheerio.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
// Plug in the API
Object.assign(Cheerio.prototype, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$attributes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$traversing$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$css$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$forms$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$api$2f$extract$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__);
}),
"[project]/node_modules/cheerio/dist/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "decodeStream",
    ()=>decodeStream,
    "fromURL",
    ()=>fromURL,
    "loadBuffer",
    ()=>loadBuffer,
    "stringStream",
    ()=>stringStream
]);
/**
 * @file Batteries-included version of Cheerio. This module includes several
 *   convenience methods for loading documents from various sources.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/load-parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$htmlparser2$2d$tree$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parse5-htmlparser2-tree-adapter/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$parser$2d$stream$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parse5-parser-stream/dist/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/encoding-sniffer/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/undici/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$whatwg$2d$mimetype$2f$lib$2f$mime$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/whatwg-mimetype/lib/mime-type.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:stream [external] (node:stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/options.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
function loadBuffer(buffer, options = {}) {
    const opts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(options);
    const str = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["decodeBuffer"])(buffer, {
        defaultEncoding: (opts === null || opts === void 0 ? void 0 : opts.xmlMode) ? 'utf8' : 'windows-1252',
        ...options.encoding
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["load"])(str, opts);
}
function _stringStream(options, cb) {
    var _a;
    if (options === null || options === void 0 ? void 0 : options._useHtmlParser2) {
        const parser = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createDocumentStream"]((err, document)=>cb(err, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["load"])(document, options)), options);
        return new __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__["Writable"]({
            decodeStrings: false,
            write (chunk, _encoding, callback) {
                if (typeof chunk !== 'string') {
                    throw new TypeError('Expected a string');
                }
                parser.write(chunk);
                callback();
            },
            final (callback) {
                parser.end();
                callback();
            }
        });
    }
    options !== null && options !== void 0 ? options : options = {};
    (_a = options.treeAdapter) !== null && _a !== void 0 ? _a : options.treeAdapter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$htmlparser2$2d$tree$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adapter"];
    if (options.scriptingEnabled !== false) {
        options.scriptingEnabled = true;
    }
    const stream = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$parser$2d$stream$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ParserStream"](options);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__["finished"])(stream, (err)=>cb(err, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2d$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["load"])(stream.document, options)));
    return stream;
}
function stringStream(options, cb) {
    return _stringStream((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(options), cb);
}
function decodeStream(options, cb) {
    var _a;
    const { encoding = {}, ...cheerioOptions } = options;
    const opts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(cheerioOptions);
    // Set the default encoding to UTF-8 for XML mode
    (_a = encoding.defaultEncoding) !== null && _a !== void 0 ? _a : encoding.defaultEncoding = (opts === null || opts === void 0 ? void 0 : opts.xmlMode) ? 'utf8' : 'windows-1252';
    const decodeStream = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DecodeStream"](encoding);
    const loadStream = _stringStream(opts, cb);
    decodeStream.pipe(loadStream);
    return decodeStream;
}
const defaultRequestOptions = {
    method: 'GET',
    // Set an Accept header
    headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
};
async function fromURL(url, options = {}) {
    const { requestOptions = defaultRequestOptions, encoding = {}, ...cheerioOptions } = options;
    let undiciStream;
    // Add headers if none were supplied.
    const urlObject = typeof url === 'string' ? new URL(url) : url;
    const streamOptions = {
        headers: defaultRequestOptions.headers,
        path: urlObject.pathname + urlObject.search,
        ...requestOptions
    };
    const promise = new Promise((resolve, reject)=>{
        undiciStream = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Client"](urlObject.origin).compose(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["interceptors"].redirect({
            maxRedirections: 5
        })).stream(streamOptions, (res)=>{
            var _a, _b;
            if (res.statusCode < 200 || res.statusCode >= 300) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["errors"].ResponseError('Response Error', res.statusCode, {
                    headers: res.headers
                });
            }
            const contentTypeHeader = (_a = res.headers['content-type']) !== null && _a !== void 0 ? _a : 'text/html';
            const mimeType = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$whatwg$2d$mimetype$2f$lib$2f$mime$2d$type$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"](Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader);
            if (!mimeType.isHTML() && !mimeType.isXML()) {
                throw new RangeError(`The content-type "${mimeType.essence}" is neither HTML nor XML.`);
            }
            // Forward the charset from the header to the decodeStream.
            encoding.transportLayerEncodingLabel = mimeType.parameters.get('charset');
            /*
             * If we allow redirects, we will have entries in the history.
             * The last entry will be the final URL.
             */ const history = (_b = res.context) === null || _b === void 0 ? void 0 : _b.history;
            // Set the `baseURI` to the final URL.
            const baseURI = history ? history[history.length - 1] : urlObject;
            const opts = {
                encoding,
                // Set XML mode based on the MIME type.
                xmlMode: mimeType.isXML(),
                baseURI,
                ...cheerioOptions
            };
            return decodeStream(opts, (err, $)=>err ? reject(err) : resolve($));
        });
    });
    // Let's make sure the request is completed before returning the promise.
    await undiciStream;
    return promise;
}
}),
"[project]/node_modules/cheerio/dist/esm/load-parse.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "load",
    ()=>load
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/load.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parsers$2f$parse5$2d$adapter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/parsers/parse5-adapter.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
;
;
;
;
;
const parse = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getParse"])((content, options, isDocument, context)=>options._useHtmlParser2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parseDocument"])(content, options) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parsers$2f$parse5$2d$adapter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parseWithParse5"])(content, options, isDocument, context));
const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$load$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLoad"])(parse, (dom, options)=>options._useHtmlParser2 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(dom, options) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$parsers$2f$parse5$2d$adapter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["renderWithParse5"])(dom));
}),
"[project]/node_modules/cheerio/dist/esm/load.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLoad",
    ()=>getLoad
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/options.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$cheerio$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/cheerio.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Root$3e$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Root>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Text$3e$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Text>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Comment$3e$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Comment>");
;
;
;
;
;
function getLoad(parse, render) {
    /**
     * Create a querying function, bound to a document created from the provided
     * markup.
     *
     * Note that similar to web browser contexts, this operation may introduce
     * `<html>`, `<head>`, and `<body>` elements; set `isDocument` to `false` to
     * switch to fragment mode and disable this.
     *
     * @param content - Markup to be loaded.
     * @param options - Options for the created instance.
     * @param isDocument - Allows parser to be switched to fragment mode.
     * @returns The loaded document.
     * @see {@link https://cheerio.js.org/docs/basics/loading#load} for additional usage information.
     */ return function load(content, options, isDocument = true) {
        if (content == null) {
            throw new Error('cheerio.load() expects a string');
        }
        const internalOpts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(options);
        const initialRoot = parse(content, internalOpts, isDocument, null);
        /**
         * Create an extended class here, so that extensions only live on one
         * instance.
         */ class LoadedCheerio extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$cheerio$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Cheerio"] {
            _make(selector, context) {
                const cheerio = initialize(selector, context);
                cheerio.prevObject = this;
                return cheerio;
            }
            _parse(content, options, isDocument, context) {
                return parse(content, options, isDocument, context);
            }
            _render(dom) {
                return render(dom, this.options);
            }
        }
        function initialize(selector, context, root = initialRoot, opts) {
            // $($)
            if (selector && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(selector)) return selector;
            const options = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(opts, internalOpts);
            const r = typeof root === 'string' ? [
                parse(root, options, false, null)
            ] : 'length' in root ? root : [
                root
            ];
            const rootInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(r) ? r : new LoadedCheerio(r, null, options);
            // Add a cyclic reference, so that calling methods on `_root` never fails.
            rootInstance._root = rootInstance;
            // $(), $(null), $(undefined), $(false)
            if (!selector) {
                return new LoadedCheerio(undefined, rootInstance, options);
            }
            const elements = typeof selector === 'string' && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHtml"])(selector) ? parse(selector, options, false, null).children : isNode(selector) ? [
                selector
            ] : Array.isArray(selector) ? selector : undefined;
            const instance = new LoadedCheerio(elements, rootInstance, options);
            if (elements) {
                return instance;
            }
            if (typeof selector !== 'string') {
                throw new TypeError('Unexpected type of selector');
            }
            // We know that our selector is a string now.
            let search = selector;
            const searchContext = context ? typeof context === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isHtml"])(context) ? new LoadedCheerio([
                parse(context, options, false, null)
            ], rootInstance, options) : (search = `${context} ${search}`, rootInstance) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$utils$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCheerio"])(context) ? context : new LoadedCheerio(Array.isArray(context) ? context : [
                context
            ], rootInstance, options) : rootInstance;
            // If we still don't have a context, return
            if (!searchContext) return instance;
            /*
             * #id, .class, tag
             */ return searchContext.find(search);
        }
        // Add in static methods & properties
        Object.assign(initialize, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$static$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, {
            load,
            // `_root` and `_options` are used in static methods.
            _root: initialRoot,
            _options: internalOpts,
            // Add `fn` for plugins
            fn: LoadedCheerio.prototype,
            // Add the prototype here to maintain `instanceof` behavior.
            prototype: LoadedCheerio.prototype
        });
        return initialize;
    };
}
function isNode(obj) {
    return(// @ts-expect-error: TS doesn't know about the `name` property.
    !!obj.name || // @ts-expect-error: TS doesn't know about the `type` property.
    obj.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Root$3e$__["ElementType"].Root || // @ts-expect-error: TS doesn't know about the `type` property.
    obj.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Text$3e$__["ElementType"].Text || // @ts-expect-error: TS doesn't know about the `type` property.
    obj.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ElementType__$2e$Comment$3e$__["ElementType"].Comment);
}
}),
"[project]/node_modules/cheerio/dist/esm/options.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "flattenOptions",
    ()=>flattenOptions
]);
const defaultOpts = {
    _useHtmlParser2: false
};
function flattenOptions(options, baseOptions) {
    if (!options) {
        return baseOptions !== null && baseOptions !== void 0 ? baseOptions : defaultOpts;
    }
    const opts = {
        _useHtmlParser2: !!options.xmlMode,
        ...baseOptions,
        ...options
    };
    if (options.xml) {
        opts._useHtmlParser2 = true;
        opts.xmlMode = true;
        if (options.xml !== true) {
            Object.assign(opts, options.xml);
        }
    } else if (options.xmlMode) {
        opts._useHtmlParser2 = true;
    }
    return opts;
}
}),
"[project]/node_modules/cheerio/dist/esm/parse.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getParse",
    ()=>getParse,
    "update",
    ()=>update
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/manipulation.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
;
function getParse(parser) {
    /**
     * Parse a HTML string or a node.
     *
     * @param content - The HTML string or node.
     * @param options - The parser options.
     * @param isDocument - If `content` is a document.
     * @param context - The context node in the DOM tree.
     * @returns The parsed document node.
     */ return function parse(content, options, isDocument, context) {
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(content)) {
            content = content.toString();
        }
        if (typeof content === 'string') {
            return parser(content, options, isDocument, context);
        }
        const doc = content;
        if (!Array.isArray(doc) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(doc)) {
            // If `doc` is already a root, just return it
            return doc;
        }
        // Add content to new root element
        const root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"]([]);
        // Update the DOM using the root
        update(doc, root);
        return root;
    };
}
function update(newChilds, parent) {
    // Normalize
    const arr = Array.isArray(newChilds) ? newChilds : [
        newChilds
    ];
    // Update parent
    if (parent) {
        parent.children = arr;
    } else {
        parent = null;
    }
    // Update neighbors
    for(let i = 0; i < arr.length; i++){
        const node = arr[i];
        // Cleanly remove existing nodes from their previous structures.
        if (node.parent && node.parent.children !== arr) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeElement"])(node);
        }
        if (parent) {
            node.prev = arr[i - 1] || null;
            node.next = arr[i + 1] || null;
        } else {
            node.prev = node.next = null;
        }
        node.parent = parent;
    }
    return parent;
}
}),
"[project]/node_modules/cheerio/dist/esm/parsers/parse5-adapter.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseWithParse5",
    ()=>parseWithParse5,
    "renderWithParse5",
    ()=>renderWithParse5
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$serializer$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/serializer/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$htmlparser2$2d$tree$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parse5-htmlparser2-tree-adapter/dist/index.js [app-rsc] (ecmascript)");
;
;
;
function parseWithParse5(content, options, isDocument, context) {
    var _a;
    (_a = options.treeAdapter) !== null && _a !== void 0 ? _a : options.treeAdapter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$htmlparser2$2d$tree$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adapter"];
    if (options.scriptingEnabled !== false) {
        options.scriptingEnabled = true;
    }
    return isDocument ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parse"])(content, options) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parseFragment"])(context, content, options);
}
const renderOpts = {
    treeAdapter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2d$htmlparser2$2d$tree$2d$adapter$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adapter"]
};
function renderWithParse5(dom) {
    /*
     * `dom-serializer` passes over the special "root" node and renders the
     * node's children in its place. To mimic this behavior with `parse5`, an
     * equivalent operation must be applied to the input array.
     */ const nodes = 'length' in dom ? dom : [
        dom
    ];
    for(let index = 0; index < nodes.length; index += 1){
        const node = nodes[index];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"])(node)) {
            Array.prototype.splice.call(nodes, index, 1, ...node.children);
        }
    }
    let result = '';
    for(let index = 0; index < nodes.length; index += 1){
        const node = nodes[index];
        result += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$serializer$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["serializeOuter"])(node, renderOpts);
    }
    return result;
}
}),
"[project]/node_modules/cheerio/dist/esm/static.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contains",
    ()=>contains,
    "extract",
    ()=>extract,
    "html",
    ()=>html,
    "merge",
    ()=>merge,
    "parseHTML",
    ()=>parseHTML,
    "root",
    ()=>root,
    "text",
    ()=>text,
    "xml",
    ()=>xml
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/cheerio/dist/esm/options.js [app-rsc] (ecmascript)");
;
;
/**
 * Helper function to render a DOM.
 *
 * @param that - Cheerio instance to render.
 * @param dom - The DOM to render. Defaults to `that`'s root.
 * @param options - Options for rendering.
 * @returns The rendered document.
 */ function render(that, dom, options) {
    if (!that) return '';
    return that(dom !== null && dom !== void 0 ? dom : that._root.children, null, undefined, options).toString();
}
/**
 * Checks if a passed object is an options object.
 *
 * @param dom - Object to check if it is an options object.
 * @param options - Options object.
 * @returns Whether the object is an options object.
 */ function isOptions(dom, options) {
    return !options && typeof dom === 'object' && dom != null && !('length' in dom) && !('type' in dom);
}
function html(dom, options) {
    /*
     * Be flexible about parameters, sometimes we call html(),
     * with options as only parameter
     * check dom argument for dom element specific properties
     * assume there is no 'length' or 'type' properties in the options object
     */ const toRender = isOptions(dom) ? (options = dom, undefined) : dom;
    /*
     * Sometimes `$.html()` is used without preloading html,
     * so fallback non-existing options to the default ones.
     */ const opts = {
        ...this === null || this === void 0 ? void 0 : this._options,
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$cheerio$2f$dist$2f$esm$2f$options$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["flattenOptions"])(options)
    };
    return render(this, toRender, opts);
}
function xml(dom) {
    const options = {
        ...this._options,
        xmlMode: true
    };
    return render(this, dom, options);
}
function text(elements) {
    const elems = elements !== null && elements !== void 0 ? elements : this ? this.root() : [];
    let ret = '';
    for(let i = 0; i < elems.length; i++){
        ret += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["textContent"])(elems[i]);
    }
    return ret;
}
function parseHTML(data, context, keepScripts = typeof context === 'boolean' ? context : false) {
    if (!data || typeof data !== 'string') {
        return null;
    }
    if (typeof context === 'boolean') {
        keepScripts = context;
    }
    const parsed = this.load(data, this._options, false);
    if (!keepScripts) {
        parsed('script').remove();
    }
    /*
     * The `children` array is used by Cheerio internally to group elements that
     * share the same parents. When nodes created through `parseHTML` are
     * inserted into previously-existing DOM structures, they will be removed
     * from the `children` array. The results of `parseHTML` should remain
     * constant across these operations, so a shallow copy should be returned.
     */ return [
        ...parsed.root()[0].children
    ];
}
function root() {
    return this(this._root);
}
function contains(container, contained) {
    // According to the jQuery API, an element does not "contain" itself
    if (contained === container) {
        return false;
    }
    /*
     * Step up the descendants, stopping when the root element is reached
     * (signaled by `.parent` returning a reference to the same object)
     */ let next = contained;
    while(next && next !== next.parent){
        next = next.parent;
        if (next === container) {
            return true;
        }
    }
    return false;
}
function extract(map) {
    return this.root().extract(map);
}
function merge(arr1, arr2) {
    if (!isArrayLike(arr1) || !isArrayLike(arr2)) {
        return;
    }
    let newLength = arr1.length;
    const len = +arr2.length;
    for(let i = 0; i < len; i++){
        arr1[newLength++] = arr2[i];
    }
    arr1.length = newLength;
    return arr1;
}
/**
 * Checks if an object is array-like.
 *
 * @category Static
 * @param item - Item to check.
 * @returns Indicates if the item is array-like.
 */ function isArrayLike(item) {
    if (Array.isArray(item)) {
        return true;
    }
    if (typeof item !== 'object' || item === null || !('length' in item) || typeof item.length !== 'number' || item.length < 0) {
        return false;
    }
    for(let i = 0; i < item.length; i++){
        if (!(i in item)) {
            return false;
        }
    }
    return true;
}
}),
"[project]/node_modules/cheerio/dist/esm/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Checks if an object is a Cheerio instance.
 *
 * @category Utils
 * @param maybeCheerio - The object to check.
 * @returns Whether the object is a Cheerio instance.
 */ __turbopack_context__.s([
    "camelCase",
    ()=>camelCase,
    "cssCase",
    ()=>cssCase,
    "domEach",
    ()=>domEach,
    "isCheerio",
    ()=>isCheerio,
    "isHtml",
    ()=>isHtml
]);
function isCheerio(maybeCheerio) {
    return maybeCheerio.cheerio != null;
}
function camelCase(str) {
    return str.replace(/[._-](\w|$)/g, (_, x)=>x.toUpperCase());
}
function cssCase(str) {
    return str.replace(/[A-Z]/g, '-$&').toLowerCase();
}
function domEach(array, fn) {
    const len = array.length;
    for(let i = 0; i < len; i++)fn(array[i], i);
    return array;
}
var CharacterCode;
(function(CharacterCode) {
    CharacterCode[CharacterCode["LowerA"] = 97] = "LowerA";
    CharacterCode[CharacterCode["LowerZ"] = 122] = "LowerZ";
    CharacterCode[CharacterCode["UpperA"] = 65] = "UpperA";
    CharacterCode[CharacterCode["UpperZ"] = 90] = "UpperZ";
    CharacterCode[CharacterCode["Exclamation"] = 33] = "Exclamation";
})(CharacterCode || (CharacterCode = {}));
function isHtml(str) {
    if (typeof str !== 'string') {
        return false;
    }
    const tagStart = str.indexOf('<');
    if (tagStart === -1 || tagStart > str.length - 3) return false;
    const tagChar = str.charCodeAt(tagStart + 1);
    return (tagChar >= CharacterCode.LowerA && tagChar <= CharacterCode.LowerZ || tagChar >= CharacterCode.UpperA && tagChar <= CharacterCode.UpperZ || tagChar === CharacterCode.Exclamation) && str.includes('>', tagStart + 2);
}
}),
"[project]/node_modules/cron-parser/dist/CronDate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronDate = exports.DAYS_IN_MONTH = exports.DateMathOp = exports.TimeUnit = void 0;
const luxon_1 = __turbopack_context__.r("[project]/node_modules/luxon/build/node/luxon.js [app-rsc] (ecmascript)");
var TimeUnit;
(function(TimeUnit) {
    TimeUnit["Second"] = "Second";
    TimeUnit["Minute"] = "Minute";
    TimeUnit["Hour"] = "Hour";
    TimeUnit["Day"] = "Day";
    TimeUnit["Month"] = "Month";
    TimeUnit["Year"] = "Year";
})(TimeUnit || (exports.TimeUnit = TimeUnit = {}));
var DateMathOp;
(function(DateMathOp) {
    DateMathOp["Add"] = "Add";
    DateMathOp["Subtract"] = "Subtract";
})(DateMathOp || (exports.DateMathOp = DateMathOp = {}));
exports.DAYS_IN_MONTH = Object.freeze([
    31,
    29,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
]);
/**
 * CronDate class that wraps the Luxon DateTime object to provide
 * a consistent API for working with dates and times in the context of cron.
 */ class CronDate {
    #date;
    #dstStart = null;
    #dstStartLandingHour = null;
    #dstEnd = null;
    /**
     * Constructs a new CronDate instance.
     * @param {CronDate | Date | number | string} [timestamp] - The timestamp to initialize the CronDate with.
     * @param {string} [tz] - The timezone to use for the CronDate.
     */ constructor(timestamp, tz){
        const dateOpts = {
            zone: tz
        };
        // Initialize the internal DateTime object based on the type of timestamp provided.
        // 0 is the Unix epoch, not a missing timestamp
        if (!timestamp && timestamp !== 0) {
            this.#date = luxon_1.DateTime.local();
        } else if (timestamp instanceof CronDate) {
            this.#date = timestamp.#date;
            this.#dstStart = timestamp.#dstStart;
            this.#dstStartLandingHour = timestamp.#dstStartLandingHour;
            this.#dstEnd = timestamp.#dstEnd;
        } else if (timestamp instanceof Date) {
            this.#date = luxon_1.DateTime.fromJSDate(timestamp, dateOpts);
        } else if (typeof timestamp === 'number') {
            this.#date = luxon_1.DateTime.fromMillis(timestamp, dateOpts);
        } else {
            this.#date = luxon_1.DateTime.fromISO(timestamp, dateOpts);
            this.#date.isValid || (this.#date = luxon_1.DateTime.fromRFC2822(timestamp, dateOpts));
            this.#date.isValid || (this.#date = luxon_1.DateTime.fromSQL(timestamp, dateOpts));
            this.#date.isValid || (this.#date = luxon_1.DateTime.fromFormat(timestamp, 'EEE, d MMM yyyy HH:mm:ss', dateOpts));
            this.#date.isValid || (this.#date = luxon_1.DateTime.fromHTTP(timestamp, dateOpts));
        }
        // Check for valid DateTime and throw an error if not valid.
        if (!this.#date.isValid) {
            throw new Error(`CronDate: unhandled timestamp: ${timestamp}`);
        }
        // Set the timezone if it is provided and different from the current zone.
        if (tz && tz !== this.#date.zoneName) {
            this.#date = this.#date.setZone(tz);
        }
    }
    /**
     * Determines if the given year is a leap year.
     * @param {number} year - The year to check
     * @returns {boolean} - True if the year is a leap year, false otherwise
     * @private
     */ static #isLeapYear(year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    }
    /**
     * Returns daylight savings start time.
     * @returns {number | null}
     */ get dstStart() {
        return this.#dstStart;
    }
    /**
     * Returns the first existing hour after the skipped window, or null.
     * @returns {number | null}
     */ get dstStartLandingHour() {
        return this.#dstStartLandingHour;
    }
    /**
     * Discards the recorded daylight savings start window. The two halves are
     * only meaningful together, so neither is writable on its own.
     */ clearDstStart() {
        this.#dstStart = null;
        this.#dstStartLandingHour = null;
    }
    /**
     * Returns daylight savings end time.
     * @returns {number | null}
     */ get dstEnd() {
        return this.#dstEnd;
    }
    /**
     * Sets daylight savings end time.
     * @param {number | null} value
     */ set dstEnd(value) {
        this.#dstEnd = value;
    }
    /**
     * Adds one year to the current CronDate.
     */ addYear() {
        this.#date = this.#date.plus({
            years: 1
        });
    }
    /**
     * Adds one month to the current CronDate.
     */ addMonth() {
        this.#date = this.#date.plus({
            months: 1
        }).startOf('month');
    }
    /**
     * Adds one day to the current CronDate.
     */ addDay() {
        this.#date = this.#date.plus({
            days: 1
        }).startOf('day');
    }
    /**
     * Adds one hour to the current CronDate.
     */ addHour() {
        this.#date = this.#date.plus({
            hours: 1
        }).startOf('hour');
    }
    /**
     * Adds one minute to the current CronDate.
     */ addMinute() {
        this.#date = this.#date.plus({
            minutes: 1
        }).startOf('minute');
    }
    /**
     * Adds one second to the current CronDate.
     */ addSecond() {
        this.#date = this.#date.plus({
            seconds: 1
        });
    }
    /**
     * Subtracts one year from the current CronDate.
     */ subtractYear() {
        this.#date = this.#date.minus({
            years: 1
        });
    }
    /**
     * Subtracts one month from the current CronDate.
     * If the month is 1, it will subtract one year instead.
     */ subtractMonth() {
        this.#date = this.#date.minus({
            months: 1
        }).endOf('month').startOf('second');
    }
    /**
     * Subtracts one day from the current CronDate.
     * If the day is 1, it will subtract one month instead.
     */ subtractDay() {
        this.#date = this.#date.minus({
            days: 1
        }).endOf('day').startOf('second');
    }
    /**
     * Subtracts one hour from the current CronDate.
     * If the hour is 0, it will subtract one day instead.
     */ subtractHour() {
        this.#date = this.#date.minus({
            hours: 1
        }).endOf('hour').startOf('second');
    }
    /**
     * Subtracts one minute from the current CronDate.
     * If the minute is 0, it will subtract one hour instead.
     */ subtractMinute() {
        this.#date = this.#date.minus({
            minutes: 1
        }).endOf('minute').startOf('second');
    }
    /**
     * Subtracts one second from the current CronDate.
     * If the second is 0, it will subtract one minute instead.
     */ subtractSecond() {
        this.#date = this.#date.minus({
            seconds: 1
        });
    }
    /**
     * Adds a unit of time to the current CronDate.
     * @param {TimeUnit} unit
     */ addUnit(unit) {
        switch(unit){
            case TimeUnit.Year:
                return this.addYear();
            case TimeUnit.Month:
                return this.addMonth();
            case TimeUnit.Day:
                return this.addDay();
            case TimeUnit.Hour:
                return this.addHour();
            case TimeUnit.Minute:
                return this.addMinute();
            case TimeUnit.Second:
                return this.addSecond();
        }
    }
    /**
     * Subtracts a unit of time from the current CronDate.
     * @param {TimeUnit} unit
     */ subtractUnit(unit) {
        switch(unit){
            case TimeUnit.Year:
                return this.subtractYear();
            case TimeUnit.Month:
                return this.subtractMonth();
            case TimeUnit.Day:
                return this.subtractDay();
            case TimeUnit.Hour:
                return this.subtractHour();
            case TimeUnit.Minute:
                return this.subtractMinute();
            case TimeUnit.Second:
                return this.subtractSecond();
        }
    }
    /**
     * Handles a math operation.
     * @param {DateMathOp} verb - {'add' | 'subtract'}
     * @param {TimeUnit} unit - {'year' | 'month' | 'day' | 'hour' | 'minute' | 'second'}
     */ invokeDateOperation(verb, unit) {
        if (verb === DateMathOp.Add) {
            this.addUnit(unit);
            return;
        }
        if (verb === DateMathOp.Subtract) {
            this.subtractUnit(unit);
            return;
        }
        /* istanbul ignore next - this would only happen if an end user call the handleMathOp with an invalid verb */ throw new Error(`Invalid verb: ${verb}`);
    }
    /**
     * Returns the day.
     * @returns {number}
     */ getDate() {
        return this.#date.day;
    }
    /**
     * Returns the year.
     * @returns {number}
     */ getFullYear() {
        return this.#date.year;
    }
    /**
     * Returns the day of the week.
     * @returns {number}
     */ getDay() {
        const weekday = this.#date.weekday;
        return weekday === 7 ? 0 : weekday;
    }
    /**
     * Returns the month.
     * @returns {number}
     */ getMonth() {
        return this.#date.month - 1;
    }
    /**
     * Returns the hour.
     * @returns {number}
     */ getHours() {
        return this.#date.hour;
    }
    /**
     * Returns the minutes.
     * @returns {number}
     */ getMinutes() {
        return this.#date.minute;
    }
    /**
     * Returns the seconds.
     * @returns {number}
     */ getSeconds() {
        return this.#date.second;
    }
    /**
     * Returns the milliseconds.
     * @returns {number}
     */ getMilliseconds() {
        return this.#date.millisecond;
    }
    /**
     * Returns the timezone offset from UTC in minutes (e.g. UTC+2 => 120).
     * Useful for detecting DST transition days.
     *
     * @returns {number} UTC offset in minutes
     */ getUTCOffset() {
        return this.#date.offset;
    }
    /**
     * Sets the time to the start of the day (00:00:00.000) in the current timezone.
     */ setStartOfDay() {
        this.#date = this.#date.startOf('day');
    }
    /**
     * Sets the time to the end of the day (23:59:59.999) in the current timezone.
     */ setEndOfDay() {
        this.#date = this.#date.endOf('day');
    }
    /**
     * Returns the time.
     * @returns {number}
     */ getTime() {
        return this.#date.valueOf();
    }
    /**
     * Returns the UTC day.
     * @returns {number}
     */ getUTCDate() {
        return this.#getUTC().day;
    }
    /**
     * Returns the UTC year.
     * @returns {number}
     */ getUTCFullYear() {
        return this.#getUTC().year;
    }
    /**
     * Returns the UTC day of the week.
     * @returns {number}
     */ getUTCDay() {
        const weekday = this.#getUTC().weekday;
        return weekday === 7 ? 0 : weekday;
    }
    /**
     * Returns the UTC month.
     * @returns {number}
     */ getUTCMonth() {
        return this.#getUTC().month - 1;
    }
    /**
     * Returns the UTC hour.
     * @returns {number}
     */ getUTCHours() {
        return this.#getUTC().hour;
    }
    /**
     * Returns the UTC minutes.
     * @returns {number}
     */ getUTCMinutes() {
        return this.#getUTC().minute;
    }
    /**
     * Returns the UTC seconds.
     * @returns {number}
     */ getUTCSeconds() {
        return this.#getUTC().second;
    }
    /**
     * Returns the UTC milliseconds.
     * @returns {string | null}
     */ toISOString() {
        return this.#date.toUTC().toISO();
    }
    /**
     * Returns the date as a JSON string.
     * @returns {string | null}
     */ toJSON() {
        return this.#date.toJSON();
    }
    /**
     * Sets the day.
     * @param d
     */ setDate(d) {
        this.#date = this.#date.set({
            day: d
        });
    }
    /**
     * Sets the year.
     * @param y
     */ setFullYear(y) {
        this.#date = this.#date.set({
            year: y
        });
    }
    /**
     * Sets the day of the week.
     * @param d
     */ setDay(d) {
        this.#date = this.#date.set({
            weekday: d
        });
    }
    /**
     * Sets the month.
     * @param m
     */ setMonth(m) {
        this.#date = this.#date.set({
            month: m + 1
        });
    }
    /**
     * Sets the hour.
     * @param h
     */ setHours(h) {
        this.#date = this.#date.set({
            hour: h
        });
    }
    /**
     * Sets the minutes.
     * @param m
     */ setMinutes(m) {
        this.#date = this.#date.set({
            minute: m
        });
    }
    /**
     * Sets the seconds.
     * @param s
     */ setSeconds(s) {
        this.#date = this.#date.set({
            second: s
        });
    }
    /**
     * Sets the milliseconds.
     * @param s
     */ setMilliseconds(s) {
        this.#date = this.#date.set({
            millisecond: s
        });
    }
    /**
     * Returns the date as a string.
     * @returns {string}
     */ toString() {
        return this.toDate().toString();
    }
    /**
     * Returns the date as a Date object.
     * @returns {Date}
     */ toDate() {
        return this.#date.toJSDate();
    }
    /**
     * Returns true if the day is the last day of the month.
     * @returns {boolean}
     */ isLastDayOfMonth() {
        const { day, month } = this.#date;
        // Special handling for February in leap years
        if (month === 2) {
            const isLeap = CronDate.#isLeapYear(this.#date.year);
            return day === exports.DAYS_IN_MONTH[month - 1] - (isLeap ? 0 : 1);
        }
        // For other months, check against the static map
        return day === exports.DAYS_IN_MONTH[month - 1];
    }
    /**
     * Returns true if the day is the last weekday of the month.
     * @returns {boolean}
     */ isLastWeekdayOfMonth() {
        const { day, month } = this.#date;
        // Get the last day of the current month
        let lastDay;
        if (month === 2) {
            // Special handling for February
            lastDay = exports.DAYS_IN_MONTH[month - 1] - (CronDate.#isLeapYear(this.#date.year) ? 0 : 1);
        } else {
            lastDay = exports.DAYS_IN_MONTH[month - 1];
        }
        // Check if the current day is within 7 days of the end of the month
        return day > lastDay - 7;
    }
    /**
     * Primarily for internal use.
     * @param {DateMathOp} op - The operation to perform.
     * @param {TimeUnit} unit - The unit of time to use.
     * @param {number} [hoursLength] - The length of the hours. Required when unit is not month or day.
     */ applyDateOperation(op, unit, hoursLength) {
        if (unit === TimeUnit.Month || unit === TimeUnit.Day) {
            this.invokeDateOperation(op, unit);
            return;
        }
        const previousHour = this.getHours();
        const previousOffset = this.getUTCOffset();
        this.invokeDateOperation(op, unit);
        const currentHour = this.getHours();
        // Wall-clock hours crossed, modular so a step over midnight measures the
        // same as one within the day.
        const advance = (currentHour - previousHour + 24) % 24;
        // advance >= 2: at least one whole wall-clock hour was skipped, which
        // sub-hour shifts and calendar-day jumps must not qualify as.
        if (op === DateMathOp.Add && this.getUTCOffset() > previousOffset && advance >= 2) {
            if (hoursLength !== 24) {
                // First skipped hour, then the hour landed on. Modulo carries a window
                // that starts at 23:00 over midnight.
                this.#dstStart = (previousHour + 1) % 24;
                this.#dstStartLandingHour = currentHour;
            }
        } else if (advance === 0 && this.getMinutes() === 0 && this.getSeconds() === 0) {
            if (hoursLength !== 24) {
                this.dstEnd = currentHour;
            }
        }
    }
    /**
     * Returns the UTC date.
     * @private
     * @returns {DateTime}
     */ #getUTC() {
        return this.#date.toUTC();
    }
}
exports.CronDate = CronDate;
exports.default = CronDate;
}),
"[project]/node_modules/cron-parser/dist/CronExpression.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronExpression = exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE = exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE = void 0;
const CronDate_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronDate.js [app-rsc] (ecmascript)");
/**
 * Error message for when the current date is outside the specified time span.
 */ exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE = 'Out of the time span range';
/**
 * Error message for when the loop limit is exceeded during iteration.
 */ exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE = 'Invalid expression, loop limit exceeded';
/**
 * Cron iteration loop safety limit
 */ const LOOP_LIMIT = 10000;
/**
 * Class representing a Cron expression.
 */ class CronExpression {
    #options;
    #tz;
    #initialDate;
    #currentDate;
    #startDate;
    #endDate;
    #fields;
    #dstTransitionDayKey = null;
    #isDstTransitionDay = false;
    /**
     * Creates a new CronExpression instance.
     *
     * @param {CronFieldCollection} fields - Cron fields.
     * @param {CronExpressionOptions} options - Parser options.
     */ constructor(fields, options){
        this.#options = options;
        this.#tz = options.tz;
        this.#startDate = options.startDate != null ? new CronDate_1.CronDate(options.startDate, this.#tz) : null;
        this.#endDate = options.endDate != null ? new CronDate_1.CronDate(options.endDate, this.#tz) : null;
        let currentDateValue = options.currentDate ?? options.startDate;
        if (currentDateValue != null) {
            const tempCurrentDate = new CronDate_1.CronDate(currentDateValue, this.#tz);
            if (this.#startDate && tempCurrentDate.getTime() < this.#startDate.getTime()) {
                currentDateValue = this.#startDate;
            } else if (this.#endDate && tempCurrentDate.getTime() > this.#endDate.getTime()) {
                currentDateValue = this.#endDate;
            }
        }
        this.#initialDate = new CronDate_1.CronDate(currentDateValue, this.#tz);
        this.#currentDate = this.#initialDate;
        this.#fields = fields;
    }
    /**
     * Getter for the cron fields.
     *
     * @returns {CronFieldCollection} Cron fields.
     */ get fields() {
        return this.#fields;
    }
    /**
     * Converts cron fields back to a CronExpression instance.
     *
     * @public
     * @param {Record<string, number[]>} fields - The input cron fields object.
     * @param {CronExpressionOptions} [options] - Optional parsing options.
     * @returns {CronExpression} - A new CronExpression instance.
     */ static fieldsToExpression(fields, options) {
        return new CronExpression(fields, options || {});
    }
    /**
     * Checks if the given value matches any element in the sequence.
     *
     * @param {number} value - The value to be matched.
     * @param {number[]} sequence - The sequence to be checked against.
     * @returns {boolean} - True if the value matches an element in the sequence; otherwise, false.
     * @memberof CronExpression
     * @private
     */ static #matchSchedule(value, sequence) {
        return sequence.some((element)=>element === value);
    }
    /**
     * Returns the minimum or maximum value from the given array of numbers.
     *
     * @param {number[]} values - An array of numbers.
     * @param {boolean} reverse - If true, returns the maximum value; otherwise, returns the minimum value.
     * @returns {number} - The minimum or maximum value.
     */ #getMinOrMax(values, reverse) {
        return values[reverse ? values.length - 1 : 0];
    }
    /**
     * Checks whether the given date falls on a DST transition day in its timezone.
     *
     * This is used to disable certain “direct set” fast paths on DST days, because setting the hour
     * directly may land on a non-existent or repeated local time. We cache the result per calendar day
     * to keep iteration overhead low.
     *
     * @param {CronDate} currentDate - Date to check (in the cron timezone)
     * @returns {boolean} True when the day has a DST transition
     * @private
     */ #checkDstTransition(currentDate) {
        // Cache per calendar day (in the cron date's timezone) to avoid repeated work inside the iteration loop.
        const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        if (this.#dstTransitionDayKey === key) {
            return this.#isDstTransitionDay;
        }
        const startOfDay = new CronDate_1.CronDate(currentDate);
        startOfDay.setStartOfDay();
        const endOfDay = new CronDate_1.CronDate(currentDate);
        endOfDay.setEndOfDay();
        this.#dstTransitionDayKey = key;
        this.#isDstTransitionDay = startOfDay.getUTCOffset() !== endOfDay.getUTCOffset();
        return this.#isDstTransitionDay;
    }
    /**
     * Moves the date to the next/previous allowed second value. If there is no remaining allowed second
     * within the current minute, rolls to the next/previous minute and resets seconds to the min/max allowed.
     *
     * @param {CronDate} currentDate - Mutable date being iterated
     * @param {DateMathOp} dateMathVerb - Add/Subtract depending on direction
     * @param {boolean} reverse - When true, iterating backwards
     * @private
     */ #moveToNextSecond(currentDate, dateMathVerb, reverse) {
        const seconds = this.#fields.second.values;
        const currentSecond = currentDate.getSeconds();
        const nextSecond = this.#fields.second.findNearestValue(currentSecond, reverse);
        if (nextSecond !== null) {
            currentDate.setSeconds(nextSecond);
            return;
        }
        // Roll over to the next/previous minute and start from the min/max allowed second.
        currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Minute, this.#fields.hour.values.length);
        currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
    }
    /**
     * Moves the date to the next/previous allowed minute value and resets seconds to the min/max allowed.
     * If there is no remaining allowed minute within the current hour, rolls to the next/previous hour and
     * resets minutes/seconds to their extrema.
     *
     * @param {CronDate} currentDate - Mutable date being iterated
     * @param {DateMathOp} dateMathVerb - Add/Subtract depending on direction
     * @param {boolean} reverse - When true, iterating backwards
     * @private
     */ #moveToNextMinute(currentDate, dateMathVerb, reverse) {
        const minutes = this.#fields.minute.values;
        const seconds = this.#fields.second.values;
        const currentMinute = currentDate.getMinutes();
        const nextMinute = this.#fields.minute.findNearestValue(currentMinute, reverse);
        if (nextMinute !== null) {
            currentDate.setMinutes(nextMinute);
            currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
            return;
        }
        // Roll over to the next/previous hour and start from the min/max allowed minute/second.
        currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Hour, this.#fields.hour.values.length);
        currentDate.setMinutes(this.#getMinOrMax(minutes, reverse));
        currentDate.setSeconds(this.#getMinOrMax(seconds, reverse));
    }
    /**
     * Determines if the current date matches the last specified weekday of the month.
     *
     * @param {Array<(number|string)>} expressions - An array of expressions containing weekdays and "L" for the last weekday.
     * @param {CronDate} currentDate - The current date object.
     * @returns {boolean} - True if the current date matches the last specified weekday of the month; otherwise, false.
     * @memberof CronExpression
     * @private
     */ static #isLastWeekdayOfMonthMatch(expressions, currentDate) {
        if (!currentDate.isLastWeekdayOfMonth()) {
            return false;
        }
        const day = currentDate.getDay();
        return expressions.some((expression)=>day === parseInt(expression.toString().charAt(0), 10) % 7);
    }
    /**
     * Determines if the current date matches the nth occurrence of a weekday in the month.
     *
     * @param {number} nthDay - The nth occurrence (1-5) from a `#` expression; values <= 0 mean no nth constraint.
     * @param {CronDate} currentDate - The current date object.
     * @returns {boolean} - True if there is no nth constraint, or the current date is the nth occurrence of its weekday; otherwise, false.
     * @memberof CronExpression
     * @private
     */ static #isNthWeekdayOfMonthMatch(nthDay, currentDate) {
        return nthDay <= 0 || Math.ceil(currentDate.getDate() / 7) === nthDay;
    }
    /**
     * Find the next scheduled date based on the cron expression.
     * @returns {CronDate} - The next scheduled date or an ES6 compatible iterator object.
     * @memberof CronExpression
     * @public
     */ next() {
        return this.#findSchedule();
    }
    /**
     * Find the previous scheduled date based on the cron expression.
     * @returns {CronDate} - The previous scheduled date or an ES6 compatible iterator object.
     * @memberof CronExpression
     * @public
     */ prev() {
        return this.#findSchedule(true);
    }
    /**
     * Check if there is a next scheduled date based on the current date and cron expression.
     * @returns {boolean} - Returns true if there is a next scheduled date, false otherwise.
     * @memberof CronExpression
     * @public
     */ hasNext() {
        const current = this.#currentDate;
        try {
            this.#findSchedule();
            return true;
        } catch  {
            return false;
        } finally{
            this.#currentDate = current;
        }
    }
    /**
     * Check if there is a previous scheduled date based on the current date and cron expression.
     * @returns {boolean} - Returns true if there is a previous scheduled date, false otherwise.
     * @memberof CronExpression
     * @public
     */ hasPrev() {
        const current = this.#currentDate;
        try {
            this.#findSchedule(true);
            return true;
        } catch  {
            return false;
        } finally{
            this.#currentDate = current;
        }
    }
    /**
     * Iterate over a specified number of steps and optionally execute a callback function for each step.
     * @param {number} steps - The number of steps to iterate. Positive value iterates forward, negative value iterates backward.
     * @returns {CronDate[]} - An array of iterator fields or CronDate objects.
     * @memberof CronExpression
     * @public
     */ take(limit) {
        const items = [];
        if (limit >= 0) {
            for(let i = 0; i < limit; i++){
                try {
                    items.push(this.next());
                } catch  {
                    return items;
                }
            }
        } else {
            for(let i = 0; i > limit; i--){
                try {
                    items.push(this.prev());
                } catch  {
                    return items;
                }
            }
        }
        return items;
    }
    /**
     * Reset the iterator to a new date or its initial date after applying the configured range.
     * @param {Date | CronDate} [newDate] - Optional new date to reset to. If not provided, it will reset to the initial date.
     * @memberof CronExpression
     * @public
     */ reset(newDate) {
        this.#currentDate = newDate ? new CronDate_1.CronDate(newDate, this.#tz) : this.#initialDate;
    }
    /**
     * Generate a string representation of the cron expression.
     * @param {boolean} [includeSeconds=false] - Whether to include the seconds field in the string representation.
     * @returns {string} - The string representation of the cron expression.
     * @memberof CronExpression
     * @public
     */ stringify(includeSeconds = false) {
        return this.#fields.stringify(includeSeconds);
    }
    /**
     * Check if the cron expression includes the given date
     * @param {Date|CronDate} date
     * @returns {boolean}
     */ includesDate(date) {
        const { second, minute, hour, month } = this.#fields;
        const dt = new CronDate_1.CronDate(date, this.#tz);
        // Check basic time fields first
        if (!second.values.includes(dt.getSeconds()) || !minute.values.includes(dt.getMinutes()) || !hour.values.includes(dt.getHours()) || !month.values.includes(dt.getMonth() + 1)) {
            return false;
        }
        // Check day of month and day of week using the same logic as #findSchedule
        if (!this.#matchDayOfMonth(dt)) {
            return false;
        }
        return true;
    }
    /**
     * Returns the string representation of the cron expression.
     * @returns {CronDate} - The next schedule date.
     */ toString() {
        /* istanbul ignore next - should be impossible under normal use to trigger the or branch */ return this.#options.expression || this.stringify(true);
    }
    /**
     * Determines if the given date matches the cron expression's day of month and day of week fields.
     *
     * The function checks the following rules:
     * Rule 1: If both "day of month" and "day of week" are restricted (not wildcard), then one or both must match the current day.
     * Rule 2: If "day of month" is restricted and "day of week" is not restricted, then "day of month" must match the current day.
     * Rule 3: If "day of month" is a wildcard, "day of week" is not a wildcard, and "day of week" matches the current day, then the match is accepted.
     * In all rules, a "day of week" match also honors an nth-occurrence (`#`) constraint (e.g. `5#3` = the 3rd Friday) and the last-weekday (`L`) form.
     * If none of the rules match, the match is rejected.
     *
     * @param {CronDate} currentDate - The current date to be evaluated against the cron expression.
     * @returns {boolean} Returns true if the current date matches the cron expression's day of month and day of week fields, otherwise false.
     * @memberof CronExpression
     * @private
     */ #matchDayOfMonth(currentDate) {
        // Check if day of month and day of week fields are wildcards or restricted (not wildcard).
        const isDayOfMonthWildcardMatch = this.#fields.dayOfMonth.isWildcard;
        const isRestrictedDayOfMonth = !isDayOfMonthWildcardMatch;
        const isDayOfWeekWildcardMatch = this.#fields.dayOfWeek.isWildcard;
        const isRestrictedDayOfWeek = !isDayOfWeekWildcardMatch;
        // Calculate if the current date matches the day of month and day of week fields.
        const matchedDOM = CronExpression.#matchSchedule(currentDate.getDate(), this.#fields.dayOfMonth.values) || this.#fields.dayOfMonth.hasLastChar && currentDate.isLastDayOfMonth();
        const nthDay = this.#fields.dayOfWeek.nthDay;
        const matchedDOW = CronExpression.#matchSchedule(currentDate.getDay(), this.#fields.dayOfWeek.values) && CronExpression.#isNthWeekdayOfMonthMatch(nthDay, currentDate) || this.#fields.dayOfWeek.hasLastChar && CronExpression.#isLastWeekdayOfMonthMatch(this.#fields.dayOfWeek.values, currentDate);
        // Rule 1: Both "day of month" and "day of week" are restricted; one or both must match the current day.
        if (isRestrictedDayOfMonth && isRestrictedDayOfWeek && (matchedDOM || matchedDOW)) {
            return true;
        }
        // Rule 2: "day of month" restricted and "day of week" not restricted; "day of month" must match the current day.
        if (matchedDOM && !isRestrictedDayOfWeek) {
            return true;
        }
        // Rule 3: "day of month" is a wildcard, "day of week" is not a wildcard, and "day of week" matches the current day.
        if (isDayOfMonthWildcardMatch && !isDayOfWeekWildcardMatch && matchedDOW) {
            return true;
        }
        // If none of the rules match, the match is rejected.
        return false;
    }
    /**
     * Determines if the current hour matches the cron expression.
     *
     * @param {CronDate} currentDate - The current date object.
     * @param {DateMathOp} dateMathVerb - The date math operation enumeration value.
     * @param {boolean} reverse - A flag indicating whether the matching should be done in reverse order.
     * @returns {boolean} - True if the current hour matches the cron expression; otherwise, false.
     */ #matchHour(currentDate, dateMathVerb, reverse) {
        const hourValues = this.#fields.hour.values;
        const hours = hourValues;
        const currentHour = currentDate.getHours();
        const isMatch = CronExpression.#matchSchedule(currentHour, hourValues);
        const isDstEnd = currentDate.dstEnd === currentHour;
        // DST start: accept the landing hour when a skipped hour was scheduled.
        // The walk is modular because a gap can wrap midnight, and confined to the
        // landing hour so it stops once the clock moves past the window.
        if (currentDate.dstStart !== null && currentDate.dstStartLandingHour === currentHour) {
            for(let skipped = currentDate.dstStart; skipped !== currentHour; skipped = (skipped + 1) % 24){
                if (CronExpression.#matchSchedule(skipped, hourValues)) {
                    return true;
                }
            }
        }
        // DST end: avoid returning the repeated hour twice when searching forward.
        if (isDstEnd && !reverse) {
            currentDate.dstEnd = null;
            currentDate.applyDateOperation(CronDate_1.DateMathOp.Add, CronDate_1.TimeUnit.Hour, hours.length);
            return false;
        }
        if (isMatch) {
            return true;
        }
        // Normal mismatch: if there's no remaining matching hour in this day, jump a whole day first
        // to avoid scanning hour-by-hour across the day boundary.
        currentDate.clearDstStart();
        const nextHour = this.#fields.hour.findNearestValue(currentHour, reverse);
        if (nextHour === null) {
            currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Day, hours.length);
            return false;
        }
        // Fast path: jump directly to the next/previous matching hour and reset lower units.
        //
        // On DST transition days, setting the hour directly can land on a non-existent/repeated local time,
        // which breaks the existing DST handling that relies on `applyDateOperation()` to set `dstStart/dstEnd`.
        // For those days, fall back to stepping hour-by-hour to preserve correctness.
        if (this.#checkDstTransition(currentDate)) {
            const steps = reverse ? currentHour - nextHour : nextHour - currentHour;
            for(let i = 0; i < steps; i++){
                currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Hour, hours.length);
                // Overshoot protection: a spring-forward step can jump 2 wall-clock hours.
                if (!reverse && currentDate.getHours() >= nextHour) break;
                if (reverse && currentDate.getHours() <= nextHour) break;
            }
        } else {
            currentDate.setHours(nextHour);
        }
        currentDate.setMinutes(this.#getMinOrMax(this.#fields.minute.values, reverse));
        currentDate.setSeconds(this.#getMinOrMax(this.#fields.second.values, reverse));
        return false;
    }
    /**
     * Validates the current date against the start and end dates of the cron expression.
     * If the current date is outside the specified time span, an error is thrown.
     *
     * @param currentDate {CronDate} - The current date to validate.
     * @throws {Error} If the current date is outside the specified time span.
     * @private
     */ #validateTimeSpan(currentDate) {
        if (!this.#startDate && !this.#endDate) {
            return;
        }
        const currentTime = currentDate.getTime();
        if (this.#startDate && currentTime < this.#startDate.getTime()) {
            throw new Error(exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE);
        }
        if (this.#endDate && currentTime > this.#endDate.getTime()) {
            throw new Error(exports.TIME_SPAN_OUT_OF_BOUNDS_ERROR_MESSAGE);
        }
    }
    /**
     * Finds the next or previous schedule based on the cron expression.
     *
     * @param {boolean} [reverse=false] - If true, finds the previous schedule; otherwise, finds the next schedule.
     * @returns {CronDate} - The next or previous schedule date.
     * @private
     */ #findSchedule(reverse = false) {
        const dateMathVerb = reverse ? CronDate_1.DateMathOp.Subtract : CronDate_1.DateMathOp.Add;
        const currentDate = new CronDate_1.CronDate(this.#currentDate);
        const startTimestamp = currentDate.getTime();
        if (currentDate.getMilliseconds() > 0) {
            currentDate.setMilliseconds(0);
            if (!reverse) {
                currentDate.applyDateOperation(CronDate_1.DateMathOp.Add, CronDate_1.TimeUnit.Second, this.#fields.hour.values.length);
            }
        }
        let stepCount = 0;
        while(++stepCount < LOOP_LIMIT){
            this.#validateTimeSpan(currentDate);
            if (!CronExpression.#matchSchedule(currentDate.getMonth() + 1, this.#fields.month.values)) {
                currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Month, this.#fields.hour.values.length);
                continue;
            }
            if (!this.#matchDayOfMonth(currentDate)) {
                currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Day, this.#fields.hour.values.length);
                continue;
            }
            if (!this.#matchHour(currentDate, dateMathVerb, reverse)) {
                continue;
            }
            if (!CronExpression.#matchSchedule(currentDate.getMinutes(), this.#fields.minute.values)) {
                this.#moveToNextMinute(currentDate, dateMathVerb, reverse);
                continue;
            }
            if (!CronExpression.#matchSchedule(currentDate.getSeconds(), this.#fields.second.values)) {
                this.#moveToNextSecond(currentDate, dateMathVerb, reverse);
                continue;
            }
            if (startTimestamp === currentDate.getTime()) {
                currentDate.applyDateOperation(dateMathVerb, CronDate_1.TimeUnit.Second, this.#fields.hour.values.length);
                continue;
            }
            break;
        }
        if (stepCount >= LOOP_LIMIT) {
            throw new Error(exports.LOOPS_LIMIT_EXCEEDED_ERROR_MESSAGE);
        }
        this.#currentDate = currentDate;
        return currentDate;
    }
    /**
     * Returns an iterator for iterating through future CronDate instances
     *
     * @name Symbol.iterator
     * @memberof CronExpression
     * @returns {Iterator<CronDate>} An iterator object for CronExpression that returns CronDate values.
     */ [Symbol.iterator]() {
        return {
            next: ()=>{
                try {
                    const schedule = this.#findSchedule();
                    return {
                        value: schedule,
                        done: false
                    };
                } catch  {
                    return {
                        value: undefined,
                        done: true
                    };
                }
            }
        };
    }
}
exports.CronExpression = CronExpression;
exports.default = CronExpression;
}),
"[project]/node_modules/cron-parser/dist/CronExpressionParser.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronExpressionParser = exports.DayOfWeek = exports.Months = exports.CronUnit = exports.PredefinedExpressions = void 0;
const CronFieldCollection_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronFieldCollection.js [app-rsc] (ecmascript)");
const CronExpression_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronExpression.js [app-rsc] (ecmascript)");
const random_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/utils/random.js [app-rsc] (ecmascript)");
const fields_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/index.js [app-rsc] (ecmascript)");
var PredefinedExpressions;
(function(PredefinedExpressions) {
    PredefinedExpressions["@yearly"] = "0 0 0 1 1 *";
    PredefinedExpressions["@annually"] = "0 0 0 1 1 *";
    PredefinedExpressions["@monthly"] = "0 0 0 1 * *";
    PredefinedExpressions["@weekly"] = "0 0 0 * * 0";
    PredefinedExpressions["@daily"] = "0 0 0 * * *";
    PredefinedExpressions["@hourly"] = "0 0 * * * *";
    PredefinedExpressions["@minutely"] = "0 * * * * *";
    PredefinedExpressions["@secondly"] = "* * * * * *";
    PredefinedExpressions["@weekdays"] = "0 0 0 * * 1-5";
    PredefinedExpressions["@weekends"] = "0 0 0 * * 0,6";
})(PredefinedExpressions || (exports.PredefinedExpressions = PredefinedExpressions = {}));
var CronUnit;
(function(CronUnit) {
    CronUnit["Second"] = "Second";
    CronUnit["Minute"] = "Minute";
    CronUnit["Hour"] = "Hour";
    CronUnit["DayOfMonth"] = "DayOfMonth";
    CronUnit["Month"] = "Month";
    CronUnit["DayOfWeek"] = "DayOfWeek";
})(CronUnit || (exports.CronUnit = CronUnit = {}));
// these need to be lowercase for the parser to work
var Months;
(function(Months) {
    Months[Months["jan"] = 1] = "jan";
    Months[Months["feb"] = 2] = "feb";
    Months[Months["mar"] = 3] = "mar";
    Months[Months["apr"] = 4] = "apr";
    Months[Months["may"] = 5] = "may";
    Months[Months["jun"] = 6] = "jun";
    Months[Months["jul"] = 7] = "jul";
    Months[Months["aug"] = 8] = "aug";
    Months[Months["sep"] = 9] = "sep";
    Months[Months["oct"] = 10] = "oct";
    Months[Months["nov"] = 11] = "nov";
    Months[Months["dec"] = 12] = "dec";
})(Months || (exports.Months = Months = {}));
// these need to be lowercase for the parser to work
var DayOfWeek;
(function(DayOfWeek) {
    DayOfWeek[DayOfWeek["sun"] = 0] = "sun";
    DayOfWeek[DayOfWeek["mon"] = 1] = "mon";
    DayOfWeek[DayOfWeek["tue"] = 2] = "tue";
    DayOfWeek[DayOfWeek["wed"] = 3] = "wed";
    DayOfWeek[DayOfWeek["thu"] = 4] = "thu";
    DayOfWeek[DayOfWeek["fri"] = 5] = "fri";
    DayOfWeek[DayOfWeek["sat"] = 6] = "sat";
})(DayOfWeek || (exports.DayOfWeek = DayOfWeek = {}));
/**
 * Static class that parses a cron expression and returns a CronExpression object.
 * @static
 * @class CronExpressionParser
 */ /**
 * Upper bound on the number of values a single field may expand to.
 * No field can hold this many distinct values, so exceeding it always means the list repeats values.
 */ const MAX_FIELD_VALUES = 256;
/**
 * Upper bound on the length of a cron expression.
 * Listing every value of every field needs about half of this, so a longer expression is never meaningful.
 */ const MAX_EXPRESSION_LENGTH = 1024;
class CronExpressionParser {
    /**
     * Parses a cron expression and returns a CronExpression object.
     * @param {string} expression - The cron expression to parse.
     * @param {CronExpressionOptions} [options={}] - The options to use when parsing the expression.
     * @param {boolean} [options.strict=false] - If true, will throw an error if the expression contains both dayOfMonth and dayOfWeek, or a hashed range or step the field cannot satisfy.
     * @param {CronDate} [options.currentDate=new CronDate(undefined, 'UTC')] - The date to use when calculating the next/previous occurrence.
     *
     * @returns {CronExpression} A CronExpression object.
     */ static parse(expression, options = {}) {
        const { strict = false, hashSeed } = options;
        const rand = (0, random_1.seededRandom)(hashSeed);
        if (Object.hasOwn(PredefinedExpressions, expression)) {
            expression = PredefinedExpressions[expression];
        }
        const rawFields = CronExpressionParser.#getRawFields(expression, strict);
        if (!(rawFields.dayOfMonth === '*' || rawFields.dayOfWeek === '*' || !strict)) {
            throw new Error('Cannot use both dayOfMonth and dayOfWeek together in strict mode!');
        }
        const second = CronExpressionParser.#parseField(CronUnit.Second, rawFields.second, fields_1.CronSecond.constraints, rand, strict);
        const minute = CronExpressionParser.#parseField(CronUnit.Minute, rawFields.minute, fields_1.CronMinute.constraints, rand, strict);
        const hour = CronExpressionParser.#parseField(CronUnit.Hour, rawFields.hour, fields_1.CronHour.constraints, rand, strict);
        const month = CronExpressionParser.#parseField(CronUnit.Month, rawFields.month, fields_1.CronMonth.constraints, rand, strict);
        const dayOfMonth = CronExpressionParser.#parseField(CronUnit.DayOfMonth, rawFields.dayOfMonth, fields_1.CronDayOfMonth.constraints, rand, strict);
        const { dayOfWeek: _dayOfWeek, nthDayOfWeek } = CronExpressionParser.#parseNthDay(rawFields.dayOfWeek);
        const dayOfWeek = CronExpressionParser.#parseField(CronUnit.DayOfWeek, _dayOfWeek, fields_1.CronDayOfWeek.constraints, rand, strict);
        const fields = new CronFieldCollection_1.CronFieldCollection({
            second: new fields_1.CronSecond(second, {
                rawValue: rawFields.second
            }),
            minute: new fields_1.CronMinute(minute, {
                rawValue: rawFields.minute
            }),
            hour: new fields_1.CronHour(hour, {
                rawValue: rawFields.hour
            }),
            dayOfMonth: fields_1.CronDayOfMonth.fromMonth(month, dayOfMonth, {
                rawValue: rawFields.dayOfMonth
            }),
            month: new fields_1.CronMonth(month, {
                rawValue: rawFields.month
            }),
            dayOfWeek: new fields_1.CronDayOfWeek(dayOfWeek, {
                rawValue: rawFields.dayOfWeek,
                nthDayOfWeek
            })
        });
        return new CronExpression_1.CronExpression(fields, {
            ...options,
            expression
        });
    }
    /**
     * Get the raw fields from a cron expression.
     * @param {string} expression - The cron expression to parse.
     * @param {boolean} strict - If true, will throw an error if the expression contains both dayOfMonth and dayOfWeek.
     * @private
     * @returns {RawCronFields} The raw fields.
     */ static #getRawFields(expression, strict) {
        if (strict && !expression.length) {
            throw new Error('Invalid cron expression');
        }
        expression = expression || '0 * * * * *';
        if (expression.length > MAX_EXPRESSION_LENGTH) {
            throw new Error(`Invalid cron expression, too long, expected at most ${MAX_EXPRESSION_LENGTH} characters`);
        }
        const atoms = expression.trim().split(/\s+/);
        if (strict && atoms.length < 6) {
            throw new Error('Invalid cron expression, expected 6 fields');
        }
        if (atoms.length > 6) {
            throw new Error('Invalid cron expression, too many fields');
        }
        const defaults = [
            '0',
            '*',
            '*',
            '*',
            '*',
            '*'
        ];
        if (atoms.length < defaults.length) {
            atoms.unshift(...defaults.slice(0, defaults.length - atoms.length));
        }
        const [second, minute, hour, dayOfMonth, month, dayOfWeek] = atoms;
        return {
            second,
            minute,
            hour,
            dayOfMonth,
            month,
            dayOfWeek
        };
    }
    /**
     * Parse a field from a cron expression.
     * @param {CronUnit} field - The field to parse.
     * @param {string} value - The value of the field.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @param {PRNG} rand - The random number generator to use.
     * @param {boolean} strict - If true, will throw an error on an unusable hashed range or step.
     * @private
     * @returns {(number | string)[]} The parsed field.
     */ static #parseField(field, value, constraints, rand, strict) {
        // Replace aliases for month and dayOfWeek
        if (field === CronUnit.Month || field === CronUnit.DayOfWeek) {
            const aliases = field === CronUnit.Month ? Months : DayOfWeek;
            value = value.replace(/[a-z]{3}/gi, (match)=>{
                match = match.toLowerCase();
                const replacer = aliases[match];
                if (replacer === undefined) {
                    throw new Error(`Validation error, cannot resolve alias "${match}"`);
                }
                return replacer.toString();
            });
        }
        // Check for valid characters
        if (!constraints.validChars.test(value)) {
            throw new Error(`Invalid characters, got value: ${value}`);
        }
        value = this.#parseWildcard(value, constraints);
        value = this.#parseHashed(value, constraints, rand, field, strict);
        return this.#parseSequence(field, value, constraints);
    }
    /**
     * Parse a wildcard from a cron expression.
     * @param {string} value - The value to parse.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @private
     */ static #parseWildcard(value, constraints) {
        return value.replace(/[*?]/g, constraints.min + '-' + constraints.max);
    }
    /**
     * Parse a hashed value from a cron expression.
     * @param {string} value - The value to parse.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @param {PRNG} rand - The random number generator to use.
     * @param {CronUnit} field - The field being parsed, used when reporting an unusable range or step.
     * @param {boolean} strict - If true, will throw an error on an unusable hashed range or step.
     * @private
     */ static #parseHashed(value, constraints, rand, field, strict) {
        const randomValue = rand();
        let count = 0;
        return value.replace(/H(?:\((\d+)-(\d+)\))?(?:\/(\d+))?/g, (_, min, max, step)=>{
            // H(range)/step
            if (min && max && step) {
                const minNum = parseInt(min, 10);
                const maxNum = parseInt(max, 10);
                const stepNum = parseInt(step, 10);
                if (stepNum <= 0) {
                    throw new Error(`Invalid step: ${stepNum}, must be positive`);
                }
                const range = CronExpressionParser.#hashedRange(minNum, maxNum, constraints, field, strict);
                count += Math.ceil((range.max - range.min + 1) / stepNum);
                CronExpressionParser.#assertMaxFieldValues(field, count);
                return CronExpressionParser.#hashedStep(randomValue, range.min, range.max, stepNum, field, strict);
            } else if (min && max) {
                const minNum = parseInt(min, 10);
                const maxNum = parseInt(max, 10);
                const range = CronExpressionParser.#hashedRange(minNum, maxNum, constraints, field, strict);
                return String(CronExpressionParser.#hashedValue(randomValue, range.min, range.max));
            } else if (step) {
                const stepNum = parseInt(step, 10);
                // Validate step
                if (stepNum <= 0) {
                    throw new Error(`Invalid step: ${stepNum}, must be positive`);
                }
                count += Math.ceil((constraints.max - constraints.min + 1) / stepNum);
                CronExpressionParser.#assertMaxFieldValues(field, count);
                return CronExpressionParser.#hashedStep(randomValue, constraints.min, constraints.max, stepNum, field, strict);
            } else {
                return String(CronExpressionParser.#hashedValue(randomValue, constraints.min, constraints.max));
            }
        });
    }
    /**
     * Pick a single hashed value within an inclusive range.
     * @param {number} randomValue - The seeded random value in [0, 1).
     * @param {number} min - Lowest value that may be picked.
     * @param {number} max - Highest value that may be picked.
     * @private
     */ static #hashedValue(randomValue, min, max) {
        return Math.floor(randomValue * (max - min + 1)) + min;
    }
    /**
     * Name a field the way the expression object does, rather than the Pascal case of CronUnit.
     * @param {CronUnit} field - The field to name.
     * @private
     */ static #fieldName(field) {
        return field.charAt(0).toLowerCase() + field.slice(1);
    }
    /**
     * Narrow an explicit hashed range to the values the field can hold, so that values are only
     * ever drawn from the range a step is measured against. In strict mode a bound outside the
     * field constraints is rejected instead of clamped, which keeps the range reported in the
     * error the one that was written.
     * @param {number} min - Lowest value the expression asks for.
     * @param {number} max - Highest value the expression asks for.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @param {CronUnit} field - The field being parsed, used when reporting an unusable range.
     * @param {boolean} strict - If true, will throw an error on a range outside the constraints.
     * @private
     */ static #hashedRange(min, max, constraints, field, strict) {
        if (min > max) {
            throw new Error(`Invalid range: ${min}-${max}, min > max`);
        }
        if (strict && (min < constraints.min || max > constraints.max)) {
            throw new Error(`Invalid range: ${min}-${max}, outside the ${constraints.min}-${constraints.max} range of the ${CronExpressionParser.#fieldName(field)} field`);
        }
        const rangeMin = Math.max(min, constraints.min);
        const rangeMax = Math.min(max, constraints.max);
        if (rangeMin > rangeMax) {
            throw new Error(`Invalid range: ${min}-${max}, no usable value in the ${CronExpressionParser.#fieldName(field)} field`);
        }
        return {
            min: rangeMin,
            max: rangeMax
        };
    }
    /**
     * Build the hashed values of a stepped range, offset from the start of the step by the seeded
     * jitter. A step wider than the range leaves no step-aligned value inside it, so a single
     * hashed occurrence within the range is used instead of an empty field, or in strict mode the
     * expression is rejected as unsatisfiable.
     * @param {number} randomValue - The seeded random value in [0, 1).
     * @param {number} min - Lowest value the range allows.
     * @param {number} max - Highest value the range allows.
     * @param {number} step - The step between values, already validated as positive.
     * @param {CronUnit} field - The field being parsed, used when reporting an unusable step.
     * @param {boolean} strict - If true, will throw an error on a step wider than its range.
     * @private
     */ static #hashedStep(randomValue, min, max, step, field, strict) {
        if (strict && step > max - min + 1) {
            throw new Error(`Invalid step: ${step}, wider than the ${min}-${max} range of the ${CronExpressionParser.#fieldName(field)} field`);
        }
        const offset = Math.floor(randomValue * step);
        const values = [];
        for(let i = Math.floor(min / step) * step + offset; i <= max; i += step){
            if (i >= min) {
                values.push(i);
            }
        }
        if (values.length === 0) {
            return String(CronExpressionParser.#hashedValue(randomValue, min, max));
        }
        return values.join(',');
    }
    /**
     * Throw once a field has expanded to more than MAX_FIELD_VALUES values.
     * @param {CronUnit} field - The field being parsed.
     * @param {number} count - The number of values collected so far.
     * @private
     */ static #assertMaxFieldValues(field, count) {
        if (count > MAX_FIELD_VALUES) {
            throw new Error(`Constraint error, too many values in ${field} field, expected at most ${MAX_FIELD_VALUES}`);
        }
    }
    /**
     * Parse a sequence from a cron expression.
     * @param {CronUnit} field - The field to parse.
     * @param {string} val - The sequence to parse.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @private
     */ static #parseSequence(field, val, constraints) {
        const stack = [];
        function handleResult(result, constraints) {
            if (Array.isArray(result)) {
                stack.push(...result);
            } else {
                if (CronExpressionParser.#isValidConstraintChar(constraints, result)) {
                    stack.push(result);
                } else {
                    const v = parseInt(result.toString(), 10);
                    const isValid = v >= constraints.min && v <= constraints.max;
                    if (!isValid) {
                        throw new Error(`Constraint error, got value ${result} expected range ${constraints.min}-${constraints.max}`);
                    }
                    stack.push(field === CronUnit.DayOfWeek ? v % 7 : result);
                }
            }
        }
        const atoms = val.split(',');
        for (const atom of atoms){
            CronExpressionParser.#assertMaxFieldValues(field, stack.length);
            if (!(atom.length > 0)) {
                throw new Error('Invalid list value format');
            }
            handleResult(CronExpressionParser.#parseRepeat(field, atom, constraints), constraints);
        }
        return stack;
    }
    /**
     * Parse repeat from a cron expression.
     * @param {CronUnit} field - The field to parse.
     * @param {string} val - The repeat to parse.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @private
     * @returns {(number | string)[]} The parsed repeat.
     */ static #parseRepeat(field, val, constraints) {
        const atoms = val.split('/');
        if (atoms.length > 2) {
            throw new Error(`Invalid repeat: ${val}`);
        }
        if (atoms.length === 2) {
            if (!atoms[0].includes('-')) {
                atoms[0] = `${atoms[0]}-${constraints.max}`;
            }
            return CronExpressionParser.#parseRange(field, atoms[0], parseInt(atoms[1], 10), constraints);
        }
        return CronExpressionParser.#parseRange(field, val, 1, constraints);
    }
    /**
     * Validate a cron range.
     * @param {number} min - The minimum value of the range.
     * @param {number} max - The maximum value of the range.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @private
     * @returns {void}
     * @throws {Error} Throws an error if the range is invalid.
     */ static #validateRange(min, max, constraints) {
        const isValid = !isNaN(min) && !isNaN(max) && min >= constraints.min && max <= constraints.max;
        if (!isValid) {
            throw new Error(`Constraint error, got range ${min}-${max} expected range ${constraints.min}-${constraints.max}`);
        }
        if (min > max) {
            throw new Error(`Invalid range: ${min}-${max}, min(${min}) > max(${max})`);
        }
    }
    /**
     * Validate a cron repeat interval.
     * @param {number} repeatInterval - The repeat interval to validate.
     * @private
     * @returns {void}
     * @throws {Error} Throws an error if the repeat interval is invalid.
     */ static #validateRepeatInterval(repeatInterval) {
        if (!(!isNaN(repeatInterval) && repeatInterval > 0)) {
            throw new Error(`Constraint error, cannot repeat at every ${repeatInterval} time.`);
        }
    }
    /**
     * Create a range from a cron expression.
     * @param {CronUnit} field - The field to parse.
     * @param {number} min - The minimum value of the range.
     * @param {number} max - The maximum value of the range.
     * @param {number} repeatInterval - The repeat interval of the range.
     * @private
     * @returns {number[]} The created range.
     */ static #createRange(field, min, max, repeatInterval) {
        const stack = [];
        if (field === CronUnit.DayOfWeek && max % 7 === 0 && (max - min) % repeatInterval === 0) {
            stack.push(0);
        }
        for(let index = min; index <= max; index += repeatInterval){
            if (stack.indexOf(index) === -1) {
                stack.push(index);
            }
        }
        return stack;
    }
    /**
     * Parse a range from a cron expression.
     * @param {CronUnit} field - The field to parse.
     * @param {string} val - The range to parse.
     * @param {number} repeatInterval - The repeat interval of the range.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @private
     * @returns {number[] | string[] | number | string} The parsed range.
     */ static #parseRange(field, val, repeatInterval, constraints) {
        const atoms = val.split('-');
        if (atoms.length <= 1) {
            return isNaN(+val) ? val : +val;
        }
        if (atoms.length > 2) {
            throw new Error(`Invalid range: ${val}`);
        }
        const [min, max] = atoms.map((num)=>parseInt(num, 10));
        this.#validateRange(min, max, constraints);
        this.#validateRepeatInterval(repeatInterval);
        // Create range
        return this.#createRange(field, min, max, repeatInterval);
    }
    /**
     * Parse a cron expression.
     * @param {string} val - The cron expression to parse.
     * @private
     * @returns {string} The parsed cron expression.
     */ static #parseNthDay(val) {
        const atoms = val.split('#');
        if (atoms.length <= 1) {
            return {
                dayOfWeek: atoms[0]
            };
        }
        const nthValue = +atoms[atoms.length - 1];
        const matches = val.match(/([,\-/])/);
        if (matches !== null) {
            throw new Error(`Constraint error, invalid dayOfWeek \`#\` and \`${matches?.[0]}\` special characters are incompatible`);
        }
        if (!(atoms.length <= 2 && !isNaN(nthValue) && nthValue >= 1 && nthValue <= 5)) {
            throw new Error('Constraint error, invalid dayOfWeek occurrence number (#)');
        }
        return {
            dayOfWeek: atoms[0],
            nthDayOfWeek: nthValue
        };
    }
    /**
     * Checks if a character is valid for a field.
     * @param {CronConstraints} constraints - The constraints for the field.
     * @param {string | number} value - The value to check.
     * @private
     * @returns {boolean} Whether the character is valid for the field.
     */ static #isValidConstraintChar(constraints, value) {
        return constraints.chars.some((char)=>value.toString().includes(char));
    }
}
exports.CronExpressionParser = CronExpressionParser;
}),
"[project]/node_modules/cron-parser/dist/CronFieldCollection.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronFieldCollection = void 0;
const fields_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/index.js [app-rsc] (ecmascript)");
/**
 * Represents a complete set of cron fields.
 * @class CronFieldCollection
 */ class CronFieldCollection {
    #second;
    #minute;
    #hour;
    #dayOfMonth;
    #month;
    #dayOfWeek;
    /**
     * Creates a new CronFieldCollection instance by partially overriding fields from an existing one.
     * @param {CronFieldCollection} base - The base CronFieldCollection to copy fields from
     * @param {CronFieldOverride} fields - The fields to override, can be CronField instances or raw values
     * @returns {CronFieldCollection} A new CronFieldCollection instance
     * @example
     * const base = new CronFieldCollection({
     *   second: new CronSecond([0]),
     *   minute: new CronMinute([0]),
     *   hour: new CronHour([12]),
     *   dayOfMonth: new CronDayOfMonth([1]),
     *   month: new CronMonth([1]),
     *   dayOfWeek: new CronDayOfWeek([1])
     * });
     *
     * // Using CronField instances
     * const modified1 = CronFieldCollection.from(base, {
     *   hour: new CronHour([15]),
     *   minute: new CronMinute([30])
     * });
     *
     * // Using raw values
     * const modified2 = CronFieldCollection.from(base, {
     *   hour: [15],        // Will create new CronHour
     *   minute: [30]       // Will create new CronMinute
     * });
     */ static from(base, fields) {
        return new CronFieldCollection({
            second: this.resolveField(fields_1.CronSecond, base.second, fields.second),
            minute: this.resolveField(fields_1.CronMinute, base.minute, fields.minute),
            hour: this.resolveField(fields_1.CronHour, base.hour, fields.hour),
            dayOfMonth: this.resolveField(fields_1.CronDayOfMonth, base.dayOfMonth, fields.dayOfMonth),
            month: this.resolveField(fields_1.CronMonth, base.month, fields.month),
            dayOfWeek: this.resolveField(fields_1.CronDayOfWeek, base.dayOfWeek, fields.dayOfWeek)
        });
    }
    /**
     * Resolves a field value, either using the provided CronField instance or creating a new one from raw values.
     * @param constructor - The constructor for creating new field instances
     * @param baseField - The base field to use if no override is provided
     * @param fieldValue - The override value, either a CronField instance or raw values
     * @returns The resolved CronField instance
     * @private
     */ static resolveField(constructor, baseField, fieldValue) {
        if (!fieldValue) {
            return baseField;
        }
        if (fieldValue instanceof fields_1.CronField) {
            return fieldValue;
        }
        return new constructor(fieldValue);
    }
    /**
     * CronFieldCollection constructor. Initializes the cron fields with the provided values.
     * @param {CronFields} param0 - The cron fields values
     * @throws {Error} if validation fails
     * @example
     * const cronFields = new CronFieldCollection({
     *   second: new CronSecond([0]),
     *   minute: new CronMinute([0, 30]),
     *   hour: new CronHour([9]),
     *   dayOfMonth: new CronDayOfMonth([15]),
     *   month: new CronMonth([1]),
     *   dayOfWeek: new CronDayOfTheWeek([1, 2, 3, 4, 5]),
     * })
     *
     * console.log(cronFields.second.values); // [0]
     * console.log(cronFields.minute.values); // [0, 30]
     * console.log(cronFields.hour.values); // [9]
     * console.log(cronFields.dayOfMonth.values); // [15]
     * console.log(cronFields.month.values); // [1]
     * console.log(cronFields.dayOfWeek.values); // [1, 2, 3, 4, 5]
     */ constructor({ second, minute, hour, dayOfMonth, month, dayOfWeek }){
        if (!second) {
            throw new Error('Validation error, Field second is missing');
        }
        if (!minute) {
            throw new Error('Validation error, Field minute is missing');
        }
        if (!hour) {
            throw new Error('Validation error, Field hour is missing');
        }
        if (!dayOfMonth) {
            throw new Error('Validation error, Field dayOfMonth is missing');
        }
        if (!month) {
            throw new Error('Validation error, Field month is missing');
        }
        if (!dayOfWeek) {
            throw new Error('Validation error, Field dayOfWeek is missing');
        }
        // Only an explicit day of month that can never occur is invalid. When the
        // day of week is restricted it rescues the expression (day of month and day
        // of week combine with OR), so the day of month need not be reachable.
        if (month.values.length === 1 && !dayOfMonth.hasLastChar && dayOfWeek.isWildcard) {
            if (!(parseInt(dayOfMonth.values[0], 10) <= fields_1.CronMonth.daysInMonth[month.values[0] - 1])) {
                throw new Error('Invalid explicit day of month definition');
            }
        }
        this.#second = second;
        this.#minute = minute;
        this.#hour = hour;
        this.#month = month;
        this.#dayOfWeek = dayOfWeek;
        this.#dayOfMonth = dayOfMonth;
    }
    /**
     * Returns the second field.
     * @returns {CronSecond}
     */ get second() {
        return this.#second;
    }
    /**
     * Returns the minute field.
     * @returns {CronMinute}
     */ get minute() {
        return this.#minute;
    }
    /**
     * Returns the hour field.
     * @returns {CronHour}
     */ get hour() {
        return this.#hour;
    }
    /**
     * Returns the day of the month field.
     * @returns {CronDayOfMonth}
     */ get dayOfMonth() {
        return this.#dayOfMonth;
    }
    /**
     * Returns the month field.
     * @returns {CronMonth}
     */ get month() {
        return this.#month;
    }
    /**
     * Returns the day of the week field.
     * @returns {CronDayOfWeek}
     */ get dayOfWeek() {
        return this.#dayOfWeek;
    }
    /**
     * Returns a string representation of the cron fields.
     * @param {(number | CronChars)[]} input - The cron fields values
     * @static
     * @returns {FieldRange[]} - The compacted cron fields
     */ static compactField(input) {
        if (input.length === 0) {
            return [];
        }
        // Initialize the output array and current IFieldRange
        const output = [];
        let current = undefined;
        input.forEach((item, i, arr)=>{
            // If the current FieldRange is undefined, create a new one with the current item as the start.
            if (current === undefined) {
                current = {
                    start: item,
                    count: 1
                };
                return;
            }
            // Cache the previous and next items in the array.
            const prevItem = arr[i - 1] || current.start;
            const nextItem = arr[i + 1];
            // If the current item is 'L' or 'W', push the current FieldRange to the output and
            // create a new FieldRange with the current item as the start.
            // 'L' and 'W' characters are special cases that need to be handled separately.
            if (item === 'L' || item === 'W') {
                output.push(current);
                output.push({
                    start: item,
                    count: 1
                });
                current = undefined;
                return;
            }
            // If the current step is undefined and there is a next item, update the current IFieldRange.
            // This block checks if the current step needs to be updated and does so if needed.
            if (current.step === undefined && nextItem !== undefined) {
                const step = item - prevItem;
                const nextStep = nextItem - item;
                // If the current step is less or equal to the next step, update the current FieldRange to include the current item.
                if (step <= nextStep) {
                    current = {
                        ...current,
                        count: 2,
                        end: item,
                        step
                    };
                    return;
                }
                current.step = 1;
            }
            // If the difference between the current item and the current end is equal to the current step,
            // update the current IFieldRange's count and end.
            // This block checks if the current item is part of the current range and updates the range accordingly.
            if (item - (current.end ?? 0) === current.step) {
                current.count++;
                current.end = item;
            } else {
                // If the count is 1, push a new FieldRange with the current start.
                // This handles the case where the current range has only one element.
                if (current.count === 1) {
                    // If the count is 2, push two separate IFieldRanges, one for each element.
                    output.push({
                        start: current.start,
                        count: 1
                    });
                } else if (current.count === 2) {
                    output.push({
                        start: current.start,
                        count: 1
                    });
                    // current.end can never be undefined here but typescript doesn't know that
                    // this is why we ?? it and then ignore the prevItem in the coverage
                    output.push({
                        start: current.end ?? /* istanbul ignore next - see above */ prevItem,
                        count: 1
                    });
                } else {
                    // Otherwise, push the current FieldRange to the output.
                    output.push(current);
                }
                // Reset the current FieldRange with the current item as the start.
                current = {
                    start: item,
                    count: 1
                };
            }
        });
        // Push the final IFieldRange, if any, to the output array.
        if (current) {
            output.push(current);
        }
        return output;
    }
    /**
     * Handles a single range.
     * @param {CronField} field - The cron field to stringify
     * @param {FieldRange} range {start: number, end: number, step: number, count: number} The range to handle.
     * @param {number} max The maximum value for the field.
     * @returns {string | null} The stringified range or null if it cannot be stringified.
     * @private
     */ static #handleSingleRange(field, range, max) {
        const step = range.step;
        if (!step) {
            return null;
        }
        if (step === 1 && range.start === field.min && range.end && range.end >= max) {
            const isDayField = field instanceof fields_1.CronDayOfMonth || field instanceof fields_1.CronDayOfWeek;
            if (isDayField && !field.isWildcard) {
                return null;
            }
            return field.hasQuestionMarkChar ? '?' : '*';
        }
        if (step !== 1 && range.start === field.min && range.end && range.end >= max - step + 1) {
            return `*/${step}`;
        }
        return null;
    }
    /**
     * Handles multiple ranges.
     * @param {FieldRange} range {start: number, end: number, step: number, count: number} The range to handle.
     * @returns {string} The stringified range.
     * @private
     */ static #handleMultipleRanges(range) {
        const step = range.step;
        if (step === 1) {
            return `${range.start}-${range.end}`;
        }
        const multiplier = range.start === 0 ? range.count - 1 : range.count;
        /* istanbul ignore if */ if (!step) {
            throw new Error('Unexpected range step');
        }
        /* istanbul ignore if */ if (!range.end) {
            throw new Error('Unexpected range end');
        }
        if (step * multiplier > range.end) {
            const mapFn = (_, index)=>{
                /* istanbul ignore if */ if (typeof range.start !== 'number') {
                    throw new Error('Unexpected range start');
                }
                return index % step === 0 ? range.start + index : null;
            };
            /* istanbul ignore if */ if (typeof range.start !== 'number') {
                throw new Error('Unexpected range start');
            }
            const seed = {
                length: range.end - range.start + 1
            };
            return Array.from(seed, mapFn).filter((value)=>value !== null).join(',');
        }
        return `${range.start}-${range.end}/${step}`;
    }
    /**
     * Returns a string representation of the cron fields.
     * @param {CronField} field - The cron field to stringify
     * @static
     * @returns {string} - The stringified cron field
     */ stringifyField(field) {
        let max = field.max;
        let values = field.values;
        if (field instanceof fields_1.CronDayOfWeek) {
            max = 6;
            const dayOfWeek = this.#dayOfWeek.values;
            values = dayOfWeek[dayOfWeek.length - 1] === 7 ? dayOfWeek.slice(0, -1) : dayOfWeek;
        }
        if (field instanceof fields_1.CronDayOfMonth) {
            max = this.#month.values.length === 1 ? fields_1.CronMonth.daysInMonth[this.#month.values[0] - 1] : field.max;
        }
        const ranges = CronFieldCollection.compactField(values);
        if (ranges.length === 1) {
            const singleRangeResult = CronFieldCollection.#handleSingleRange(field, ranges[0], max);
            if (singleRangeResult) {
                return singleRangeResult;
            }
        }
        return ranges.map((range)=>{
            const value = range.count === 1 ? range.start.toString() : CronFieldCollection.#handleMultipleRanges(range);
            if (field instanceof fields_1.CronDayOfWeek && field.nthDay > 0) {
                return `${value}#${field.nthDay}`;
            }
            return value;
        }).join(',');
    }
    /**
     * Returns a string representation of the cron field values.
     * @param {boolean} includeSeconds - Whether to include seconds in the output
     * @returns {string} The formatted cron string
     */ stringify(includeSeconds = false) {
        const arr = [];
        if (includeSeconds) {
            arr.push(this.stringifyField(this.#second)); // second
        }
        arr.push(this.stringifyField(this.#minute), this.stringifyField(this.#hour), this.stringifyField(this.#dayOfMonth), this.stringifyField(this.#month), this.stringifyField(this.#dayOfWeek));
        return arr.join(' ');
    }
    /**
     * Returns a serialized representation of the cron fields values.
     * @returns {SerializedCronFields} An object containing the cron field values
     */ serialize() {
        return {
            second: this.#second.serialize(),
            minute: this.#minute.serialize(),
            hour: this.#hour.serialize(),
            dayOfMonth: this.#dayOfMonth.serialize(),
            month: this.#month.serialize(),
            dayOfWeek: this.#dayOfWeek.serialize()
        };
    }
}
exports.CronFieldCollection = CronFieldCollection;
}),
"[project]/node_modules/cron-parser/dist/CronFileParser.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronFileParser = void 0;
const CronExpressionParser_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronExpressionParser.js [app-rsc] (ecmascript)");
/**
 * Parser for crontab files that handles both synchronous and asynchronous operations.
 */ class CronFileParser {
    /**
     * Parse a crontab file asynchronously
     * @param filePath Path to crontab file
     * @returns Promise resolving to parse results
     * @throws If file cannot be read
     */ static async parseFile(filePath) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { readFile } = __turbopack_context__.r("[externals]/fs/promises [external] (fs/promises, cjs)");
        const data = await readFile(filePath, 'utf8');
        return CronFileParser.#parseContent(data);
    }
    /**
     * Parse a crontab file synchronously
     * @param filePath Path to crontab file
     * @returns Parse results
     * @throws If file cannot be read
     */ static parseFileSync(filePath) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { readFileSync } = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
        const data = readFileSync(filePath, 'utf8');
        return CronFileParser.#parseContent(data);
    }
    /**
     * Internal method to parse crontab file content
     * @private
     */ static #parseContent(data) {
        const blocks = data.split('\n');
        const result = {
            variables: {},
            expressions: [],
            errors: {}
        };
        for (const block of blocks){
            const entry = block.trim();
            if (entry.length === 0 || entry.startsWith('#')) {
                continue;
            }
            // A variable line is `NAME=value` (spaces around the `=` are allowed). The name has no whitespace, so a
            // schedule whose command contains an `=` is still treated as an entry, and the value keeps any later `=`.
            const variableMatch = entry.match(/^([^\s=]+)\s*=\s*(.*)$/);
            if (variableMatch) {
                const [, key, value] = variableMatch;
                // Define an own property so that a key such as `__proto__` cannot replace the prototype
                Object.defineProperty(result.variables, key, {
                    value: value.replace(/^(["'])(.*)\1$/, '$2'),
                    enumerable: true,
                    writable: true,
                    configurable: true
                });
                continue;
            }
            try {
                const parsedEntry = CronFileParser.#parseEntry(entry);
                result.expressions.push(parsedEntry.interval);
            } catch (err) {
                Object.defineProperty(result.errors, entry, {
                    value: err,
                    enumerable: true,
                    writable: true,
                    configurable: true
                });
            }
        }
        return result;
    }
    /**
     * Parse a single crontab entry
     * @private
     */ static #parseEntry(entry) {
        const atoms = entry.split(/\s+/);
        // A nickname such as `@daily` is the whole schedule, so the command starts right after it.
        const scheduleLength = atoms[0].startsWith('@') ? 1 : 5;
        return {
            interval: CronExpressionParser_1.CronExpressionParser.parse(atoms.slice(0, scheduleLength).join(' ')),
            command: atoms.slice(scheduleLength, atoms.length)
        };
    }
}
exports.CronFileParser = CronFileParser;
}),
"[project]/node_modules/cron-parser/dist/fields/CronDayOfMonth.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronDayOfMonth = void 0;
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const CronMonth_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronMonth.js [app-rsc] (ecmascript)");
const MIN_DAY = 1;
const MAX_DAY = 31;
const DAY_CHARS = Object.freeze([
    'L'
]);
/**
 * Represents the "day of the month" field within a cron expression.
 * @class CronDayOfMonth
 * @extends CronField
 */ class CronDayOfMonth extends CronField_1.CronField {
    /**
     * Creates a "day of the month" field limited to the days the given month has.
     * @param {MonthRange[]} month - Values for the "month" field the days are used with
     * @param {DayOfMonthRange[]} values - Values for the "day of the month" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     * @returns {CronDayOfMonth}
     */ static fromMonth(month, values, options) {
        if (month.length !== 1) {
            return new CronDayOfMonth(values, options);
        }
        const daysInMonth = CronMonth_1.CronMonth.daysInMonth[month[0] - 1];
        const days = values.filter((value)=>typeof value !== 'number' || value <= daysInMonth);
        return new CronDayOfMonth(days.length > 0 ? days : values, options);
    }
    static get min() {
        return MIN_DAY;
    }
    static get max() {
        return MAX_DAY;
    }
    static get chars() {
        return DAY_CHARS;
    }
    static get validChars() {
        return /^[?,*\dLH/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
    }
    /**
     * CronDayOfMonth constructor. Initializes the "day of the month" field with the provided values.
     * @param {DayOfMonthRange[]} values - Values for the "day of the month" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     * @throws {Error} if validation fails
     */ constructor(values, options){
        super(values, options);
        this.validate();
    }
    /**
     * Returns an array of allowed values for the "day of the month" field.
     * @returns {DayOfMonthRange[]}
     */ get values() {
        return super.values;
    }
}
exports.CronDayOfMonth = CronDayOfMonth;
}),
"[project]/node_modules/cron-parser/dist/fields/CronDayOfWeek.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronDayOfWeek = void 0;
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const MIN_DAY = 0;
const MAX_DAY = 7;
const DAY_CHARS = Object.freeze([
    'L'
]);
/**
 * Represents the "day of the week" field within a cron expression.
 * @class CronDayOfTheWeek
 * @extends CronField
 */ class CronDayOfWeek extends CronField_1.CronField {
    static get min() {
        return MIN_DAY;
    }
    static get max() {
        return MAX_DAY;
    }
    static get chars() {
        return DAY_CHARS;
    }
    static get validChars() {
        return /^[?,*\dLH#/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
    }
    /**
     * CronDayOfTheWeek constructor. Initializes the "day of the week" field with the provided values.
     * @param {DayOfWeekRange[]} values - Values for the "day of the week" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     */ constructor(values, options){
        super(values, options);
        this.validate();
        if (this.values.some((value)=>value === 'L')) {
            throw new Error(`${this.constructor.name} Validation error, unexpected standalone L`);
        }
    }
    /**
     * Returns an array of allowed values for the "day of the week" field.
     * @returns {DayOfWeekRange[]}
     */ get values() {
        return super.values;
    }
    /**
     * Returns the nth day of the week if specified in the cron expression.
     * This is used for the '#' character in the cron expression.
     * @returns {number} The nth day of the week (1-5) or 0 if not specified.
     */ get nthDay() {
        return this.options.nthDayOfWeek ?? 0;
    }
}
exports.CronDayOfWeek = CronDayOfWeek;
}),
"[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronField = void 0;
/**
 * Represents a field within a cron expression.
 * This is a base class and should not be instantiated directly.
 * @class CronField
 */ class CronField {
    #hasLastChar = false;
    #hasQuestionMarkChar = false;
    #wildcard = false;
    #values = [];
    options = {
        rawValue: ''
    };
    /**
     * Returns the minimum value allowed for this field.
     */ /* istanbul ignore next */ static get min() {
        /* istanbul ignore next */ throw new Error('min must be overridden');
    }
    /**
     * Returns the maximum value allowed for this field.
     */ /* istanbul ignore next */ static get max() {
        /* istanbul ignore next */ throw new Error('max must be overridden');
    }
    /**
     * Returns the allowed characters for this field.
     */ /* istanbul ignore next */ static get chars() {
        /* istanbul ignore next - this is overridden */ return Object.freeze([]);
    }
    /**
     * Returns the regular expression used to validate this field.
     */ static get validChars() {
        return /^[?,*\dH/-]+$|^.*H\(\d+-\d+\)\/\d+.*$|^.*H\(\d+-\d+\).*$|^.*H\/\d+.*$/;
    }
    /**
     * Returns the constraints for this field.
     */ static get constraints() {
        return {
            min: this.min,
            max: this.max,
            chars: this.chars,
            validChars: this.validChars
        };
    }
    /**
     * CronField constructor. Initializes the field with the provided values.
     * @param {number[] | string[]} values - Values for this field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     * @throws {TypeError} if the constructor is called directly
     * @throws {Error} if validation fails
     */ constructor(values, options = {
        rawValue: ''
    }){
        if (!Array.isArray(values)) {
            throw new Error(`${this.constructor.name} Validation error, values is not an array`);
        }
        if (!(values.length > 0)) {
            throw new Error(`${this.constructor.name} Validation error, values contains no values`);
        }
        /* istanbul ignore next */ this.options = {
            ...options,
            rawValue: options.rawValue ?? ''
        };
        this.#values = [
            ...values
        ].sort(CronField.sorter);
        this.#wildcard = this.options.wildcard !== undefined ? this.options.wildcard : this.#isWildcardValue();
        this.#hasLastChar = this.options.rawValue.includes('L') || values.includes('L');
        this.#hasQuestionMarkChar = this.options.rawValue.includes('?') || values.includes('?');
    }
    /**
     * Returns the minimum value allowed for this field.
     * @returns {number}
     */ get min() {
        // return the static value from the child class
        return this.constructor.min;
    }
    /**
     * Returns the maximum value allowed for this field.
     * @returns {number}
     */ get max() {
        // return the static value from the child class
        return this.constructor.max;
    }
    /**
     * Returns an array of allowed special characters for this field.
     * @returns {string[]}
     */ get chars() {
        // return the frozen static value from the child class
        return this.constructor.chars;
    }
    /**
     * Indicates whether this field has a "last" character.
     * @returns {boolean}
     */ get hasLastChar() {
        return this.#hasLastChar;
    }
    /**
     * Indicates whether this field has a "question mark" character.
     * @returns {boolean}
     */ get hasQuestionMarkChar() {
        return this.#hasQuestionMarkChar;
    }
    /**
     * Indicates whether this field is a wildcard.
     * @returns {boolean}
     */ get isWildcard() {
        return this.#wildcard;
    }
    /**
     * Returns an array of allowed values for this field.
     * @returns {CronFieldType}
     */ get values() {
        return this.#values;
    }
    /**
     * Helper function to sort values in ascending order.
     * @param {number | string} a - First value to compare
     * @param {number | string} b - Second value to compare
     * @returns {number} - A negative, zero, or positive value, depending on the sort order
     */ static sorter(a, b) {
        const aIsNumber = typeof a === 'number';
        const bIsNumber = typeof b === 'number';
        if (aIsNumber && bIsNumber) return a - b;
        if (!aIsNumber && !bIsNumber) return a.localeCompare(b);
        return aIsNumber ? /* istanbul ignore next - A will always be a number until L-2 is supported */ -1 : 1;
    }
    /**
     * Find the next (or previous when `reverse` is true) numeric value in a sorted list.
     * Returns null if there's no value strictly after/before the current one.
     *
     * @param values - Sorted numeric values
     * @param currentValue - Current value to compare against
     * @param reverse - When true, search in reverse for previous smaller value
     */ static findNearestValueInList(values, currentValue, reverse) {
        if (reverse) {
            for(let i = values.length - 1; i >= 0; i--){
                if (values[i] < currentValue) return values[i];
            }
            return null;
        }
        for(let i = 0; i < values.length; i++){
            if (values[i] > currentValue) return values[i];
        }
        return null;
    }
    /**
     * Instance helper that operates on this field's numeric `values`.
     *
     * @param currentValue - Current value to compare against
     * @param reverse - When true, search in reverse for previous smaller value
     */ findNearestValue(currentValue, reverse) {
        return this.constructor.findNearestValueInList(this.values, currentValue, reverse);
    }
    /**
     * Serializes the field to an object.
     * @returns {SerializedCronField}
     */ serialize() {
        return {
            wildcard: this.#wildcard,
            values: this.#values
        };
    }
    /**
     * Validates the field values against the allowed range and special characters.
     * @throws {Error} if validation fails
     */ validate() {
        let badValue;
        const charsString = this.chars.length > 0 ? ` or chars ${this.chars.join('')}` : '';
        const charTest = (value)=>(char)=>new RegExp(`^\\d{0,2}${char}$`).test(value);
        const rangeTest = (value)=>{
            badValue = value;
            return typeof value === 'number' ? value >= this.min && value <= this.max : this.chars.some(charTest(value));
        };
        const isValidRange = this.#values.every(rangeTest);
        if (!isValidRange) {
            throw new Error(`${this.constructor.name} Validation error, got value ${badValue} expected range ${this.min}-${this.max}${charsString}`);
        }
        // check for duplicate value in this.#values array
        const duplicate = this.#values.find((value, index)=>this.#values.indexOf(value) !== index);
        if (duplicate !== undefined) {
            throw new Error(`${this.constructor.name} Validation error, duplicate values found: ${duplicate}`);
        }
    }
    /**
     * Determines if the field is a wildcard based on the values.
     * When options.rawValue is not empty, it checks if the raw value is a wildcard, otherwise it checks if all values in the range are included.
     * @returns {boolean}
     */ #isWildcardValue() {
        if (this.options.rawValue.length > 0) {
            return [
                '*',
                '?'
            ].includes(this.options.rawValue);
        }
        return Array.from({
            length: this.max - this.min + 1
        }, (_, i)=>i + this.min).every((value)=>this.#values.includes(value));
    }
}
exports.CronField = CronField;
}),
"[project]/node_modules/cron-parser/dist/fields/CronHour.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronHour = void 0;
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const MIN_HOUR = 0;
const MAX_HOUR = 23;
const HOUR_CHARS = Object.freeze([]);
/**
 * Represents the "hour" field within a cron expression.
 * @class CronHour
 * @extends CronField
 */ class CronHour extends CronField_1.CronField {
    static get min() {
        return MIN_HOUR;
    }
    static get max() {
        return MAX_HOUR;
    }
    static get chars() {
        return HOUR_CHARS;
    }
    /**
     * CronHour constructor. Initializes the "hour" field with the provided values.
     * @param {HourRange[]} values - Values for the "hour" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     */ constructor(values, options){
        super(values, options);
        this.validate();
    }
    /**
     * Returns an array of allowed values for the "hour" field.
     * @returns {HourRange[]}
     */ get values() {
        return super.values;
    }
}
exports.CronHour = CronHour;
}),
"[project]/node_modules/cron-parser/dist/fields/CronMinute.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronMinute = void 0;
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const MIN_MINUTE = 0;
const MAX_MINUTE = 59;
const MINUTE_CHARS = Object.freeze([]);
/**
 * Represents the "second" field within a cron expression.
 * @class CronSecond
 * @extends CronField
 */ class CronMinute extends CronField_1.CronField {
    static get min() {
        return MIN_MINUTE;
    }
    static get max() {
        return MAX_MINUTE;
    }
    static get chars() {
        return MINUTE_CHARS;
    }
    /**
     * CronSecond constructor. Initializes the "second" field with the provided values.
     * @param {SixtyRange[]} values - Values for the "second" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     */ constructor(values, options){
        super(values, options);
        this.validate();
    }
    /**
     * Returns an array of allowed values for the "second" field.
     * @returns {SixtyRange[]}
     */ get values() {
        return super.values;
    }
}
exports.CronMinute = CronMinute;
}),
"[project]/node_modules/cron-parser/dist/fields/CronMonth.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronMonth = void 0;
const CronDate_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronDate.js [app-rsc] (ecmascript)");
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MONTH_CHARS = Object.freeze([]);
/**
 * Represents the "day of the month" field within a cron expression.
 * @class CronDayOfMonth
 * @extends CronField
 */ class CronMonth extends CronField_1.CronField {
    static get min() {
        return MIN_MONTH;
    }
    static get max() {
        return MAX_MONTH;
    }
    static get chars() {
        return MONTH_CHARS;
    }
    static get daysInMonth() {
        return CronDate_1.DAYS_IN_MONTH;
    }
    /**
     * CronDayOfMonth constructor. Initializes the "day of the month" field with the provided values.
     * @param {MonthRange[]} values - Values for the "day of the month" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     */ constructor(values, options){
        super(values, options);
        this.validate();
    }
    /**
     * Returns an array of allowed values for the "day of the month" field.
     * @returns {MonthRange[]}
     */ get values() {
        return super.values;
    }
}
exports.CronMonth = CronMonth;
}),
"[project]/node_modules/cron-parser/dist/fields/CronSecond.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronSecond = void 0;
const CronField_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)");
const MIN_SECOND = 0;
const MAX_SECOND = 59;
const SECOND_CHARS = Object.freeze([]);
/**
 * Represents the "second" field within a cron expression.
 * @class CronSecond
 * @extends CronField
 */ class CronSecond extends CronField_1.CronField {
    static get min() {
        return MIN_SECOND;
    }
    static get max() {
        return MAX_SECOND;
    }
    static get chars() {
        return SECOND_CHARS;
    }
    /**
     * CronSecond constructor. Initializes the "second" field with the provided values.
     * @param {SixtyRange[]} values - Values for the "second" field
     * @param {CronFieldOptions} [options] - Options provided by the parser
     */ constructor(values, options){
        super(values, options);
        this.validate();
    }
    /**
     * Returns an array of allowed values for the "second" field.
     * @returns {SixtyRange[]}
     */ get values() {
        return super.values;
    }
}
exports.CronSecond = CronSecond;
}),
"[project]/node_modules/cron-parser/dist/fields/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/types.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronDayOfMonth.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronDayOfWeek.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronField.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronHour.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronMinute.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronMonth.js [app-rsc] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/CronSecond.js [app-rsc] (ecmascript)"), exports);
}),
"[project]/node_modules/cron-parser/dist/fields/types.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
}),
"[project]/node_modules/cron-parser/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CronFileParser = exports.CronExpressionParser = exports.CronExpression = exports.CronFieldCollection = exports.CronDate = void 0;
/* istanbul ignore file */ const CronExpressionParser_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronExpressionParser.js [app-rsc] (ecmascript)");
var CronDate_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronDate.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "CronDate", {
    enumerable: true,
    get: function() {
        return CronDate_1.CronDate;
    }
});
var CronFieldCollection_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronFieldCollection.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "CronFieldCollection", {
    enumerable: true,
    get: function() {
        return CronFieldCollection_1.CronFieldCollection;
    }
});
var CronExpression_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronExpression.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "CronExpression", {
    enumerable: true,
    get: function() {
        return CronExpression_1.CronExpression;
    }
});
var CronExpressionParser_2 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronExpressionParser.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "CronExpressionParser", {
    enumerable: true,
    get: function() {
        return CronExpressionParser_2.CronExpressionParser;
    }
});
var CronFileParser_1 = __turbopack_context__.r("[project]/node_modules/cron-parser/dist/CronFileParser.js [app-rsc] (ecmascript)");
Object.defineProperty(exports, "CronFileParser", {
    enumerable: true,
    get: function() {
        return CronFileParser_1.CronFileParser;
    }
});
__exportStar(__turbopack_context__.r("[project]/node_modules/cron-parser/dist/fields/index.js [app-rsc] (ecmascript)"), exports);
exports.default = CronExpressionParser_1.CronExpressionParser;
}),
"[project]/node_modules/cron-parser/dist/utils/random.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.seededRandom = seededRandom;
/**
 * Computes a numeric hash from a given string
 * @param {string} str A value to hash
 * @returns {number} A numeric hash computed from the given value
 */ function xfnv1a(str) {
    let h = 2166136261 >>> 0;
    for(let i = 0; i < str.length; i++){
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return ()=>h >>> 0;
}
/**
 * Initialize a new PRNG using a given seed
 * @param {number} seed The seed used to initialize the PRNG
 * @returns {PRNG} A random number generator
 */ function mulberry32(seed) {
    return ()=>{
        let t = seed += 0x6d2b79f5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
/**
 * Generates a PRNG using a given seed. When not provided, the seed is randomly generated
 * @param {string} str A string to derive the seed from
 * @returns {PRNG} A random number generator correctly seeded
 */ function seededRandom(str) {
    const seed = str ? xfnv1a(str)() : Math.floor(Math.random() * 10_000_000_000);
    return mulberry32(seed);
}
}),
"[project]/node_modules/css-select/lib/esm/attributes.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "attributeRules",
    ()=>attributeRules
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
;
/**
 * All reserved characters in a regex, used for escaping.
 *
 * Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
 * https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
 */ const reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
function escapeRegex(value) {
    return value.replace(reChars, "\\$&");
}
/**
 * Attributes that are case-insensitive in HTML.
 *
 * @private
 * @see https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors
 */ const caseInsensitiveAttributes = new Set([
    "accept",
    "accept-charset",
    "align",
    "alink",
    "axis",
    "bgcolor",
    "charset",
    "checked",
    "clear",
    "codetype",
    "color",
    "compact",
    "declare",
    "defer",
    "dir",
    "direction",
    "disabled",
    "enctype",
    "face",
    "frame",
    "hreflang",
    "http-equiv",
    "lang",
    "language",
    "link",
    "media",
    "method",
    "multiple",
    "nohref",
    "noresize",
    "noshade",
    "nowrap",
    "readonly",
    "rel",
    "rev",
    "rules",
    "scope",
    "scrolling",
    "selected",
    "shape",
    "target",
    "text",
    "type",
    "valign",
    "valuetype",
    "vlink"
]);
function shouldIgnoreCase(selector, options) {
    return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
}
const attributeRules = {
    equals (next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();
            return (elem)=>{
                const attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
            };
        }
        return (elem)=>adapter.getAttributeValue(elem, name) === value && next(elem);
    },
    hyphen (next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const len = value.length;
        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();
            return function hyphenIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
            };
        }
        return function hyphen(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
        };
    },
    element (next, data, options) {
        const { adapter } = options;
        const { name, value } = data;
        if (/\s/.test(value)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        }
        const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
        return function element(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
        };
    },
    exists (next, { name }, { adapter }) {
        return (elem)=>adapter.hasAttrib(elem, name) && next(elem);
    },
    start (next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const len = value.length;
        if (len === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        }
        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();
            return (elem)=>{
                const attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
            };
        }
        return (elem)=>{
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.startsWith(value)) && next(elem);
        };
    },
    end (next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const len = -value.length;
        if (len === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        }
        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();
            return (elem)=>{
                var _a;
                return ((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.substr(len).toLowerCase()) === value && next(elem);
            };
        }
        return (elem)=>{
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.endsWith(value)) && next(elem);
        };
    },
    any (next, data, options) {
        const { adapter } = options;
        const { name, value } = data;
        if (value === "") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        }
        if (shouldIgnoreCase(data, options)) {
            const regex = new RegExp(escapeRegex(value), "i");
            return function anyIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
            };
        }
        return (elem)=>{
            var _a;
            return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.includes(value)) && next(elem);
        };
    },
    not (next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        if (value === "") {
            return (elem)=>!!adapter.getAttributeValue(elem, name) && next(elem);
        } else if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();
            return (elem)=>{
                const attr = adapter.getAttributeValue(elem, name);
                return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
            };
        }
        return (elem)=>adapter.getAttributeValue(elem, name) !== value && next(elem);
    }
};
}),
"[project]/node_modules/css-select/lib/esm/compile.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compile",
    ()=>compile,
    "compileToken",
    ()=>compileToken,
    "compileUnsafe",
    ()=>compileUnsafe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/sort.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$general$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/general.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/subselects.js [app-rsc] (ecmascript)");
;
;
;
;
;
function compile(selector, options, context) {
    const next = compileUnsafe(selector, options, context);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureIsTag"])(next, options.adapter);
}
function compileUnsafe(selector, options, context) {
    const token = typeof selector === "string" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(selector) : selector;
    return compileToken(token, options, context);
}
function includesScopePseudo(t) {
    return t.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data)=>data.some(includesScopePseudo)));
}
const DESCENDANT_TOKEN = {
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant
};
const FLEXIBLE_DESCENDANT_TOKEN = {
    type: "_flexibleDescendant"
};
const SCOPE_TOKEN = {
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo,
    name: "scope",
    data: null
};
/*
 * CSS 4 Spec (Draft): 3.4.1. Absolutizing a Relative Selector
 * http://www.w3.org/TR/selectors4/#absolutizing
 */ function absolutize(token, { adapter }, context) {
    // TODO Use better check if the context is a document
    const hasContext = !!(context === null || context === void 0 ? void 0 : context.every((e)=>{
        const parent = adapter.isTag(e) && adapter.getParent(e);
        return e === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PLACEHOLDER_ELEMENT"] || parent && adapter.isTag(parent);
    }));
    for (const t of token){
        if (t.length > 0 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"])(t[0]) && t[0].type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant) {
        // Don't continue in else branch
        } else if (hasContext && !t.some(includesScopePseudo)) {
            t.unshift(DESCENDANT_TOKEN);
        } else {
            continue;
        }
        t.unshift(SCOPE_TOKEN);
    }
}
function compileToken(token, options, context) {
    var _a;
    token.forEach(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]);
    context = (_a = options.context) !== null && _a !== void 0 ? _a : context;
    const isArrayContext = Array.isArray(context);
    const finalContext = context && (Array.isArray(context) ? context : [
        context
    ]);
    // Check if the selector is relative
    if (options.relativeSelector !== false) {
        absolutize(token, options, finalContext);
    } else if (token.some((t)=>t.length > 0 && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"])(t[0]))) {
        throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
    }
    let shouldTestNextSiblings = false;
    const query = token.map((rules)=>{
        if (rules.length >= 2) {
            const [first, second] = rules;
            if (first.type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo || first.name !== "scope") {
            // Ignore
            } else if (isArrayContext && second.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant) {
                rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
            } else if (second.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Adjacent || second.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Sibling) {
                shouldTestNextSiblings = true;
            }
        }
        return compileRules(rules, options, finalContext);
    }).reduce(reduceRules, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc);
    query.shouldTestNextSiblings = shouldTestNextSiblings;
    return query;
}
function compileRules(rules, options, context) {
    var _a;
    return rules.reduce((previous, rule)=>previous === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$general$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compileGeneralSelector"])(previous, rule, options, context, compileToken), (_a = options.rootFunc) !== null && _a !== void 0 ? _a : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc);
}
function reduceRules(a, b) {
    if (b === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc || a === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) {
        return a;
    }
    if (a === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc || b === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) {
        return b;
    }
    return function combine(elem) {
        return a(elem) || b(elem);
    };
}
}),
"[project]/node_modules/css-select/lib/esm/general.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileGeneralSelector",
    ()=>compileGeneralSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$attributes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/attributes.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)");
;
;
;
function getElementParent(node, adapter) {
    const parent = adapter.getParent(node);
    if (parent && adapter.isTag(parent)) {
        return parent;
    }
    return null;
}
function compileGeneralSelector(next, selector, options, context, compileToken) {
    const { adapter, equals } = options;
    switch(selector.type){
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].PseudoElement:
            {
                throw new Error("Pseudo-elements are not supported by css-select");
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].ColumnCombinator:
            {
                throw new Error("Column combinators are not yet supported by css-select");
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Attribute:
            {
                if (selector.namespace != null) {
                    throw new Error("Namespaced attributes are not yet supported by css-select");
                }
                if (!options.xmlMode || options.lowerCaseAttributeNames) {
                    selector.name = selector.name.toLowerCase();
                }
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$attributes$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attributeRules"][selector.action](next, selector, options);
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo:
            {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["compilePseudoSelector"])(next, selector, options, context, compileToken);
            }
        // Tags
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Tag:
            {
                if (selector.namespace != null) {
                    throw new Error("Namespaced tag names are not yet supported by css-select");
                }
                let { name } = selector;
                if (!options.xmlMode || options.lowerCaseTags) {
                    name = name.toLowerCase();
                }
                return function tag(elem) {
                    return adapter.getName(elem) === name && next(elem);
                };
            }
        // Traversal
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant:
            {
                if (options.cacheResults === false || typeof WeakSet === "undefined") {
                    return function descendant(elem) {
                        let current = elem;
                        while(current = getElementParent(current, adapter)){
                            if (next(current)) {
                                return true;
                            }
                        }
                        return false;
                    };
                }
                // @ts-expect-error `ElementNode` is not extending object
                const isFalseCache = new WeakSet();
                return function cachedDescendant(elem) {
                    let current = elem;
                    while(current = getElementParent(current, adapter)){
                        if (!isFalseCache.has(current)) {
                            if (adapter.isTag(current) && next(current)) {
                                return true;
                            }
                            isFalseCache.add(current);
                        }
                    }
                    return false;
                };
            }
        case "_flexibleDescendant":
            {
                // Include element itself, only used while querying an array
                return function flexibleDescendant(elem) {
                    let current = elem;
                    do {
                        if (next(current)) return true;
                    }while (current = getElementParent(current, adapter))
                    return false;
                };
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Parent:
            {
                return function parent(elem) {
                    return adapter.getChildren(elem).some((elem)=>adapter.isTag(elem) && next(elem));
                };
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Child:
            {
                return function child(elem) {
                    const parent = adapter.getParent(elem);
                    return parent != null && adapter.isTag(parent) && next(parent);
                };
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Sibling:
            {
                return function sibling(elem) {
                    const siblings = adapter.getSiblings(elem);
                    for(let i = 0; i < siblings.length; i++){
                        const currentSibling = siblings[i];
                        if (equals(elem, currentSibling)) break;
                        if (adapter.isTag(currentSibling) && next(currentSibling)) {
                            return true;
                        }
                    }
                    return false;
                };
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Adjacent:
            {
                if (adapter.prevElementSibling) {
                    return function adjacent(elem) {
                        const previous = adapter.prevElementSibling(elem);
                        return previous != null && next(previous);
                    };
                }
                return function adjacent(elem) {
                    const siblings = adapter.getSiblings(elem);
                    let lastElement;
                    for(let i = 0; i < siblings.length; i++){
                        const currentSibling = siblings[i];
                        if (equals(elem, currentSibling)) break;
                        if (adapter.isTag(currentSibling)) {
                            lastElement = currentSibling;
                        }
                    }
                    return !!lastElement && next(lastElement);
                };
            }
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Universal:
            {
                if (selector.namespace != null && selector.namespace !== "*") {
                    throw new Error("Namespaced universal selectors are not yet supported by css-select");
                }
                return next;
            }
    }
}
}),
"[project]/node_modules/css-select/lib/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_compileToken",
    ()=>_compileToken,
    "_compileUnsafe",
    ()=>_compileUnsafe,
    "compile",
    ()=>compile,
    "default",
    ()=>__TURBOPACK__default__export__,
    "is",
    ()=>is,
    "prepareContext",
    ()=>prepareContext,
    "selectAll",
    ()=>selectAll,
    "selectOne",
    ()=>selectOne
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/compile.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/subselects.js [app-rsc] (ecmascript)");
// Export filters, pseudos and aliases to allow users to supply their own.
/** @deprecated Use the `pseudos` option instead. */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/index.js [app-rsc] (ecmascript) <locals>");
;
;
;
;
const defaultEquals = (a, b)=>a === b;
const defaultOptions = {
    adapter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    equals: defaultEquals
};
function convertOptionFormats(options) {
    var _a, _b, _c, _d;
    /*
     * We force one format of options to the other one.
     */ // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    const opts = options !== null && options !== void 0 ? options : defaultOptions;
    // @ts-expect-error Same as above.
    (_a = opts.adapter) !== null && _a !== void 0 ? _a : opts.adapter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__;
    // @ts-expect-error `equals` does not exist on `Options`
    (_b = opts.equals) !== null && _b !== void 0 ? _b : opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals;
    return opts;
}
function wrapCompile(func) {
    return function addAdapter(selector, options, context) {
        const opts = convertOptionFormats(options);
        return func(selector, opts, context);
    };
}
const compile = wrapCompile(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compile"]);
const _compileUnsafe = wrapCompile(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compileUnsafe"]);
const _compileToken = wrapCompile(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compileToken"]);
function getSelectorFunc(searchFunc) {
    return function select(query, elements, options) {
        const opts = convertOptionFormats(options);
        if (typeof query !== "function") {
            query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compileUnsafe"])(query, opts, elements);
        }
        const filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
        return searchFunc(query, filteredElements, opts);
    };
}
function prepareContext(elems, adapter, shouldTestNextSiblings = false) {
    /*
     * Add siblings if the query requires them.
     * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
     */ if (shouldTestNextSiblings) {
        elems = appendNextSiblings(elems, adapter);
    }
    return Array.isArray(elems) ? adapter.removeSubsets(elems) : adapter.getChildren(elems);
}
function appendNextSiblings(elem, adapter) {
    // Order matters because jQuery seems to check the children before the siblings
    const elems = Array.isArray(elem) ? elem.slice(0) : [
        elem
    ];
    const elemsLength = elems.length;
    for(let i = 0; i < elemsLength; i++){
        const nextSiblings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNextSiblings"])(elems[i], adapter);
        elems.push(...nextSiblings);
    }
    return elems;
}
const selectAll = getSelectorFunc((query, elems, options)=>query === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query, elems));
const selectOne = getSelectorFunc((query, elems, options)=>query === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query, elems));
function is(elem, query, options) {
    const opts = convertOptionFormats(options);
    return (typeof query === "function" ? query : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compile"])(query, opts))(elem);
}
const __TURBOPACK__default__export__ = selectAll;
;
}),
"[project]/node_modules/css-select/lib/esm/pseudo-selectors/aliases.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Aliases are pseudos that are expressed as selectors.
 */ __turbopack_context__.s([
    "aliases",
    ()=>aliases
]);
const aliases = {
    // Links
    "any-link": ":is(a, area, link)[href]",
    link: ":any-link:not(:visited)",
    // Forms
    // https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
    enabled: ":not(:disabled)",
    checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",
    required: ":is(input, select, textarea)[required]",
    optional: ":is(input, select, textarea):not([required])",
    // JQuery extensions
    // https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-selectedness
    selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
    checkbox: "[type=checkbox]",
    file: "[type=file]",
    password: "[type=password]",
    radio: "[type=radio]",
    reset: "[type=reset]",
    image: "[type=image]",
    submit: "[type=submit]",
    parent: ":not(:empty)",
    header: ":is(h1, h2, h3, h4, h5, h6)",
    button: ":is(button, input[type=button])",
    input: ":is(input, textarea, select, button)",
    text: "input:is(:not([type!='']), [type=text])"
};
}),
"[project]/node_modules/css-select/lib/esm/pseudo-selectors/filters.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "filters",
    ()=>filters
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/nth-check/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
;
;
function getChildFunc(next, adapter) {
    return (elem)=>{
        const parent = adapter.getParent(elem);
        return parent != null && adapter.isTag(parent) && next(elem);
    };
}
const filters = {
    contains (next, text, { adapter }) {
        return function contains(elem) {
            return next(elem) && adapter.getText(elem).includes(text);
        };
    },
    icontains (next, text, { adapter }) {
        const itext = text.toLowerCase();
        return function icontains(elem) {
            return next(elem) && adapter.getText(elem).toLowerCase().includes(itext);
        };
    },
    // Location specific methods
    "nth-child" (next, rule, { adapter, equals }) {
        const func = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(rule);
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) return getChildFunc(next, adapter);
        return function nthChild(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;
            for(let i = 0; i < siblings.length; i++){
                if (equals(elem, siblings[i])) break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-child" (next, rule, { adapter, equals }) {
        const func = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(rule);
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) return getChildFunc(next, adapter);
        return function nthLastChild(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;
            for(let i = siblings.length - 1; i >= 0; i--){
                if (equals(elem, siblings[i])) break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-of-type" (next, rule, { adapter, equals }) {
        const func = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(rule);
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) return getChildFunc(next, adapter);
        return function nthOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;
            for(let i = 0; i < siblings.length; i++){
                const currentSibling = siblings[i];
                if (equals(elem, currentSibling)) break;
                if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type" (next, rule, { adapter, equals }) {
        const func = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(rule);
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        if (func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) return getChildFunc(next, adapter);
        return function nthLastOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;
            for(let i = siblings.length - 1; i >= 0; i--){
                const currentSibling = siblings[i];
                if (equals(elem, currentSibling)) break;
                if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) {
                    pos++;
                }
            }
            return func(pos) && next(elem);
        };
    },
    // TODO determine the actual root element
    root (next, _rule, { adapter }) {
        return (elem)=>{
            const parent = adapter.getParent(elem);
            return (parent == null || !adapter.isTag(parent)) && next(elem);
        };
    },
    scope (next, rule, options, context) {
        const { equals } = options;
        if (!context || context.length === 0) {
            // Equivalent to :root
            return filters["root"](next, rule, options);
        }
        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return (elem)=>equals(context[0], elem) && next(elem);
        }
        return (elem)=>context.includes(elem) && next(elem);
    },
    hover: dynamicStatePseudo("isHovered"),
    visited: dynamicStatePseudo("isVisited"),
    active: dynamicStatePseudo("isActive")
};
/**
 * Dynamic state pseudos. These depend on optional Adapter methods.
 *
 * @param name The name of the adapter method to call.
 * @returns Pseudo for the `filters` object.
 */ function dynamicStatePseudo(name) {
    return function dynamicPseudo(next, _rule, { adapter }) {
        const func = adapter[name];
        if (typeof func !== "function") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        }
        return function active(elem) {
            return func(elem) && next(elem);
        };
    };
}
}),
"[project]/node_modules/css-select/lib/esm/pseudo-selectors/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compilePseudoSelector",
    ()=>compilePseudoSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$filters$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/filters.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$pseudos$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/pseudos.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$aliases$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/aliases.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/pseudo-selectors/subselects.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
function compilePseudoSelector(next, selector, options, context, compileToken) {
    var _a;
    const { name, data } = selector;
    if (Array.isArray(data)) {
        if (!(name in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["subselects"])) {
            throw new Error(`Unknown pseudo-class :${name}(${data})`);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["subselects"][name](next, data, options, context, compileToken);
    }
    const userPseudo = (_a = options.pseudos) === null || _a === void 0 ? void 0 : _a[name];
    const stringPseudo = typeof userPseudo === "string" ? userPseudo : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$aliases$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["aliases"][name];
    if (typeof stringPseudo === "string") {
        if (data != null) {
            throw new Error(`Pseudo ${name} doesn't have any arguments`);
        }
        // The alias has to be parsed here, to make sure options are respected.
        const alias = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(stringPseudo);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$subselects$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["subselects"]["is"](next, alias, options, context, compileToken);
    }
    if (typeof userPseudo === "function") {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$pseudos$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyPseudoArgs"])(userPseudo, name, data, 1);
        return (elem)=>userPseudo(elem, data) && next(elem);
    }
    if (name in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$filters$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filters"]) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$filters$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filters"][name](next, data, options, context);
    }
    if (name in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$pseudos$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pseudos"]) {
        const pseudo = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$pseudos$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pseudos"][name];
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$pseudo$2d$selectors$2f$pseudos$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyPseudoArgs"])(pseudo, name, data, 2);
        return (elem)=>pseudo(elem, options, data) && next(elem);
    }
    throw new Error(`Unknown pseudo-class :${name}`);
}
}),
"[project]/node_modules/css-select/lib/esm/pseudo-selectors/pseudos.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// While filters are precompiled, pseudos get called when they are needed
__turbopack_context__.s([
    "pseudos",
    ()=>pseudos,
    "verifyPseudoArgs",
    ()=>verifyPseudoArgs
]);
const pseudos = {
    empty (elem, { adapter }) {
        return !adapter.getChildren(elem).some((elem)=>// FIXME: `getText` call is potentially expensive.
            adapter.isTag(elem) || adapter.getText(elem) !== "");
    },
    "first-child" (elem, { adapter, equals }) {
        if (adapter.prevElementSibling) {
            return adapter.prevElementSibling(elem) == null;
        }
        const firstChild = adapter.getSiblings(elem).find((elem)=>adapter.isTag(elem));
        return firstChild != null && equals(elem, firstChild);
    },
    "last-child" (elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);
        for(let i = siblings.length - 1; i >= 0; i--){
            if (equals(elem, siblings[i])) return true;
            if (adapter.isTag(siblings[i])) break;
        }
        return false;
    },
    "first-of-type" (elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);
        const elemName = adapter.getName(elem);
        for(let i = 0; i < siblings.length; i++){
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling)) return true;
            if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
                break;
            }
        }
        return false;
    },
    "last-of-type" (elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);
        const elemName = adapter.getName(elem);
        for(let i = siblings.length - 1; i >= 0; i--){
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling)) return true;
            if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) {
                break;
            }
        }
        return false;
    },
    "only-of-type" (elem, { adapter, equals }) {
        const elemName = adapter.getName(elem);
        return adapter.getSiblings(elem).every((sibling)=>equals(elem, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elemName);
    },
    "only-child" (elem, { adapter, equals }) {
        return adapter.getSiblings(elem).every((sibling)=>equals(elem, sibling) || !adapter.isTag(sibling));
    }
};
function verifyPseudoArgs(func, name, subselect, argIndex) {
    if (subselect === null) {
        if (func.length > argIndex) {
            throw new Error(`Pseudo-class :${name} requires an argument`);
        }
    } else if (func.length === argIndex) {
        throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
    }
}
}),
"[project]/node_modules/css-select/lib/esm/pseudo-selectors/subselects.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PLACEHOLDER_ELEMENT",
    ()=>PLACEHOLDER_ELEMENT,
    "ensureIsTag",
    ()=>ensureIsTag,
    "getNextSiblings",
    ()=>getNextSiblings,
    "subselects",
    ()=>subselects
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-select/lib/esm/sort.js [app-rsc] (ecmascript)");
;
;
const PLACEHOLDER_ELEMENT = {};
function ensureIsTag(next, adapter) {
    if (next === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
    return (elem)=>adapter.isTag(elem) && next(elem);
}
function getNextSiblings(elem, adapter) {
    const siblings = adapter.getSiblings(elem);
    if (siblings.length <= 1) return [];
    const elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
    return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}
function copyOptions(options) {
    // Not copied: context, rootFunc
    return {
        xmlMode: !!options.xmlMode,
        lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
        lowerCaseTags: !!options.lowerCaseTags,
        quirksMode: !!options.quirksMode,
        cacheResults: !!options.cacheResults,
        pseudos: options.pseudos,
        adapter: options.adapter,
        equals: options.equals
    };
}
const is = (next, token, options, context, compileToken)=>{
    const func = compileToken(token, copyOptions(options), context);
    return func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc ? next : func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc : (elem)=>func(elem) && next(elem);
};
const subselects = {
    is,
    /**
     * `:matches` and `:where` are aliases for `:is`.
     */ matches: is,
    where: is,
    not (next, token, options, context, compileToken) {
        const func = compileToken(token, copyOptions(options), context);
        return func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc ? next : func === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc : (elem)=>!func(elem) && next(elem);
    },
    has (next, subselect, options, _context, compileToken) {
        const { adapter } = options;
        const opts = copyOptions(options);
        opts.relativeSelector = true;
        const context = subselect.some((s)=>s.some(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$select$2f$lib$2f$esm$2f$sort$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTraversal"])) ? [
            PLACEHOLDER_ELEMENT
        ] : undefined;
        const compiled = compileToken(subselect, opts, context);
        if (compiled === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
        const hasElement = ensureIsTag(compiled, adapter);
        // If `compiled` is `trueFunc`, we can skip this.
        if (context && compiled !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc) {
            /*
             * `shouldTestNextSiblings` will only be true if the query starts with
             * a traversal (sibling or adjacent). That means we will always have a context.
             */ const { shouldTestNextSiblings = false } = compiled;
            return (elem)=>{
                if (!next(elem)) return false;
                context[0] = elem;
                const childs = adapter.getChildren(elem);
                const nextElements = shouldTestNextSiblings ? [
                    ...childs,
                    ...getNextSiblings(elem, adapter)
                ] : childs;
                return adapter.existsOne(hasElement, nextElements);
            };
        }
        return (elem)=>next(elem) && adapter.existsOne(hasElement, adapter.getChildren(elem));
    }
};
}),
"[project]/node_modules/css-select/lib/esm/sort.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>sortByProcedure,
    "isTraversal",
    ()=>isTraversal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)");
;
const procedure = new Map([
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Universal,
        50
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Tag,
        30
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Attribute,
        1
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo,
        0
    ]
]);
function isTraversal(token) {
    return !procedure.has(token.type);
}
const attributes = new Map([
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Exists,
        10
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Equals,
        8
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Not,
        7
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Start,
        6
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].End,
        6
    ],
    [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Any,
        5
    ]
]);
function sortByProcedure(arr) {
    const procs = arr.map(getProcedure);
    for(let i = 1; i < arr.length; i++){
        const procNew = procs[i];
        if (procNew < 0) continue;
        for(let j = i - 1; j >= 0 && procNew < procs[j]; j--){
            const token = arr[j + 1];
            arr[j + 1] = arr[j];
            arr[j] = token;
            procs[j + 1] = procs[j];
            procs[j] = procNew;
        }
    }
}
function getProcedure(token) {
    var _a, _b;
    let proc = (_a = procedure.get(token.type)) !== null && _a !== void 0 ? _a : -1;
    if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Attribute) {
        proc = (_b = attributes.get(token.action)) !== null && _b !== void 0 ? _b : 4;
        if (token.action === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Equals && token.name === "id") {
            // Prefer ID selectors (eg. #ID)
            proc = 9;
        }
        if (token.ignoreCase) {
            /*
             * IgnoreCase adds some overhead, prefer "normal" token
             * this is a binary operation, to ensure it's still an int
             */ proc >>= 1;
        }
    } else if (token.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo) {
        if (!token.data) {
            proc = 3;
        } else if (token.name === "has" || token.name === "contains") {
            proc = 0; // Expensive in any case
        } else if (Array.isArray(token.data)) {
            // Eg. :matches, :not
            proc = Math.min(...token.data.map((d)=>Math.min(...d.map(getProcedure))));
            // If we have traversals, try to avoid executing this selector
            if (proc < 0) {
                proc = 0;
            }
        } else {
            proc = 2;
        }
    }
    return proc;
}
}),
"[project]/node_modules/css-what/lib/es/parse.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isTraversal",
    ()=>isTraversal,
    "parse",
    ()=>parse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)");
;
const reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
const reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
const actionTypes = new Map([
    [
        126 /* Tilde */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Element
    ],
    [
        94 /* Circumflex */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Start
    ],
    [
        36 /* Dollar */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].End
    ],
    [
        42 /* Asterisk */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Any
    ],
    [
        33 /* ExclamationMark */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Not
    ],
    [
        124 /* Pipe */ ,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Hyphen
    ]
]);
// Pseudos, whose data property is parsed as well.
const unpackPseudos = new Set([
    "has",
    "not",
    "matches",
    "is",
    "where",
    "host",
    "host-context"
]);
function isTraversal(selector) {
    switch(selector.type){
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Adjacent:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Child:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Parent:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Sibling:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].ColumnCombinator:
            return true;
        default:
            return false;
    }
}
const stripQuotesFromPseudos = new Set([
    "contains",
    "icontains"
]);
// Unescape function taken from https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L152
function funescape(_, escaped, escapedWhitespace) {
    const high = parseInt(escaped, 16) - 0x10000;
    // NaN means non-codepoint
    return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 0x10000) : String.fromCharCode(high >> 10 | 0xd800, high & 0x3ff | 0xdc00);
}
function unescapeCSS(str) {
    return str.replace(reEscape, funescape);
}
function isQuote(c) {
    return c === 39 /* SingleQuote */  || c === 34 /* DoubleQuote */ ;
}
function isWhitespace(c) {
    return c === 32 /* Space */  || c === 9 /* Tab */  || c === 10 /* NewLine */  || c === 12 /* FormFeed */  || c === 13 /* CarriageReturn */ ;
}
function parse(selector) {
    const subselects = [];
    const endIndex = parseSelector(subselects, `${selector}`, 0);
    if (endIndex < selector.length) {
        throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
    }
    return subselects;
}
function parseSelector(subselects, selector, selectorIndex) {
    let tokens = [];
    function getName(offset) {
        const match = selector.slice(selectorIndex + offset).match(reName);
        if (!match) {
            throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
        }
        const [name] = match;
        selectorIndex += offset + name.length;
        return unescapeCSS(name);
    }
    function stripWhitespace(offset) {
        selectorIndex += offset;
        while(selectorIndex < selector.length && isWhitespace(selector.charCodeAt(selectorIndex))){
            selectorIndex++;
        }
    }
    function readValueWithParenthesis() {
        selectorIndex += 1;
        const start = selectorIndex;
        let counter = 1;
        for(; counter > 0 && selectorIndex < selector.length; selectorIndex++){
            if (selector.charCodeAt(selectorIndex) === 40 /* LeftParenthesis */  && !isEscaped(selectorIndex)) {
                counter++;
            } else if (selector.charCodeAt(selectorIndex) === 41 /* RightParenthesis */  && !isEscaped(selectorIndex)) {
                counter--;
            }
        }
        if (counter) {
            throw new Error("Parenthesis not matched");
        }
        return unescapeCSS(selector.slice(start, selectorIndex - 1));
    }
    function isEscaped(pos) {
        let slashCount = 0;
        while(selector.charCodeAt(--pos) === 92 /* BackSlash */ )slashCount++;
        return (slashCount & 1) === 1;
    }
    function ensureNotTraversal() {
        if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
            throw new Error("Did not expect successive traversals.");
        }
    }
    function addTraversal(type) {
        if (tokens.length > 0 && tokens[tokens.length - 1].type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant) {
            tokens[tokens.length - 1].type = type;
            return;
        }
        ensureNotTraversal();
        tokens.push({
            type
        });
    }
    function addSpecialAttribute(name, action) {
        tokens.push({
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Attribute,
            name,
            action,
            value: getName(1),
            namespace: null,
            ignoreCase: "quirks"
        });
    }
    /**
     * We have finished parsing the current part of the selector.
     *
     * Remove descendant tokens at the end if they exist,
     * and return the last index, so that parsing can be
     * picked up from here.
     */ function finalizeSubselector() {
        if (tokens.length && tokens[tokens.length - 1].type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant) {
            tokens.pop();
        }
        if (tokens.length === 0) {
            throw new Error("Empty sub-selector");
        }
        subselects.push(tokens);
    }
    stripWhitespace(0);
    if (selector.length === selectorIndex) {
        return selectorIndex;
    }
    loop: while(selectorIndex < selector.length){
        const firstChar = selector.charCodeAt(selectorIndex);
        switch(firstChar){
            // Whitespace
            case 32 /* Space */ :
            case 9 /* Tab */ :
            case 10 /* NewLine */ :
            case 12 /* FormFeed */ :
            case 13 /* CarriageReturn */ :
                {
                    if (tokens.length === 0 || tokens[0].type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant) {
                        ensureNotTraversal();
                        tokens.push({
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Descendant
                        });
                    }
                    stripWhitespace(1);
                    break;
                }
            // Traversals
            case 62 /* GreaterThan */ :
                {
                    addTraversal(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Child);
                    stripWhitespace(1);
                    break;
                }
            case 60 /* LessThan */ :
                {
                    addTraversal(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Parent);
                    stripWhitespace(1);
                    break;
                }
            case 126 /* Tilde */ :
                {
                    addTraversal(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Sibling);
                    stripWhitespace(1);
                    break;
                }
            case 43 /* Plus */ :
                {
                    addTraversal(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Adjacent);
                    stripWhitespace(1);
                    break;
                }
            // Special attribute selectors: .class, #id
            case 46 /* Period */ :
                {
                    addSpecialAttribute("class", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Element);
                    break;
                }
            case 35 /* Hash */ :
                {
                    addSpecialAttribute("id", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Equals);
                    break;
                }
            case 91 /* LeftSquareBracket */ :
                {
                    stripWhitespace(1);
                    // Determine attribute name and namespace
                    let name;
                    let namespace = null;
                    if (selector.charCodeAt(selectorIndex) === 124 /* Pipe */ ) {
                        // Equivalent to no namespace
                        name = getName(1);
                    } else if (selector.startsWith("*|", selectorIndex)) {
                        namespace = "*";
                        name = getName(2);
                    } else {
                        name = getName(0);
                        if (selector.charCodeAt(selectorIndex) === 124 /* Pipe */  && selector.charCodeAt(selectorIndex + 1) !== 61 /* Equal */ ) {
                            namespace = name;
                            name = getName(1);
                        }
                    }
                    stripWhitespace(0);
                    // Determine comparison operation
                    let action = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Exists;
                    const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
                    if (possibleAction) {
                        action = possibleAction;
                        if (selector.charCodeAt(selectorIndex + 1) !== 61 /* Equal */ ) {
                            throw new Error("Expected `=`");
                        }
                        stripWhitespace(2);
                    } else if (selector.charCodeAt(selectorIndex) === 61 /* Equal */ ) {
                        action = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AttributeAction"].Equals;
                        stripWhitespace(1);
                    }
                    // Determine value
                    let value = "";
                    let ignoreCase = null;
                    if (action !== "exists") {
                        if (isQuote(selector.charCodeAt(selectorIndex))) {
                            const quote = selector.charCodeAt(selectorIndex);
                            let sectionEnd = selectorIndex + 1;
                            while(sectionEnd < selector.length && (selector.charCodeAt(sectionEnd) !== quote || isEscaped(sectionEnd))){
                                sectionEnd += 1;
                            }
                            if (selector.charCodeAt(sectionEnd) !== quote) {
                                throw new Error("Attribute value didn't end");
                            }
                            value = unescapeCSS(selector.slice(selectorIndex + 1, sectionEnd));
                            selectorIndex = sectionEnd + 1;
                        } else {
                            const valueStart = selectorIndex;
                            while(selectorIndex < selector.length && (!isWhitespace(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== 93 /* RightSquareBracket */  || isEscaped(selectorIndex))){
                                selectorIndex += 1;
                            }
                            value = unescapeCSS(selector.slice(valueStart, selectorIndex));
                        }
                        stripWhitespace(0);
                        // See if we have a force ignore flag
                        const forceIgnore = selector.charCodeAt(selectorIndex) | 0x20;
                        // If the forceIgnore flag is set (either `i` or `s`), use that value
                        if (forceIgnore === 115 /* LowerS */ ) {
                            ignoreCase = false;
                            stripWhitespace(1);
                        } else if (forceIgnore === 105 /* LowerI */ ) {
                            ignoreCase = true;
                            stripWhitespace(1);
                        }
                    }
                    if (selector.charCodeAt(selectorIndex) !== 93 /* RightSquareBracket */ ) {
                        throw new Error("Attribute selector didn't terminate");
                    }
                    selectorIndex += 1;
                    const attributeSelector = {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Attribute,
                        name,
                        action,
                        value,
                        namespace,
                        ignoreCase
                    };
                    tokens.push(attributeSelector);
                    break;
                }
            case 58 /* Colon */ :
                {
                    if (selector.charCodeAt(selectorIndex + 1) === 58 /* Colon */ ) {
                        tokens.push({
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].PseudoElement,
                            name: getName(2).toLowerCase(),
                            data: selector.charCodeAt(selectorIndex) === 40 /* LeftParenthesis */  ? readValueWithParenthesis() : null
                        });
                        continue;
                    }
                    const name = getName(1).toLowerCase();
                    let data = null;
                    if (selector.charCodeAt(selectorIndex) === 40 /* LeftParenthesis */ ) {
                        if (unpackPseudos.has(name)) {
                            if (isQuote(selector.charCodeAt(selectorIndex + 1))) {
                                throw new Error(`Pseudo-selector ${name} cannot be quoted`);
                            }
                            data = [];
                            selectorIndex = parseSelector(data, selector, selectorIndex + 1);
                            if (selector.charCodeAt(selectorIndex) !== 41 /* RightParenthesis */ ) {
                                throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
                            }
                            selectorIndex += 1;
                        } else {
                            data = readValueWithParenthesis();
                            if (stripQuotesFromPseudos.has(name)) {
                                const quot = data.charCodeAt(0);
                                if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) {
                                    data = data.slice(1, -1);
                                }
                            }
                            data = unescapeCSS(data);
                        }
                    }
                    tokens.push({
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Pseudo,
                        name,
                        data
                    });
                    break;
                }
            case 44 /* Comma */ :
                {
                    finalizeSubselector();
                    tokens = [];
                    stripWhitespace(1);
                    break;
                }
            default:
                {
                    if (selector.startsWith("/*", selectorIndex)) {
                        const endIndex = selector.indexOf("*/", selectorIndex + 2);
                        if (endIndex < 0) {
                            throw new Error("Comment was not terminated");
                        }
                        selectorIndex = endIndex + 2;
                        // Remove leading whitespace
                        if (tokens.length === 0) {
                            stripWhitespace(0);
                        }
                        break;
                    }
                    let namespace = null;
                    let name;
                    if (firstChar === 42 /* Asterisk */ ) {
                        selectorIndex += 1;
                        name = "*";
                    } else if (firstChar === 124 /* Pipe */ ) {
                        name = "";
                        if (selector.charCodeAt(selectorIndex + 1) === 124 /* Pipe */ ) {
                            addTraversal(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].ColumnCombinator);
                            stripWhitespace(2);
                            break;
                        }
                    } else if (reName.test(selector.slice(selectorIndex))) {
                        name = getName(0);
                    } else {
                        break loop;
                    }
                    if (selector.charCodeAt(selectorIndex) === 124 /* Pipe */  && selector.charCodeAt(selectorIndex + 1) !== 124 /* Pipe */ ) {
                        namespace = name;
                        if (selector.charCodeAt(selectorIndex + 1) === 42 /* Asterisk */ ) {
                            name = "*";
                            selectorIndex += 2;
                        } else {
                            name = getName(1);
                        }
                    }
                    tokens.push(name === "*" ? {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Universal,
                        namespace
                    } : {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$css$2d$what$2f$lib$2f$es$2f$types$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SelectorType"].Tag,
                        name,
                        namespace
                    });
                }
        }
    }
    finalizeSubselector();
    return selectorIndex;
}
}),
"[project]/node_modules/css-what/lib/es/types.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AttributeAction",
    ()=>AttributeAction,
    "IgnoreCaseMode",
    ()=>IgnoreCaseMode,
    "SelectorType",
    ()=>SelectorType
]);
var SelectorType;
(function(SelectorType) {
    SelectorType["Attribute"] = "attribute";
    SelectorType["Pseudo"] = "pseudo";
    SelectorType["PseudoElement"] = "pseudo-element";
    SelectorType["Tag"] = "tag";
    SelectorType["Universal"] = "universal";
    // Traversals
    SelectorType["Adjacent"] = "adjacent";
    SelectorType["Child"] = "child";
    SelectorType["Descendant"] = "descendant";
    SelectorType["Parent"] = "parent";
    SelectorType["Sibling"] = "sibling";
    SelectorType["ColumnCombinator"] = "column-combinator";
})(SelectorType || (SelectorType = {}));
const IgnoreCaseMode = {
    Unknown: null,
    QuirksMode: "quirks",
    IgnoreCase: true,
    CaseSensitive: false
};
var AttributeAction;
(function(AttributeAction) {
    AttributeAction["Any"] = "any";
    AttributeAction["Element"] = "element";
    AttributeAction["End"] = "end";
    AttributeAction["Equals"] = "equals";
    AttributeAction["Exists"] = "exists";
    AttributeAction["Hyphen"] = "hyphen";
    AttributeAction["Not"] = "not";
    AttributeAction["Start"] = "start";
})(AttributeAction || (AttributeAction = {}));
}),
"[project]/node_modules/dom-serializer/lib/esm/foreignNames.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "attributeNames",
    ()=>attributeNames,
    "elementNames",
    ()=>elementNames
]);
const elementNames = new Map([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "textPath"
].map((val)=>[
        val.toLowerCase(),
        val
    ]));
const attributeNames = new Map([
    "definitionURL",
    "attributeName",
    "attributeType",
    "baseFrequency",
    "baseProfile",
    "calcMode",
    "clipPathUnits",
    "diffuseConstant",
    "edgeMode",
    "filterUnits",
    "glyphRef",
    "gradientTransform",
    "gradientUnits",
    "kernelMatrix",
    "kernelUnitLength",
    "keyPoints",
    "keySplines",
    "keyTimes",
    "lengthAdjust",
    "limitingConeAngle",
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "maskContentUnits",
    "maskUnits",
    "numOctaves",
    "pathLength",
    "patternContentUnits",
    "patternTransform",
    "patternUnits",
    "pointsAtX",
    "pointsAtY",
    "pointsAtZ",
    "preserveAlpha",
    "preserveAspectRatio",
    "primitiveUnits",
    "refX",
    "refY",
    "repeatCount",
    "repeatDur",
    "requiredExtensions",
    "requiredFeatures",
    "specularConstant",
    "specularExponent",
    "spreadMethod",
    "startOffset",
    "stdDeviation",
    "stitchTiles",
    "surfaceScale",
    "systemLanguage",
    "tableValues",
    "targetX",
    "targetY",
    "textLength",
    "viewBox",
    "viewTarget",
    "xChannelSelector",
    "yChannelSelector",
    "zoomAndPan"
].map((val)=>[
        val.toLowerCase(),
        val
    ]));
}),
"[project]/node_modules/dom-serializer/lib/esm/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "render",
    ()=>render
]);
/*
 * Module dependencies
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/escape.js [app-rsc] (ecmascript)");
/**
 * Mixed-case SVG and MathML tags & attributes
 * recognized by the HTML parser.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/foreignNames.js [app-rsc] (ecmascript)");
;
;
;
const unencodedElements = new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript"
]);
function replaceQuotes(value) {
    return value.replace(/"/g, "&quot;");
}
/**
 * Format attributes
 */ function formatAttributes(attributes, opts) {
    var _a;
    if (!attributes) return;
    const encode = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["encodeXML"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["escapeAttribute"];
    return Object.keys(attributes).map((key)=>{
        var _a, _b;
        const value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
        if (opts.xmlMode === "foreign") {
            /* Fix up mixed-case attribute names */ key = (_b = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attributeNames"].get(key)) !== null && _b !== void 0 ? _b : key;
        }
        if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
            return key;
        }
        return `${key}="${encode(value)}"`;
    }).join(" ");
}
/**
 * Self-enclosing tags
 */ const singleTag = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
function render(node, options = {}) {
    const nodes = "length" in node ? node : [
        node
    ];
    let output = "";
    for(let i = 0; i < nodes.length; i++){
        output += renderNode(nodes[i], options);
    }
    return output;
}
const __TURBOPACK__default__export__ = render;
function renderNode(node, options) {
    switch(node.type){
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Root"]:
            return render(node.children, options);
        // @ts-expect-error We don't use `Doctype` yet
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Doctype"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Directive"]:
            return renderDirective(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Comment"]:
            return renderComment(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CDATA"]:
            return renderCdata(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Script"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Style"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Tag"]:
            return renderTag(node, options);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Text"]:
            return renderText(node, options);
    }
}
const foreignModeIntegrationPoints = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title"
]);
const foreignElements = new Set([
    "svg",
    "math"
]);
function renderTag(elem, opts) {
    var _a;
    // Handle SVG / MathML in HTML
    if (opts.xmlMode === "foreign") {
        /* Fix up mixed-case element names */ elem.name = (_a = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["elementNames"].get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        /* Exit foreign mode at integration points */ if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
            opts = {
                ...opts,
                xmlMode: false
            };
        }
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = {
            ...opts,
            xmlMode: "foreign"
        };
    }
    let tag = `<${elem.name}`;
    const attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
        tag += ` ${attribs}`;
    }
    if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode) tag += " ";
        tag += "/>";
    } else {
        tag += ">";
        if (elem.children.length > 0) {
            tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
            tag += `</${elem.name}>`;
        }
    }
    return tag;
}
function renderDirective(elem) {
    return `<${elem.data}>`;
}
function renderText(elem, opts) {
    var _a;
    let data = elem.data || "";
    // If entities weren't decoded, no need to encode them back
    if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
        data = opts.xmlMode || opts.encodeEntities !== "utf8" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["encodeXML"])(data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["escapeText"])(data);
    }
    return data;
}
function renderCdata(elem) {
    return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
    return `<!--${elem.data}-->`;
}
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Types of elements found in htmlparser2's DOM */ __turbopack_context__.s([
    "CDATA",
    ()=>CDATA,
    "Comment",
    ()=>Comment,
    "Directive",
    ()=>Directive,
    "Doctype",
    ()=>Doctype,
    "ElementType",
    ()=>ElementType,
    "Root",
    ()=>Root,
    "Script",
    ()=>Script,
    "Style",
    ()=>Style,
    "Tag",
    ()=>Tag,
    "Text",
    ()=>Text,
    "isTag",
    ()=>isTag
]);
var ElementType;
(function(ElementType) {
    /** Type for the root element of a document */ ElementType["Root"] = "root";
    /** Type for Text */ ElementType["Text"] = "text";
    /** Type for <? ... ?> */ ElementType["Directive"] = "directive";
    /** Type for <!-- ... --> */ ElementType["Comment"] = "comment";
    /** Type for <script> tags */ ElementType["Script"] = "script";
    /** Type for <style> tags */ ElementType["Style"] = "style";
    /** Type for Any tag */ ElementType["Tag"] = "tag";
    /** Type for <![CDATA[ ... ]]> */ ElementType["CDATA"] = "cdata";
    /** Type for <!doctype ...> */ ElementType["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
    return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
const Root = ElementType.Root;
const Text = ElementType.Text;
const Directive = ElementType.Directive;
const Comment = ElementType.Comment;
const Script = ElementType.Script;
const Style = ElementType.Style;
const Tag = ElementType.Tag;
const CDATA = ElementType.CDATA;
const Doctype = ElementType.Doctype;
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Comment>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ElementType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Root>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ElementType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Tag>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ElementType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript) <export * as ElementType .Text>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ElementType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DomHandler",
    ()=>DomHandler,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
;
;
// Default options
const defaultOpts = {
    withStartIndices: false,
    withEndIndices: false,
    xmlMode: false
};
class DomHandler {
    /**
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */ constructor(callback, options, elementCB){
        /** The elements of the DOM */ this.dom = [];
        /** The root element for the DOM */ this.root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"](this.dom);
        /** Indicated whether parsing has been completed. */ this.done = false;
        /** Stack of open tags. */ this.tagStack = [
            this.root
        ];
        /** A data node that is still being written to. */ this.lastNode = null;
        /** Reference to the parser instance. Used for location information. */ this.parser = null;
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOpts;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }
        this.callback = callback !== null && callback !== void 0 ? callback : null;
        this.options = options !== null && options !== void 0 ? options : defaultOpts;
        this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
    }
    onparserinit(parser) {
        this.parser = parser;
    }
    // Resets the handler back to starting state
    onreset() {
        this.dom = [];
        this.root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"](this.dom);
        this.done = false;
        this.tagStack = [
            this.root
        ];
        this.lastNode = null;
        this.parser = null;
    }
    // Signals the handler that parsing is done
    onend() {
        if (this.done) return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
    }
    onerror(error) {
        this.handleCallback(error);
    }
    onclosetag() {
        this.lastNode = null;
        const elem = this.tagStack.pop();
        if (this.options.withEndIndices) {
            elem.endIndex = this.parser.endIndex;
        }
        if (this.elementCB) this.elementCB(elem);
    }
    onopentag(name, attribs) {
        const type = this.options.xmlMode ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Tag : undefined;
        const element = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Element"](name, attribs, undefined, type);
        this.addNode(element);
        this.tagStack.push(element);
    }
    ontext(data) {
        const { lastNode } = this;
        if (lastNode && lastNode.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Text) {
            lastNode.data += data;
            if (this.options.withEndIndices) {
                lastNode.endIndex = this.parser.endIndex;
            }
        } else {
            const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Text"](data);
            this.addNode(node);
            this.lastNode = node;
        }
    }
    oncomment(data) {
        if (this.lastNode && this.lastNode.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Comment) {
            this.lastNode.data += data;
            return;
        }
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Comment"](data);
        this.addNode(node);
        this.lastNode = node;
    }
    oncommentend() {
        this.lastNode = null;
    }
    oncdatastart() {
        const text = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Text"]("");
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CDATA"]([
            text
        ]);
        this.addNode(node);
        text.parent = node;
        this.lastNode = text;
    }
    oncdataend() {
        this.lastNode = null;
    }
    onprocessinginstruction(name, data) {
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProcessingInstruction"](name, data);
        this.addNode(node);
    }
    handleCallback(error) {
        if (typeof this.callback === "function") {
            this.callback(error, this.dom);
        } else if (error) {
            throw error;
        }
    }
    addNode(node) {
        const parent = this.tagStack[this.tagStack.length - 1];
        const previousSibling = parent.children[parent.children.length - 1];
        if (this.options.withStartIndices) {
            node.startIndex = this.parser.startIndex;
        }
        if (this.options.withEndIndices) {
            node.endIndex = this.parser.endIndex;
        }
        parent.children.push(node);
        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }
        node.parent = parent;
        this.lastNode = null;
    }
}
const __TURBOPACK__default__export__ = DomHandler;
}),
"[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CDATA",
    ()=>CDATA,
    "Comment",
    ()=>Comment,
    "DataNode",
    ()=>DataNode,
    "Document",
    ()=>Document,
    "Element",
    ()=>Element,
    "Node",
    ()=>Node,
    "NodeWithChildren",
    ()=>NodeWithChildren,
    "ProcessingInstruction",
    ()=>ProcessingInstruction,
    "Text",
    ()=>Text,
    "cloneNode",
    ()=>cloneNode,
    "hasChildren",
    ()=>hasChildren,
    "isCDATA",
    ()=>isCDATA,
    "isComment",
    ()=>isComment,
    "isDirective",
    ()=>isDirective,
    "isDocument",
    ()=>isDocument,
    "isTag",
    ()=>isTag,
    "isText",
    ()=>isText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
;
class Node {
    constructor(){
        /** Parent of the node */ this.parent = null;
        /** Previous sibling */ this.prev = null;
        /** Next sibling */ this.next = null;
        /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */ this.startIndex = null;
        /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */ this.endIndex = null;
    }
    // Read-write aliases for properties
    /**
     * Same as {@link parent}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get parentNode() {
        return this.parent;
    }
    set parentNode(parent) {
        this.parent = parent;
    }
    /**
     * Same as {@link prev}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get previousSibling() {
        return this.prev;
    }
    set previousSibling(prev) {
        this.prev = prev;
    }
    /**
     * Same as {@link next}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get nextSibling() {
        return this.next;
    }
    set nextSibling(next) {
        this.next = next;
    }
    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */ cloneNode(recursive = false) {
        return cloneNode(this, recursive);
    }
}
class DataNode extends Node {
    /**
     * @param data The content of the data node
     */ constructor(data){
        super();
        this.data = data;
    }
    /**
     * Same as {@link data}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get nodeValue() {
        return this.data;
    }
    set nodeValue(data) {
        this.data = data;
    }
}
class Text extends DataNode {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Text;
    }
    get nodeType() {
        return 3;
    }
}
class Comment extends DataNode {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Comment;
    }
    get nodeType() {
        return 8;
    }
}
class ProcessingInstruction extends DataNode {
    constructor(name, data){
        super(data);
        this.name = name;
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Directive;
    }
    get nodeType() {
        return 1;
    }
}
class NodeWithChildren extends Node {
    /**
     * @param children Children of the node. Only certain node types can have children.
     */ constructor(children){
        super();
        this.children = children;
    }
    // Aliases
    /** First child of the node. */ get firstChild() {
        var _a;
        return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
    }
    /** Last child of the node. */ get lastChild() {
        return this.children.length > 0 ? this.children[this.children.length - 1] : null;
    }
    /**
     * Same as {@link children}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get childNodes() {
        return this.children;
    }
    set childNodes(children) {
        this.children = children;
    }
}
class CDATA extends NodeWithChildren {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].CDATA;
    }
    get nodeType() {
        return 4;
    }
}
class Document extends NodeWithChildren {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Root;
    }
    get nodeType() {
        return 9;
    }
}
class Element extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */ constructor(name, attribs, children = [], type = name === "script" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Script : name === "style" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Style : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Tag){
        super(children);
        this.name = name;
        this.attribs = attribs;
        this.type = type;
    }
    get nodeType() {
        return 1;
    }
    // DOM Level 1 aliases
    /**
     * Same as {@link name}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get tagName() {
        return this.name;
    }
    set tagName(name) {
        this.name = name;
    }
    get attributes() {
        return Object.keys(this.attribs).map((name)=>{
            var _a, _b;
            return {
                name,
                value: this.attribs[name],
                namespace: (_a = this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
                prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
            };
        });
    }
}
function isTag(node) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(node);
}
function isCDATA(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].CDATA;
}
function isText(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Text;
}
function isComment(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Comment;
}
function isDirective(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Directive;
}
function isDocument(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Root;
}
function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
}
function cloneNode(node, recursive = false) {
    let result;
    if (isText(node)) {
        result = new Text(node.data);
    } else if (isComment(node)) {
        result = new Comment(node.data);
    } else if (isTag(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Element(node.name, {
            ...node.attribs
        }, children);
        children.forEach((child)=>child.parent = clone);
        if (node.namespace != null) {
            clone.namespace = node.namespace;
        }
        if (node["x-attribsNamespace"]) {
            clone["x-attribsNamespace"] = {
                ...node["x-attribsNamespace"]
            };
        }
        if (node["x-attribsPrefix"]) {
            clone["x-attribsPrefix"] = {
                ...node["x-attribsPrefix"]
            };
        }
        result = clone;
    } else if (isCDATA(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new CDATA(children);
        children.forEach((child)=>child.parent = clone);
        result = clone;
    } else if (isDocument(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Document(children);
        children.forEach((child)=>child.parent = clone);
        if (node["x-mode"]) {
            clone["x-mode"] = node["x-mode"];
        }
        result = clone;
    } else if (isDirective(node)) {
        const instruction = new ProcessingInstruction(node.name, node.data);
        if (node["x-name"] != null) {
            instruction["x-name"] = node["x-name"];
            instruction["x-publicId"] = node["x-publicId"];
            instruction["x-systemId"] = node["x-systemId"];
        }
        result = instruction;
    } else {
        throw new Error(`Not implemented yet: ${node.type}`);
    }
    result.startIndex = node.startIndex;
    result.endIndex = node.endIndex;
    if (node.sourceCodeLocation != null) {
        result.sourceCodeLocation = node.sourceCodeLocation;
    }
    return result;
}
function cloneChildren(childs) {
    const children = childs.map((child)=>cloneNode(child, true));
    for(let i = 1; i < children.length; i++){
        children[i].prev = children[i - 1];
        children[i - 1].next = children[i];
    }
    return children;
}
}),
"[project]/node_modules/domutils/lib/esm/feeds.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFeed",
    ()=>getFeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/legacy.js [app-rsc] (ecmascript)");
;
;
function getFeed(doc) {
    const feedRoot = getOneElement(isValidFeed, doc);
    return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
}
/**
 * Parse an Atom feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */ function getAtomFeed(feedRoot) {
    var _a;
    const childs = feedRoot.children;
    const feed = {
        type: "atom",
        items: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"])("entry", childs).map((item)=>{
            var _a;
            const { children } = item;
            const entry = {
                media: getMediaElements(children)
            };
            addConditionally(entry, "id", "id", children);
            addConditionally(entry, "title", "title", children);
            const href = (_a = getOneElement("link", children)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
            if (href) {
                entry.link = href;
            }
            const description = fetch("summary", children) || fetch("content", children);
            if (description) {
                entry.description = description;
            }
            const pubDate = fetch("updated", children);
            if (pubDate) {
                entry.pubDate = new Date(pubDate);
            }
            return entry;
        })
    };
    addConditionally(feed, "id", "id", childs);
    addConditionally(feed, "title", "title", childs);
    const href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
    if (href) {
        feed.link = href;
    }
    addConditionally(feed, "description", "subtitle", childs);
    const updated = fetch("updated", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "email", childs, true);
    return feed;
}
/**
 * Parse a RSS feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */ function getRssFeed(feedRoot) {
    var _a, _b;
    const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
    const feed = {
        type: feedRoot.name.substr(0, 3),
        id: "",
        items: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"])("item", feedRoot.children).map((item)=>{
            const { children } = item;
            const entry = {
                media: getMediaElements(children)
            };
            addConditionally(entry, "id", "guid", children);
            addConditionally(entry, "title", "title", children);
            addConditionally(entry, "link", "link", children);
            addConditionally(entry, "description", "description", children);
            const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
            if (pubDate) entry.pubDate = new Date(pubDate);
            return entry;
        })
    };
    addConditionally(feed, "title", "title", childs);
    addConditionally(feed, "link", "link", childs);
    addConditionally(feed, "description", "description", childs);
    const updated = fetch("lastBuildDate", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "managingEditor", childs, true);
    return feed;
}
const MEDIA_KEYS_STRING = [
    "url",
    "type",
    "lang"
];
const MEDIA_KEYS_INT = [
    "fileSize",
    "bitrate",
    "framerate",
    "samplingrate",
    "channels",
    "duration",
    "height",
    "width"
];
/**
 * Get all media elements of a feed item.
 *
 * @param where Nodes to search in.
 * @returns Media elements.
 */ function getMediaElements(where) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"])("media:content", where).map((elem)=>{
        const { attribs } = elem;
        const media = {
            medium: attribs["medium"],
            isDefault: !!attribs["isDefault"]
        };
        for (const attrib of MEDIA_KEYS_STRING){
            if (attribs[attrib]) {
                media[attrib] = attribs[attrib];
            }
        }
        for (const attrib of MEDIA_KEYS_INT){
            if (attribs[attrib]) {
                media[attrib] = parseInt(attribs[attrib], 10);
            }
        }
        if (attribs["expression"]) {
            media.expression = attribs["expression"];
        }
        return media;
    });
}
/**
 * Get one element by tag name.
 *
 * @param tagName Tag name to look for
 * @param node Node to search in
 * @returns The element or null
 */ function getOneElement(tagName, node) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"])(tagName, node, true, 1)[0];
}
/**
 * Get the text content of an element with a certain tag name.
 *
 * @param tagName Tag name to look for.
 * @param where Node to search in.
 * @param recurse Whether to recurse into child nodes.
 * @returns The text content of the element.
 */ function fetch(tagName, where, recurse = false) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["textContent"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"])(tagName, where, recurse, 1)).trim();
}
/**
 * Adds a property to an object if it has a value.
 *
 * @param obj Object to be extended
 * @param prop Property name
 * @param tagName Tag name that contains the conditionally added property
 * @param where Element to search for the property
 * @param recurse Whether to recurse into child nodes.
 */ function addConditionally(obj, prop, tagName, where, recurse = false) {
    const val = fetch(tagName, where, recurse);
    if (val) obj[prop] = val;
}
/**
 * Checks if an element is a feed root node.
 *
 * @param value The name of the element to check.
 * @returns Whether an element is a feed root node.
 */ function isValidFeed(value) {
    return value === "rss" || value === "feed" || value === "rdf:RDF";
}
}),
"[project]/node_modules/domutils/lib/esm/helpers.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DocumentPosition",
    ()=>DocumentPosition,
    "compareDocumentPosition",
    ()=>compareDocumentPosition,
    "removeSubsets",
    ()=>removeSubsets,
    "uniqueSort",
    ()=>uniqueSort
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
function removeSubsets(nodes) {
    let idx = nodes.length;
    /*
     * Check if each node (or one of its ancestors) is already contained in the
     * array.
     */ while(--idx >= 0){
        const node = nodes[idx];
        /*
         * Remove the node if it is not unique.
         * We are going through the array from the end, so we only
         * have to check nodes that preceed the node under consideration in the array.
         */ if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }
        for(let ancestor = node.parent; ancestor; ancestor = ancestor.parent){
            if (nodes.includes(ancestor)) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }
    return nodes;
}
var DocumentPosition;
(function(DocumentPosition) {
    DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
    DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
    DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
    DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
    DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
function compareDocumentPosition(nodeA, nodeB) {
    const aParents = [];
    const bParents = [];
    if (nodeA === nodeB) {
        return 0;
    }
    let current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(nodeA) ? nodeA : nodeA.parent;
    while(current){
        aParents.unshift(current);
        current = current.parent;
    }
    current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(nodeB) ? nodeB : nodeB.parent;
    while(current){
        bParents.unshift(current);
        current = current.parent;
    }
    const maxIdx = Math.min(aParents.length, bParents.length);
    let idx = 0;
    while(idx < maxIdx && aParents[idx] === bParents[idx]){
        idx++;
    }
    if (idx === 0) {
        return DocumentPosition.DISCONNECTED;
    }
    const sharedParent = aParents[idx - 1];
    const siblings = sharedParent.children;
    const aSibling = aParents[idx];
    const bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
        }
        return DocumentPosition.FOLLOWING;
    }
    if (sharedParent === nodeA) {
        return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
    }
    return DocumentPosition.PRECEDING;
}
function uniqueSort(nodes) {
    nodes = nodes.filter((node, i, arr)=>!arr.includes(node, i + 1));
    nodes.sort((a, b)=>{
        const relative = compareDocumentPosition(a, b);
        if (relative & DocumentPosition.PRECEDING) {
            return -1;
        } else if (relative & DocumentPosition.FOLLOWING) {
            return 1;
        }
        return 0;
    });
    return nodes;
}
}),
"[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DocumentPosition",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DocumentPosition"],
    "append",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["append"],
    "appendChild",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["appendChild"],
    "compareDocumentPosition",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compareDocumentPosition"],
    "existsOne",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["existsOne"],
    "filter",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filter"],
    "find",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["find"],
    "findAll",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["findAll"],
    "findOne",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["findOne"],
    "findOneChild",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["findOneChild"],
    "getAttributeValue",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAttributeValue"],
    "getChildren",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getChildren"],
    "getElementById",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementById"],
    "getElements",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElements"],
    "getElementsByClassName",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByClassName"],
    "getElementsByTagName",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagName"],
    "getElementsByTagType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getElementsByTagType"],
    "getFeed",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeed"],
    "getInnerHTML",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getInnerHTML"],
    "getName",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getName"],
    "getOuterHTML",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOuterHTML"],
    "getParent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getParent"],
    "getSiblings",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSiblings"],
    "getText",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getText"],
    "hasAttrib",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasAttrib"],
    "hasChildren",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"],
    "innerText",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["innerText"],
    "isCDATA",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCDATA"],
    "isComment",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isComment"],
    "isDocument",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDocument"],
    "isTag",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"],
    "isText",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"],
    "nextElementSibling",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["nextElementSibling"],
    "prepend",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prepend"],
    "prependChild",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prependChild"],
    "prevElementSibling",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prevElementSibling"],
    "removeElement",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeElement"],
    "removeSubsets",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeSubsets"],
    "replaceElement",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["replaceElement"],
    "testElement",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["testElement"],
    "textContent",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["textContent"],
    "uniqueSort",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uniqueSort"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/traversal.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$manipulation$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/manipulation.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/querying.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/legacy.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/helpers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/feeds.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
}),
"[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/traversal.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/querying.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/legacy.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/helpers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/feeds.js [app-rsc] (ecmascript)");
/** @deprecated Use these methods from `domhandler` directly. */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
;
;
;
;
;
;
;
;
}),
"[project]/node_modules/domutils/lib/esm/legacy.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getElementById",
    ()=>getElementById,
    "getElements",
    ()=>getElements,
    "getElementsByClassName",
    ()=>getElementsByClassName,
    "getElementsByTagName",
    ()=>getElementsByTagName,
    "getElementsByTagType",
    ()=>getElementsByTagType,
    "testElement",
    ()=>testElement
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/querying.js [app-rsc] (ecmascript)");
;
;
/**
 * A map of functions to check nodes against.
 */ const Checks = {
    tag_name (name) {
        if (typeof name === "function") {
            return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && name(elem.name);
        } else if (name === "*") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"];
        }
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.name === name;
    },
    tag_type (type) {
        if (typeof type === "function") {
            return (elem)=>type(elem.type);
        }
        return (elem)=>elem.type === type;
    },
    tag_contains (data) {
        if (typeof data === "function") {
            return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(elem) && data(elem.data);
        }
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(elem) && elem.data === data;
    }
};
/**
 * Returns a function to check whether a node has an attribute with a particular
 * value.
 *
 * @param attrib Attribute to check.
 * @param value Attribute value to look for.
 * @returns A function to check whether the a node has an attribute with a
 *   particular value.
 */ function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && value(elem.attribs[attrib]);
    }
    return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.attribs[attrib] === value;
}
/**
 * Returns a function that returns `true` if either of the input functions
 * returns `true` for a node.
 *
 * @param a First function to combine.
 * @param b Second function to combine.
 * @returns A function taking a node and returning `true` if either of the input
 *   functions returns `true` for the node.
 */ function combineFuncs(a, b) {
    return (elem)=>a(elem) || b(elem);
}
/**
 * Returns a function that executes all checks in `options` and returns `true`
 * if any of them match a node.
 *
 * @param options An object describing nodes to look for.
 * @returns A function that executes all checks in `options` and returns `true`
 *   if any of them match a node.
 */ function compileTest(options) {
    const funcs = Object.keys(options).map((key)=>{
        const value = options[key];
        return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, node) {
    const test = compileTest(options);
    return test ? test(node) : true;
}
function getElements(options, nodes, recurse, limit = Infinity) {
    const test = compileTest(options);
    return test ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filter"])(test, nodes, recurse, limit) : [];
}
function getElementById(id, nodes, recurse = true) {
    if (!Array.isArray(nodes)) nodes = [
        nodes
    ];
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["findOne"])(getAttribCheck("id", id), nodes, recurse);
}
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filter"])(Checks["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filter"])(getAttribCheck("class", className), nodes, recurse, limit);
}
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["filter"])(Checks["tag_type"](type), nodes, recurse, limit);
}
}),
"[project]/node_modules/domutils/lib/esm/manipulation.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Remove an element from the dom
 *
 * @category Manipulation
 * @param elem The element to be removed
 */ __turbopack_context__.s([
    "append",
    ()=>append,
    "appendChild",
    ()=>appendChild,
    "prepend",
    ()=>prepend,
    "prependChild",
    ()=>prependChild,
    "removeElement",
    ()=>removeElement,
    "replaceElement",
    ()=>replaceElement
]);
function removeElement(elem) {
    if (elem.prev) elem.prev.next = elem.next;
    if (elem.next) elem.next.prev = elem.prev;
    if (elem.parent) {
        const childs = elem.parent.children;
        const childsIndex = childs.lastIndexOf(elem);
        if (childsIndex >= 0) {
            childs.splice(childsIndex, 1);
        }
    }
    elem.next = null;
    elem.prev = null;
    elem.parent = null;
}
function replaceElement(elem, replacement) {
    const prev = replacement.prev = elem.prev;
    if (prev) {
        prev.next = replacement;
    }
    const next = replacement.next = elem.next;
    if (next) {
        next.prev = replacement;
    }
    const parent = replacement.parent = elem.parent;
    if (parent) {
        const childs = parent.children;
        childs[childs.lastIndexOf(elem)] = replacement;
        elem.parent = null;
    }
}
function appendChild(parent, child) {
    removeElement(child);
    child.next = null;
    child.parent = parent;
    if (parent.children.push(child) > 1) {
        const sibling = parent.children[parent.children.length - 2];
        sibling.next = child;
        child.prev = sibling;
    } else {
        child.prev = null;
    }
}
function append(elem, next) {
    removeElement(next);
    const { parent } = elem;
    const currNext = elem.next;
    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;
    if (currNext) {
        currNext.prev = next;
        if (parent) {
            const childs = parent.children;
            childs.splice(childs.lastIndexOf(currNext), 0, next);
        }
    } else if (parent) {
        parent.children.push(next);
    }
}
function prependChild(parent, child) {
    removeElement(child);
    child.parent = parent;
    child.prev = null;
    if (parent.children.unshift(child) !== 1) {
        const sibling = parent.children[1];
        sibling.prev = child;
        child.next = sibling;
    } else {
        child.next = null;
    }
}
function prepend(elem, prev) {
    removeElement(prev);
    const { parent } = elem;
    if (parent) {
        const childs = parent.children;
        childs.splice(childs.indexOf(elem), 0, prev);
    }
    if (elem.prev) {
        elem.prev.next = prev;
    }
    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
}
}),
"[project]/node_modules/domutils/lib/esm/querying.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "existsOne",
    ()=>existsOne,
    "filter",
    ()=>filter,
    "find",
    ()=>find,
    "findAll",
    ()=>findAll,
    "findOne",
    ()=>findOne,
    "findOneChild",
    ()=>findOneChild
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
function filter(test, node, recurse = true, limit = Infinity) {
    return find(test, Array.isArray(node) ? node : [
        node
    ], recurse, limit);
}
function find(test, nodes, recurse, limit) {
    const result = [];
    /** Stack of the arrays we are looking at. */ const nodeStack = [
        Array.isArray(nodes) ? nodes : [
            nodes
        ]
    ];
    /** Stack of the indices within the arrays. */ const indexStack = [
        0
    ];
    for(;;){
        // First, check if the current array has any more elements to look at.
        if (indexStack[0] >= nodeStack[0].length) {
            // If we have no more arrays to look at, we are done.
            if (indexStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if (test(elem)) {
            result.push(elem);
            if (--limit <= 0) return result;
        }
        if (recurse && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(elem) && elem.children.length > 0) {
            /*
             * Add the children to the stack. We are depth-first, so this is
             * the next array we look at.
             */ indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
function findOneChild(test, nodes) {
    return nodes.find(test);
}
function findOne(test, nodes, recurse = true) {
    const searchedNodes = Array.isArray(nodes) ? nodes : [
        nodes
    ];
    for(let i = 0; i < searchedNodes.length; i++){
        const node = searchedNodes[i];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(node) && test(node)) {
            return node;
        }
        if (recurse && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(node) && node.children.length > 0) {
            const found = findOne(test, node.children, true);
            if (found) return found;
        }
    }
    return null;
}
function existsOne(test, nodes) {
    return (Array.isArray(nodes) ? nodes : [
        nodes
    ]).some((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(node) && test(node) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(node) && existsOne(test, node.children));
}
function findAll(test, nodes) {
    const result = [];
    const nodeStack = [
        Array.isArray(nodes) ? nodes : [
            nodes
        ]
    ];
    const indexStack = [
        0
    ];
    for(;;){
        if (indexStack[0] >= nodeStack[0].length) {
            if (nodeStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(elem) && test(elem)) result.push(elem);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(elem) && elem.children.length > 0) {
            indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
}),
"[project]/node_modules/domutils/lib/esm/stringify.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getInnerHTML",
    ()=>getInnerHTML,
    "getOuterHTML",
    ()=>getOuterHTML,
    "getText",
    ()=>getText,
    "innerText",
    ()=>innerText,
    "textContent",
    ()=>textContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
;
;
;
function getOuterHTML(node, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(node, options);
}
function getInnerHTML(node, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(node) ? node.children.map((node)=>getOuterHTML(node, options)).join("") : "";
}
function getText(node) {
    if (Array.isArray(node)) return node.map(getText).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(node)) return node.name === "br" ? "\n" : getText(node.children);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCDATA"])(node)) return getText(node.children);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
function textContent(node) {
    if (Array.isArray(node)) return node.map(textContent).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(node) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isComment"])(node)) {
        return textContent(node.children);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
function innerText(node) {
    if (Array.isArray(node)) return node.map(innerText).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(node) && (node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ElementType"].Tag || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCDATA"])(node))) {
        return innerText(node.children);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
}),
"[project]/node_modules/domutils/lib/esm/traversal.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAttributeValue",
    ()=>getAttributeValue,
    "getChildren",
    ()=>getChildren,
    "getName",
    ()=>getName,
    "getParent",
    ()=>getParent,
    "getSiblings",
    ()=>getSiblings,
    "hasAttrib",
    ()=>hasAttrib,
    "nextElementSibling",
    ()=>nextElementSibling,
    "prevElementSibling",
    ()=>prevElementSibling
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
function getChildren(elem) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hasChildren"])(elem) ? elem.children : [];
}
function getParent(elem) {
    return elem.parent || null;
}
function getSiblings(elem) {
    const parent = getParent(elem);
    if (parent != null) return getChildren(parent);
    const siblings = [
        elem
    ];
    let { prev, next } = elem;
    while(prev != null){
        siblings.unshift(prev);
        ({ prev } = prev);
    }
    while(next != null){
        siblings.push(next);
        ({ next } = next);
    }
    return siblings;
}
function getAttributeValue(elem, name) {
    var _a;
    return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
function hasAttrib(elem, name) {
    return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
}
function getName(elem) {
    return elem.name;
}
function nextElementSibling(elem) {
    let { next } = elem;
    while(next !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(next))({ next } = next);
    return next;
}
function prevElementSibling(elem) {
    let { prev } = elem;
    while(prev !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"])(prev))({ prev } = prev);
    return prev;
}
}),
"[project]/node_modules/encoding-sniffer/dist/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DecodeStream",
    ()=>DecodeStream,
    "decodeBuffer",
    ()=>decodeBuffer
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:stream [external] (node:stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$iconv$2d$lite$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/iconv-lite/lib/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$sniffer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/encoding-sniffer/dist/esm/sniffer.js [app-rsc] (ecmascript)");
;
;
;
function decodeBuffer(buffer, options = {}) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$iconv$2d$lite$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].decode(buffer, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$sniffer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getEncoding"])(buffer, options));
}
class DecodeStream extends __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__["Transform"] {
    constructor(options){
        var _a;
        super({
            decodeStrings: false,
            encoding: "utf-8"
        });
        this.buffers = [];
        /** The iconv decode stream. If it is set, we have read more than `options.maxBytes` bytes. */ this.iconv = null;
        this.readBytes = 0;
        this.sniffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$encoding$2d$sniffer$2f$dist$2f$esm$2f$sniffer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Sniffer"](options);
        this.maxBytes = (_a = options === null || options === void 0 ? void 0 : options.maxBytes) !== null && _a !== void 0 ? _a : 1024;
    }
    _transform(chunk, _encoding, callback) {
        if (this.readBytes < this.maxBytes) {
            this.sniffer.write(chunk);
            this.readBytes += chunk.length;
            if (this.readBytes < this.maxBytes) {
                this.buffers.push(chunk);
                callback();
                return;
            }
        }
        this.getIconvStream().write(chunk, callback);
    }
    getIconvStream() {
        if (this.iconv) {
            return this.iconv;
        }
        const stream = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$iconv$2d$lite$2f$lib$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].decodeStream(this.sniffer.encoding);
        stream.on("data", (chunk)=>this.push(chunk, "utf-8"));
        stream.on("end", ()=>this.push(null));
        this.iconv = stream;
        for (const buffer of this.buffers){
            stream.write(buffer);
        }
        this.buffers.length = 0;
        return stream;
    }
    _flush(callback) {
        this.getIconvStream().end(callback);
    }
}
;
}),
"[project]/node_modules/encoding-sniffer/dist/esm/sniffer.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResultType",
    ()=>ResultType,
    "STRINGS",
    ()=>STRINGS,
    "Sniffer",
    ()=>Sniffer,
    "getEncoding",
    ()=>getEncoding
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$whatwg$2d$encoding$2f$lib$2f$whatwg$2d$encoding$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/whatwg-encoding/lib/whatwg-encoding.js [app-rsc] (ecmascript)");
;
// https://html.spec.whatwg.org/multipage/syntax.html#prescan-a-byte-stream-to-determine-its-encoding
var State;
(function(State) {
    // Before anything starts; can be any of BOM, UTF-16 XML declarations or meta tags
    State[State["Begin"] = 0] = "Begin";
    // Inside of a BOM
    State[State["BOM16BE"] = 1] = "BOM16BE";
    State[State["BOM16LE"] = 2] = "BOM16LE";
    State[State["BOM8"] = 3] = "BOM8";
    // XML prefix
    State[State["UTF16LE_XML_PREFIX"] = 4] = "UTF16LE_XML_PREFIX";
    State[State["BeginLT"] = 5] = "BeginLT";
    State[State["UTF16BE_XML_PREFIX"] = 6] = "UTF16BE_XML_PREFIX";
    // Waiting for opening `<`
    State[State["BeforeTag"] = 7] = "BeforeTag";
    // After the opening `<`
    State[State["BeforeTagName"] = 8] = "BeforeTagName";
    // After `</`
    State[State["BeforeCloseTagName"] = 9] = "BeforeCloseTagName";
    // Beginning of a comment
    State[State["CommentStart"] = 10] = "CommentStart";
    // End of a comment
    State[State["CommentEnd"] = 11] = "CommentEnd";
    // A tag name that could be `meta`
    State[State["TagNameMeta"] = 12] = "TagNameMeta";
    // A tag name that is not `meta`
    State[State["TagNameOther"] = 13] = "TagNameOther";
    // XML declaration
    State[State["XMLDeclaration"] = 14] = "XMLDeclaration";
    State[State["XMLDeclarationBeforeEncoding"] = 15] = "XMLDeclarationBeforeEncoding";
    State[State["XMLDeclarationAfterEncoding"] = 16] = "XMLDeclarationAfterEncoding";
    State[State["XMLDeclarationBeforeValue"] = 17] = "XMLDeclarationBeforeValue";
    State[State["XMLDeclarationValue"] = 18] = "XMLDeclarationValue";
    // Anything that looks like a tag, but doesn't fit in the above categories
    State[State["WeirdTag"] = 19] = "WeirdTag";
    State[State["BeforeAttribute"] = 20] = "BeforeAttribute";
    /*
     * Attributes in meta tag — we compare them to our set here, and back out
     * We care about four attributes: http-equiv, content-type, content, charset
     */ State[State["MetaAttribHttpEquiv"] = 21] = "MetaAttribHttpEquiv";
    // The value has to be `content-type`
    State[State["MetaAttribHttpEquivValue"] = 22] = "MetaAttribHttpEquivValue";
    State[State["MetaAttribC"] = 23] = "MetaAttribC";
    State[State["MetaAttribContent"] = 24] = "MetaAttribContent";
    State[State["MetaAttribCharset"] = 25] = "MetaAttribCharset";
    // Waiting for whitespace
    State[State["MetaAttribAfterName"] = 26] = "MetaAttribAfterName";
    State[State["MetaContentValueQuotedBeforeEncoding"] = 27] = "MetaContentValueQuotedBeforeEncoding";
    State[State["MetaContentValueQuotedAfterEncoding"] = 28] = "MetaContentValueQuotedAfterEncoding";
    State[State["MetaContentValueQuotedBeforeValue"] = 29] = "MetaContentValueQuotedBeforeValue";
    State[State["MetaContentValueQuotedValueQuoted"] = 30] = "MetaContentValueQuotedValueQuoted";
    State[State["MetaContentValueQuotedValueUnquoted"] = 31] = "MetaContentValueQuotedValueUnquoted";
    State[State["MetaContentValueUnquotedBeforeEncoding"] = 32] = "MetaContentValueUnquotedBeforeEncoding";
    State[State["MetaContentValueUnquotedBeforeValue"] = 33] = "MetaContentValueUnquotedBeforeValue";
    State[State["MetaContentValueUnquotedValueQuoted"] = 34] = "MetaContentValueUnquotedValueQuoted";
    State[State["MetaContentValueUnquotedValueUnquoted"] = 35] = "MetaContentValueUnquotedValueUnquoted";
    State[State["AnyAttribName"] = 36] = "AnyAttribName";
    // After the name of an attribute, before the equals sign
    State[State["AfterAttributeName"] = 37] = "AfterAttributeName";
    // After `=`
    State[State["BeforeAttributeValue"] = 38] = "BeforeAttributeValue";
    State[State["AttributeValueQuoted"] = 39] = "AttributeValueQuoted";
    State[State["AttributeValueUnquoted"] = 40] = "AttributeValueUnquoted";
})(State || (State = {}));
var ResultType;
(function(ResultType) {
    // Byte order mark
    ResultType[ResultType["BOM"] = 0] = "BOM";
    // User- or transport layer-defined
    ResultType[ResultType["PASSED"] = 1] = "PASSED";
    // XML prefixes
    ResultType[ResultType["XML_PREFIX"] = 2] = "XML_PREFIX";
    // Meta tag
    ResultType[ResultType["META_TAG"] = 3] = "META_TAG";
    // XML encoding
    ResultType[ResultType["XML_ENCODING"] = 4] = "XML_ENCODING";
    // Default
    ResultType[ResultType["DEFAULT"] = 5] = "DEFAULT";
})(ResultType || (ResultType = {}));
var AttribType;
(function(AttribType) {
    AttribType[AttribType["None"] = 0] = "None";
    AttribType[AttribType["HttpEquiv"] = 1] = "HttpEquiv";
    AttribType[AttribType["Content"] = 2] = "Content";
    AttribType[AttribType["Charset"] = 3] = "Charset";
})(AttribType || (AttribType = {}));
var Chars;
(function(Chars) {
    Chars[Chars["NIL"] = 0] = "NIL";
    Chars[Chars["TAB"] = 9] = "TAB";
    Chars[Chars["LF"] = 10] = "LF";
    Chars[Chars["CR"] = 13] = "CR";
    Chars[Chars["SPACE"] = 32] = "SPACE";
    Chars[Chars["EXCLAMATION"] = 33] = "EXCLAMATION";
    Chars[Chars["DQUOTE"] = 34] = "DQUOTE";
    Chars[Chars["SQUOTE"] = 39] = "SQUOTE";
    Chars[Chars["DASH"] = 45] = "DASH";
    Chars[Chars["SLASH"] = 47] = "SLASH";
    Chars[Chars["SEMICOLON"] = 59] = "SEMICOLON";
    Chars[Chars["LT"] = 60] = "LT";
    Chars[Chars["EQUALS"] = 61] = "EQUALS";
    Chars[Chars["GT"] = 62] = "GT";
    Chars[Chars["QUESTION"] = 63] = "QUESTION";
    Chars[Chars["UpperA"] = 65] = "UpperA";
    Chars[Chars["UpperZ"] = 90] = "UpperZ";
    Chars[Chars["LowerA"] = 97] = "LowerA";
    Chars[Chars["LowerZ"] = 122] = "LowerZ";
})(Chars || (Chars = {}));
const SPACE_CHARACTERS = new Set([
    Chars.SPACE,
    Chars.LF,
    Chars.CR,
    Chars.TAB
]);
const END_OF_UNQUOTED_ATTRIBUTE_VALUE = new Set([
    Chars.SPACE,
    Chars.LF,
    Chars.CR,
    Chars.TAB,
    Chars.GT
]);
function toUint8Array(str) {
    const arr = new Uint8Array(str.length);
    for(let i = 0; i < str.length; i++){
        arr[i] = str.charCodeAt(i);
    }
    return arr;
}
const STRINGS = {
    UTF8_BOM: new Uint8Array([
        0xef,
        0xbb,
        0xbf
    ]),
    UTF16LE_BOM: new Uint8Array([
        0xff,
        0xfe
    ]),
    UTF16BE_BOM: new Uint8Array([
        0xfe,
        0xff
    ]),
    UTF16LE_XML_PREFIX: new Uint8Array([
        0x3c,
        0x0,
        0x3f,
        0x0,
        0x78,
        0x0
    ]),
    UTF16BE_XML_PREFIX: new Uint8Array([
        0x0,
        0x3c,
        0x0,
        0x3f,
        0x0,
        0x78
    ]),
    XML_DECLARATION: toUint8Array("<?xml"),
    ENCODING: toUint8Array("encoding"),
    META: toUint8Array("meta"),
    HTTP_EQUIV: toUint8Array("http-equiv"),
    CONTENT: toUint8Array("content"),
    CONTENT_TYPE: toUint8Array("content-type"),
    CHARSET: toUint8Array("charset"),
    COMMENT_START: toUint8Array("<!--"),
    COMMENT_END: toUint8Array("-->")
};
function isAsciiAlpha(c) {
    return c >= Chars.UpperA && c <= Chars.UpperZ || c >= Chars.LowerA && c <= Chars.LowerZ;
}
function isQuote(c) {
    return c === Chars.DQUOTE || c === Chars.SQUOTE;
}
class Sniffer {
    setResult(label, type) {
        if (this.resultType === ResultType.DEFAULT || this.resultType > type) {
            const encoding = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$whatwg$2d$encoding$2f$lib$2f$whatwg$2d$encoding$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["labelToName"])(label);
            if (encoding) {
                this.encoding = // Check if we are in a meta tag and the encoding is `x-user-defined`
                type === ResultType.META_TAG && encoding === "x-user-defined" ? "windows-1252" : (type === ResultType.META_TAG || type === ResultType.XML_ENCODING) && (encoding === "UTF-16LE" || encoding === "UTF-16BE") ? "UTF-8" : encoding;
                this.resultType = type;
            }
        }
    }
    constructor({ maxBytes = 1024, userEncoding, transportLayerEncodingLabel, defaultEncoding } = {}){
        /** The offset of the previous buffers. */ this.offset = 0;
        this.state = State.Begin;
        this.sectionIndex = 0;
        this.attribType = AttribType.None;
        /**
         * Indicates if the `http-equiv` is `content-type`.
         *
         * Initially `null`, a boolean when a value is found.
         */ this.gotPragma = null;
        this.needsPragma = null;
        this.inMetaTag = false;
        this.encoding = "windows-1252";
        this.resultType = ResultType.DEFAULT;
        this.quoteCharacter = 0;
        this.attributeValue = [];
        this.maxBytes = maxBytes;
        if (userEncoding) {
            this.setResult(userEncoding, ResultType.PASSED);
        }
        if (transportLayerEncodingLabel) {
            this.setResult(transportLayerEncodingLabel, ResultType.PASSED);
        }
        if (defaultEncoding) {
            this.setResult(defaultEncoding, ResultType.DEFAULT);
        }
    }
    stateBegin(c) {
        switch(c){
            case STRINGS.UTF16BE_BOM[0]:
                {
                    this.state = State.BOM16BE;
                    break;
                }
            case STRINGS.UTF16LE_BOM[0]:
                {
                    this.state = State.BOM16LE;
                    break;
                }
            case STRINGS.UTF8_BOM[0]:
                {
                    this.sectionIndex = 1;
                    this.state = State.BOM8;
                    break;
                }
            case Chars.NIL:
                {
                    this.state = State.UTF16BE_XML_PREFIX;
                    this.sectionIndex = 1;
                    break;
                }
            case Chars.LT:
                {
                    this.state = State.BeginLT;
                    break;
                }
            default:
                {
                    this.state = State.BeforeTag;
                }
        }
    }
    stateBeginLT(c) {
        if (c === Chars.NIL) {
            this.state = State.UTF16LE_XML_PREFIX;
            this.sectionIndex = 2;
        } else if (c === Chars.QUESTION) {
            this.state = State.XMLDeclaration;
            this.sectionIndex = 2;
        } else {
            this.state = State.BeforeTagName;
            this.stateBeforeTagName(c);
        }
    }
    stateUTF16BE_XML_PREFIX(c) {
        // Advance position in the section
        if (this.advanceSection(STRINGS.UTF16BE_XML_PREFIX, c)) {
            if (this.sectionIndex === STRINGS.UTF16BE_XML_PREFIX.length) {
                // We have the whole prefix
                this.setResult("utf-16be", ResultType.XML_PREFIX);
            }
        } else {
            this.state = State.BeforeTag;
            this.stateBeforeTag(c);
        }
    }
    stateUTF16LE_XML_PREFIX(c) {
        // Advance position in the section
        if (this.advanceSection(STRINGS.UTF16LE_XML_PREFIX, c)) {
            if (this.sectionIndex === STRINGS.UTF16LE_XML_PREFIX.length) {
                // We have the whole prefix
                this.setResult("utf-16le", ResultType.XML_PREFIX);
            }
        } else {
            this.state = State.BeforeTag;
            this.stateBeforeTag(c);
        }
    }
    stateBOM16LE(c) {
        if (c === STRINGS.UTF16LE_BOM[1]) {
            this.setResult("utf-16le", ResultType.BOM);
        } else {
            this.state = State.BeforeTag;
            this.stateBeforeTag(c);
        }
    }
    stateBOM16BE(c) {
        if (c === STRINGS.UTF16BE_BOM[1]) {
            this.setResult("utf-16be", ResultType.BOM);
        } else {
            this.state = State.BeforeTag;
            this.stateBeforeTag(c);
        }
    }
    stateBOM8(c) {
        if (this.advanceSection(STRINGS.UTF8_BOM, c) && this.sectionIndex === STRINGS.UTF8_BOM.length) {
            this.setResult("utf-8", ResultType.BOM);
        }
    }
    stateBeforeTag(c) {
        if (c === Chars.LT) {
            this.state = State.BeforeTagName;
            this.inMetaTag = false;
        }
    }
    /**
     * We have seen a `<`, and now have to figure out what to do.
     *
     * Options:
     *  - `<meta`
     *  - Any other tag
     *  - A closing tag
     *  - `<!--`
     *  - An XML declaration
     *
     */ stateBeforeTagName(c) {
        if (isAsciiAlpha(c)) {
            if ((c | 0x20) === STRINGS.META[0]) {
                this.sectionIndex = 1;
                this.state = State.TagNameMeta;
            } else {
                this.state = State.TagNameOther;
            }
        } else switch(c){
            case Chars.SLASH:
                {
                    this.state = State.BeforeCloseTagName;
                    break;
                }
            case Chars.EXCLAMATION:
                {
                    this.state = State.CommentStart;
                    this.sectionIndex = 2;
                    break;
                }
            case Chars.QUESTION:
                {
                    this.state = State.WeirdTag;
                    break;
                }
            default:
                {
                    this.state = State.BeforeTag;
                    this.stateBeforeTag(c);
                }
        }
    }
    stateBeforeCloseTagName(c) {
        this.state = isAsciiAlpha(c) ? State.TagNameOther : State.WeirdTag;
    }
    stateCommentStart(c) {
        if (this.advanceSection(STRINGS.COMMENT_START, c)) {
            if (this.sectionIndex === STRINGS.COMMENT_START.length) {
                this.state = State.CommentEnd;
                // The -- of the comment start can be part of the end.
                this.sectionIndex = 2;
            }
        } else {
            this.state = State.WeirdTag;
            this.stateWeirdTag(c);
        }
    }
    stateCommentEnd(c) {
        if (this.advanceSection(STRINGS.COMMENT_END, c)) {
            if (this.sectionIndex === STRINGS.COMMENT_END.length) {
                this.state = State.BeforeTag;
            }
        } else if (c === Chars.DASH) {
            /*
             * If we are here, we know we expected a `>` above.
             * Set this to 2, to support many dashes before the closing `>`.
             */ this.sectionIndex = 2;
        }
    }
    /**
     * Any section starting with `<!`, `<?`, `</`, without being a closing tag or comment.
     */ stateWeirdTag(c) {
        if (c === Chars.GT) {
            this.state = State.BeforeTag;
        }
    }
    /**
     * Advances the section, ignoring upper/lower case.
     *
     * Make sure the section has left-over characters before calling.
     *
     * @returns `false` if we did not match the section.
     */ advanceSectionIC(section, c) {
        return this.advanceSection(section, c | 0x20);
    }
    /**
     * Advances the section.
     *
     * Make sure the section has left-over characters before calling.
     *
     * @returns `false` if we did not match the section.
     */ advanceSection(section, c) {
        if (section[this.sectionIndex] === c) {
            this.sectionIndex++;
            return true;
        }
        this.sectionIndex = 0;
        return false;
    }
    stateTagNameMeta(c) {
        if (this.sectionIndex < STRINGS.META.length) {
            if (this.advanceSectionIC(STRINGS.META, c)) {
                return;
            }
        } else if (SPACE_CHARACTERS.has(c)) {
            this.inMetaTag = true;
            this.gotPragma = null;
            this.needsPragma = null;
            this.state = State.BeforeAttribute;
            return;
        }
        this.state = State.TagNameOther;
        // Reconsume in case there is a `>`.
        this.stateTagNameOther(c);
    }
    stateTagNameOther(c) {
        if (SPACE_CHARACTERS.has(c)) {
            this.state = State.BeforeAttribute;
        } else if (c === Chars.GT) {
            this.state = State.BeforeTag;
        }
    }
    stateBeforeAttribute(c) {
        if (SPACE_CHARACTERS.has(c)) return;
        if (this.inMetaTag) {
            const lower = c | 0x20;
            if (lower === STRINGS.HTTP_EQUIV[0]) {
                this.sectionIndex = 1;
                this.state = State.MetaAttribHttpEquiv;
                return;
            } else if (lower === STRINGS.CHARSET[0]) {
                this.sectionIndex = 1;
                this.state = State.MetaAttribC;
                return;
            }
        }
        this.state = c === Chars.SLASH || c === Chars.GT ? State.BeforeTag : State.AnyAttribName;
    }
    handleMetaAttrib(c, section, type) {
        if (this.advanceSectionIC(section, c)) {
            if (this.sectionIndex === section.length) {
                this.attribType = type;
                this.state = State.MetaAttribAfterName;
            }
        } else {
            this.state = State.AnyAttribName;
            this.stateAnyAttribName(c);
        }
    }
    stateMetaAttribHttpEquiv(c) {
        this.handleMetaAttrib(c, STRINGS.HTTP_EQUIV, AttribType.HttpEquiv);
    }
    stateMetaAttribC(c) {
        const lower = c | 0x20;
        if (lower === STRINGS.CHARSET[1]) {
            this.sectionIndex = 2;
            this.state = State.MetaAttribCharset;
        } else if (lower === STRINGS.CONTENT[1]) {
            this.sectionIndex = 2;
            this.state = State.MetaAttribContent;
        } else {
            this.state = State.AnyAttribName;
            this.stateAnyAttribName(c);
        }
    }
    stateMetaAttribCharset(c) {
        this.handleMetaAttrib(c, STRINGS.CHARSET, AttribType.Charset);
    }
    stateMetaAttribContent(c) {
        this.handleMetaAttrib(c, STRINGS.CONTENT, AttribType.Content);
    }
    stateMetaAttribAfterName(c) {
        if (SPACE_CHARACTERS.has(c) || c === Chars.EQUALS) {
            this.state = State.AfterAttributeName;
            this.stateAfterAttributeName(c);
        } else {
            this.state = State.AnyAttribName;
            this.stateAnyAttribName(c);
        }
    }
    stateAnyAttribName(c) {
        if (SPACE_CHARACTERS.has(c)) {
            this.attribType = AttribType.None;
            this.state = State.AfterAttributeName;
        } else if (c === Chars.SLASH || c === Chars.GT) {
            this.state = State.BeforeTag;
        } else if (c === Chars.EQUALS) {
            this.state = State.BeforeAttributeValue;
        }
    }
    stateAfterAttributeName(c) {
        if (SPACE_CHARACTERS.has(c)) return;
        if (c === Chars.EQUALS) {
            this.state = State.BeforeAttributeValue;
        } else {
            this.state = State.BeforeAttribute;
            this.stateBeforeAttribute(c);
        }
    }
    stateBeforeAttributeValue(c) {
        if (SPACE_CHARACTERS.has(c)) return;
        this.attributeValue.length = 0;
        this.sectionIndex = 0;
        if (isQuote(c)) {
            this.quoteCharacter = c;
            this.state = this.attribType === AttribType.Content ? State.MetaContentValueQuotedBeforeEncoding : this.attribType === AttribType.HttpEquiv ? State.MetaAttribHttpEquivValue : State.AttributeValueQuoted;
        } else if (this.attribType === AttribType.Content) {
            this.state = State.MetaContentValueUnquotedBeforeEncoding;
            this.stateMetaContentValueUnquotedBeforeEncoding(c);
        } else if (this.attribType === AttribType.HttpEquiv) {
            // We use `quoteCharacter = 0` to signify that the value is unquoted.
            this.quoteCharacter = 0;
            this.sectionIndex = 0;
            this.state = State.MetaAttribHttpEquivValue;
            this.stateMetaAttribHttpEquivValue(c);
        } else {
            this.state = State.AttributeValueUnquoted;
            this.stateAttributeValueUnquoted(c);
        }
    }
    // The value has to be `content-type`
    stateMetaAttribHttpEquivValue(c) {
        if (this.sectionIndex === STRINGS.CONTENT_TYPE.length) {
            if (this.quoteCharacter === 0 ? END_OF_UNQUOTED_ATTRIBUTE_VALUE.has(c) : c === this.quoteCharacter) {
                if (this.needsPragma !== null) {
                    this.setResult(this.needsPragma, ResultType.META_TAG);
                } else if (this.gotPragma === null) {
                    this.gotPragma = true;
                }
                this.state = State.BeforeAttribute;
                return;
            }
        } else if (this.advanceSectionIC(STRINGS.CONTENT_TYPE, c)) {
            return;
        }
        this.gotPragma = false;
        if (this.quoteCharacter === 0) {
            this.state = State.AttributeValueUnquoted;
            this.stateAttributeValueUnquoted(c);
        } else {
            this.state = State.AttributeValueQuoted;
            this.stateAttributeValueQuoted(c);
        }
    }
    handleMetaContentValue() {
        if (this.attributeValue.length === 0) return;
        const encoding = String.fromCharCode(...this.attributeValue);
        if (this.gotPragma) {
            this.setResult(encoding, ResultType.META_TAG);
        } else if (this.needsPragma === null) {
            // Don't override a previous result.
            this.needsPragma = encoding;
        }
        this.attributeValue.length = 0;
    }
    handleAttributeValue() {
        if (this.attribType === AttribType.Charset) {
            this.setResult(String.fromCharCode(...this.attributeValue), ResultType.META_TAG);
        }
    }
    stateAttributeValueUnquoted(c) {
        if (SPACE_CHARACTERS.has(c)) {
            this.handleAttributeValue();
            this.state = State.BeforeAttribute;
        } else if (c === Chars.SLASH || c === Chars.GT) {
            this.handleAttributeValue();
            this.state = State.BeforeTag;
        } else if (this.attribType === AttribType.Charset) {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    findMetaContentEncoding(c) {
        if (this.advanceSectionIC(STRINGS.CHARSET, c)) {
            if (this.sectionIndex === STRINGS.CHARSET.length) {
                return true;
            }
        } else {
            // If we encountered another `c`, assume we started over.
            this.sectionIndex = Number(c === STRINGS.CHARSET[0]);
        }
        return false;
    }
    stateMetaContentValueUnquotedBeforeEncoding(c) {
        if (END_OF_UNQUOTED_ATTRIBUTE_VALUE.has(c)) {
            this.stateAttributeValueUnquoted(c);
        } else if (this.sectionIndex === STRINGS.CHARSET.length) {
            if (c === Chars.EQUALS) {
                this.state = State.MetaContentValueUnquotedBeforeValue;
            }
        } else {
            this.findMetaContentEncoding(c);
        }
    }
    stateMetaContentValueUnquotedBeforeValue(c) {
        if (isQuote(c)) {
            this.quoteCharacter = c;
            this.state = State.MetaContentValueUnquotedValueQuoted;
        } else if (END_OF_UNQUOTED_ATTRIBUTE_VALUE.has(c)) {
            // Can't have spaces here, as it would no longer be part of the attribute value.
            this.stateAttributeValueUnquoted(c);
        } else {
            this.state = State.MetaContentValueUnquotedValueUnquoted;
            this.stateMetaContentValueUnquotedValueUnquoted(c);
        }
    }
    stateMetaContentValueUnquotedValueQuoted(c) {
        if (END_OF_UNQUOTED_ATTRIBUTE_VALUE.has(c)) {
            // Quotes weren't matched, so we're done.
            this.stateAttributeValueUnquoted(c);
        } else if (c === this.quoteCharacter) {
            this.handleMetaContentValue();
            this.state = State.AttributeValueUnquoted;
        } else {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    stateMetaContentValueUnquotedValueUnquoted(c) {
        if (END_OF_UNQUOTED_ATTRIBUTE_VALUE.has(c) || c === Chars.SEMICOLON) {
            this.handleMetaContentValue();
            this.state = State.AttributeValueUnquoted;
            this.stateAttributeValueUnquoted(c);
        } else {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    stateMetaContentValueQuotedValueUnquoted(c) {
        if (isQuote(c) || SPACE_CHARACTERS.has(c) || c === Chars.SEMICOLON) {
            this.handleMetaContentValue();
            // We are done with the value, but might not be at the end of the attribute
            this.state = State.AttributeValueQuoted;
            this.stateAttributeValueQuoted(c);
        } else {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    stateMetaContentValueQuotedValueQuoted(c) {
        if (isQuote(c)) {
            // We have reached the end of our value.
            if (c !== this.quoteCharacter) {
                // Only handle the value if inner quotes were matched.
                this.handleMetaContentValue();
            }
            this.state = State.AttributeValueQuoted;
            this.stateAttributeValueQuoted(c);
        } else {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    stateMetaContentValueQuotedBeforeEncoding(c) {
        if (c === this.quoteCharacter) {
            this.stateAttributeValueQuoted(c);
        } else if (this.findMetaContentEncoding(c)) {
            this.state = State.MetaContentValueQuotedAfterEncoding;
        }
    }
    stateMetaContentValueQuotedAfterEncoding(c) {
        if (c === Chars.EQUALS) {
            this.state = State.MetaContentValueQuotedBeforeValue;
        } else if (!SPACE_CHARACTERS.has(c)) {
            // Look for the next encoding
            this.state = State.MetaContentValueQuotedBeforeEncoding;
            this.stateMetaContentValueQuotedBeforeEncoding(c);
        }
    }
    stateMetaContentValueQuotedBeforeValue(c) {
        if (c === this.quoteCharacter) {
            this.stateAttributeValueQuoted(c);
        } else if (isQuote(c)) {
            this.state = State.MetaContentValueQuotedValueQuoted;
        } else if (!SPACE_CHARACTERS.has(c)) {
            this.state = State.MetaContentValueQuotedValueUnquoted;
            this.stateMetaContentValueQuotedValueUnquoted(c);
        }
    }
    stateAttributeValueQuoted(c) {
        if (c === this.quoteCharacter) {
            this.handleAttributeValue();
            this.state = State.BeforeAttribute;
        } else if (this.attribType === AttribType.Charset) {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    // Read STRINGS.XML_DECLARATION
    stateXMLDeclaration(c) {
        if (this.advanceSection(STRINGS.XML_DECLARATION, c)) {
            if (this.sectionIndex === STRINGS.XML_DECLARATION.length) {
                this.sectionIndex = 0;
                this.state = State.XMLDeclarationBeforeEncoding;
            }
        } else {
            this.state = State.WeirdTag;
        }
    }
    stateXMLDeclarationBeforeEncoding(c) {
        if (this.advanceSection(STRINGS.ENCODING, c)) {
            if (this.sectionIndex === STRINGS.ENCODING.length) {
                this.state = State.XMLDeclarationAfterEncoding;
            }
        } else if (c === Chars.GT) {
            this.state = State.BeforeTag;
        } else {
            // If we encountered another `c`, assume we started over.
            this.sectionIndex = Number(c === STRINGS.ENCODING[0]);
        }
    }
    stateXMLDeclarationAfterEncoding(c) {
        if (c === Chars.EQUALS) {
            this.state = State.XMLDeclarationBeforeValue;
        } else if (c > Chars.SPACE) {
            this.state = State.WeirdTag;
            this.stateWeirdTag(c);
        }
    }
    stateXMLDeclarationBeforeValue(c) {
        if (isQuote(c)) {
            this.attributeValue.length = 0;
            this.state = State.XMLDeclarationValue;
        } else if (c > Chars.SPACE) {
            this.state = State.WeirdTag;
            this.stateWeirdTag(c);
        }
    }
    stateXMLDeclarationValue(c) {
        if (isQuote(c)) {
            this.setResult(String.fromCharCode(...this.attributeValue), ResultType.XML_ENCODING);
            this.state = State.WeirdTag;
        } else if (c === Chars.GT) {
            this.state = State.BeforeTag;
        } else if (c <= Chars.SPACE) {
            this.state = State.WeirdTag;
        } else {
            this.attributeValue.push(c | (c >= 0x41 && c <= 0x5a ? 0x20 : 0));
        }
    }
    write(buffer) {
        let index = 0;
        for(; index < buffer.length && this.offset + index < this.maxBytes; index++){
            const c = buffer[index];
            switch(this.state){
                case State.Begin:
                    {
                        this.stateBegin(c);
                        break;
                    }
                case State.BOM16BE:
                    {
                        this.stateBOM16BE(c);
                        break;
                    }
                case State.BOM16LE:
                    {
                        this.stateBOM16LE(c);
                        break;
                    }
                case State.BOM8:
                    {
                        this.stateBOM8(c);
                        break;
                    }
                case State.UTF16LE_XML_PREFIX:
                    {
                        this.stateUTF16LE_XML_PREFIX(c);
                        break;
                    }
                case State.BeginLT:
                    {
                        this.stateBeginLT(c);
                        break;
                    }
                case State.UTF16BE_XML_PREFIX:
                    {
                        this.stateUTF16BE_XML_PREFIX(c);
                        break;
                    }
                case State.BeforeTag:
                    {
                        // Optimization: Skip all characters until we find a `<`
                        const idx = buffer.indexOf(Chars.LT, index);
                        if (idx === -1) {
                            // We are done with this buffer. Stay in the state and try on the next one.
                            index = buffer.length;
                        } else {
                            index = idx;
                            this.stateBeforeTag(Chars.LT);
                        }
                        break;
                    }
                case State.BeforeTagName:
                    {
                        this.stateBeforeTagName(c);
                        break;
                    }
                case State.BeforeCloseTagName:
                    {
                        this.stateBeforeCloseTagName(c);
                        break;
                    }
                case State.CommentStart:
                    {
                        this.stateCommentStart(c);
                        break;
                    }
                case State.CommentEnd:
                    {
                        this.stateCommentEnd(c);
                        break;
                    }
                case State.TagNameMeta:
                    {
                        this.stateTagNameMeta(c);
                        break;
                    }
                case State.TagNameOther:
                    {
                        this.stateTagNameOther(c);
                        break;
                    }
                case State.XMLDeclaration:
                    {
                        this.stateXMLDeclaration(c);
                        break;
                    }
                case State.XMLDeclarationBeforeEncoding:
                    {
                        this.stateXMLDeclarationBeforeEncoding(c);
                        break;
                    }
                case State.XMLDeclarationAfterEncoding:
                    {
                        this.stateXMLDeclarationAfterEncoding(c);
                        break;
                    }
                case State.XMLDeclarationBeforeValue:
                    {
                        this.stateXMLDeclarationBeforeValue(c);
                        break;
                    }
                case State.XMLDeclarationValue:
                    {
                        this.stateXMLDeclarationValue(c);
                        break;
                    }
                case State.WeirdTag:
                    {
                        this.stateWeirdTag(c);
                        break;
                    }
                case State.BeforeAttribute:
                    {
                        this.stateBeforeAttribute(c);
                        break;
                    }
                case State.MetaAttribHttpEquiv:
                    {
                        this.stateMetaAttribHttpEquiv(c);
                        break;
                    }
                case State.MetaAttribHttpEquivValue:
                    {
                        this.stateMetaAttribHttpEquivValue(c);
                        break;
                    }
                case State.MetaAttribC:
                    {
                        this.stateMetaAttribC(c);
                        break;
                    }
                case State.MetaAttribContent:
                    {
                        this.stateMetaAttribContent(c);
                        break;
                    }
                case State.MetaAttribCharset:
                    {
                        this.stateMetaAttribCharset(c);
                        break;
                    }
                case State.MetaAttribAfterName:
                    {
                        this.stateMetaAttribAfterName(c);
                        break;
                    }
                case State.MetaContentValueQuotedBeforeEncoding:
                    {
                        this.stateMetaContentValueQuotedBeforeEncoding(c);
                        break;
                    }
                case State.MetaContentValueQuotedAfterEncoding:
                    {
                        this.stateMetaContentValueQuotedAfterEncoding(c);
                        break;
                    }
                case State.MetaContentValueQuotedBeforeValue:
                    {
                        this.stateMetaContentValueQuotedBeforeValue(c);
                        break;
                    }
                case State.MetaContentValueQuotedValueQuoted:
                    {
                        this.stateMetaContentValueQuotedValueQuoted(c);
                        break;
                    }
                case State.MetaContentValueQuotedValueUnquoted:
                    {
                        this.stateMetaContentValueQuotedValueUnquoted(c);
                        break;
                    }
                case State.MetaContentValueUnquotedBeforeEncoding:
                    {
                        this.stateMetaContentValueUnquotedBeforeEncoding(c);
                        break;
                    }
                case State.MetaContentValueUnquotedBeforeValue:
                    {
                        this.stateMetaContentValueUnquotedBeforeValue(c);
                        break;
                    }
                case State.MetaContentValueUnquotedValueQuoted:
                    {
                        this.stateMetaContentValueUnquotedValueQuoted(c);
                        break;
                    }
                case State.MetaContentValueUnquotedValueUnquoted:
                    {
                        this.stateMetaContentValueUnquotedValueUnquoted(c);
                        break;
                    }
                case State.AnyAttribName:
                    {
                        this.stateAnyAttribName(c);
                        break;
                    }
                case State.AfterAttributeName:
                    {
                        this.stateAfterAttributeName(c);
                        break;
                    }
                case State.BeforeAttributeValue:
                    {
                        this.stateBeforeAttributeValue(c);
                        break;
                    }
                case State.AttributeValueQuoted:
                    {
                        this.stateAttributeValueQuoted(c);
                        break;
                    }
                case State.AttributeValueUnquoted:
                    {
                        this.stateAttributeValueUnquoted(c);
                        break;
                    }
            }
        }
        this.offset += index;
    }
}
function getEncoding(buffer, options) {
    const sniffer = new Sniffer(options);
    sniffer.write(buffer);
    return sniffer.encoding;
}
}),
"[project]/node_modules/htmlparser2/dist/esm/Parser.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Parser",
    ()=>Parser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/Tokenizer.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/node_modules/entities/dist/esm/decode.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2d$codepoint$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/node_modules/entities/dist/esm/decode-codepoint.js [app-rsc] (ecmascript)");
;
;
const formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea"
]);
const pTag = new Set([
    "p"
]);
const tableSectionTags = new Set([
    "thead",
    "tbody"
]);
const ddtTags = new Set([
    "dd",
    "dt"
]);
const rtpTags = new Set([
    "rt",
    "rp"
]);
const openImpliesClose = new Map([
    [
        "tr",
        new Set([
            "tr",
            "th",
            "td"
        ])
    ],
    [
        "th",
        new Set([
            "th"
        ])
    ],
    [
        "td",
        new Set([
            "thead",
            "th",
            "td"
        ])
    ],
    [
        "body",
        new Set([
            "head",
            "link",
            "script"
        ])
    ],
    [
        "li",
        new Set([
            "li"
        ])
    ],
    [
        "p",
        pTag
    ],
    [
        "h1",
        pTag
    ],
    [
        "h2",
        pTag
    ],
    [
        "h3",
        pTag
    ],
    [
        "h4",
        pTag
    ],
    [
        "h5",
        pTag
    ],
    [
        "h6",
        pTag
    ],
    [
        "select",
        formTags
    ],
    [
        "input",
        formTags
    ],
    [
        "output",
        formTags
    ],
    [
        "button",
        formTags
    ],
    [
        "datalist",
        formTags
    ],
    [
        "textarea",
        formTags
    ],
    [
        "option",
        new Set([
            "option"
        ])
    ],
    [
        "optgroup",
        new Set([
            "optgroup",
            "option"
        ])
    ],
    [
        "dd",
        ddtTags
    ],
    [
        "dt",
        ddtTags
    ],
    [
        "address",
        pTag
    ],
    [
        "article",
        pTag
    ],
    [
        "aside",
        pTag
    ],
    [
        "blockquote",
        pTag
    ],
    [
        "details",
        pTag
    ],
    [
        "div",
        pTag
    ],
    [
        "dl",
        pTag
    ],
    [
        "fieldset",
        pTag
    ],
    [
        "figcaption",
        pTag
    ],
    [
        "figure",
        pTag
    ],
    [
        "footer",
        pTag
    ],
    [
        "form",
        pTag
    ],
    [
        "header",
        pTag
    ],
    [
        "hr",
        pTag
    ],
    [
        "main",
        pTag
    ],
    [
        "nav",
        pTag
    ],
    [
        "ol",
        pTag
    ],
    [
        "pre",
        pTag
    ],
    [
        "section",
        pTag
    ],
    [
        "table",
        pTag
    ],
    [
        "ul",
        pTag
    ],
    [
        "rt",
        rtpTags
    ],
    [
        "rp",
        rtpTags
    ],
    [
        "tbody",
        tableSectionTags
    ],
    [
        "tfoot",
        tableSectionTags
    ]
]);
const voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
const foreignContextElements = new Set([
    "math",
    "svg"
]);
const htmlIntegrationElements = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignobject",
    "desc",
    "title"
]);
const reNameEnd = /\s|\//;
class Parser {
    constructor(cbs, options = {}){
        var _a, _b, _c, _d, _e, _f;
        this.options = options;
        /** The start index of the last event. */ this.startIndex = 0;
        /** The end index of the last event. */ this.endIndex = 0;
        /**
         * Store the start index of the current open tag,
         * so we can update the start index for attributes.
         */ this.openTagStart = 0;
        this.tagname = "";
        this.attribname = "";
        this.attribvalue = "";
        this.attribs = null;
        this.stack = [];
        this.buffers = [];
        this.bufferOffset = 0;
        /** The index of the last written buffer. Used when resuming after a `pause()`. */ this.writeIndex = 0;
        /** Indicates whether the parser has finished running / `.end` has been called. */ this.ended = false;
        this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
        this.htmlMode = !this.options.xmlMode;
        this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : this.htmlMode;
        this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : this.htmlMode;
        this.recognizeSelfClosing = (_c = options.recognizeSelfClosing) !== null && _c !== void 0 ? _c : !this.htmlMode;
        this.tokenizer = new ((_d = options.Tokenizer) !== null && _d !== void 0 ? _d : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(this.options, this);
        this.foreignContext = [
            !this.htmlMode
        ];
        (_f = (_e = this.cbs).onparserinit) === null || _f === void 0 ? void 0 : _f.call(_e, this);
    }
    // Tokenizer event handlers
    /** @internal */ ontext(start, endIndex) {
        var _a, _b;
        const data = this.getSlice(start, endIndex);
        this.endIndex = endIndex - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        this.startIndex = endIndex;
    }
    /** @internal */ ontextentity(cp, endIndex) {
        var _a, _b;
        this.endIndex = endIndex - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2d$codepoint$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fromCodePoint"])(cp));
        this.startIndex = endIndex;
    }
    /**
     * Checks if the current tag is a void element. Override this if you want
     * to specify your own additional void elements.
     */ isVoidElement(name) {
        return this.htmlMode && voidElements.has(name);
    }
    /** @internal */ onopentagname(start, endIndex) {
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        this.emitOpenTag(name);
    }
    emitOpenTag(name) {
        var _a, _b, _c, _d;
        this.openTagStart = this.startIndex;
        this.tagname = name;
        const impliesClose = this.htmlMode && openImpliesClose.get(name);
        if (impliesClose) {
            while(this.stack.length > 0 && impliesClose.has(this.stack[0])){
                const element = this.stack.shift();
                (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, element, true);
            }
        }
        if (!this.isVoidElement(name)) {
            this.stack.unshift(name);
            if (this.htmlMode) {
                if (foreignContextElements.has(name)) {
                    this.foreignContext.unshift(true);
                } else if (htmlIntegrationElements.has(name)) {
                    this.foreignContext.unshift(false);
                }
            }
        }
        (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
        if (this.cbs.onopentag) this.attribs = {};
    }
    endOpenTag(isImplied) {
        var _a, _b;
        this.startIndex = this.openTagStart;
        if (this.attribs) {
            (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs, isImplied);
            this.attribs = null;
        }
        if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
            this.cbs.onclosetag(this.tagname, true);
        }
        this.tagname = "";
    }
    /** @internal */ onopentagend(endIndex) {
        this.endIndex = endIndex;
        this.endOpenTag(false);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onclosetag(start, endIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        if (this.htmlMode && (foreignContextElements.has(name) || htmlIntegrationElements.has(name))) {
            this.foreignContext.shift();
        }
        if (!this.isVoidElement(name)) {
            const pos = this.stack.indexOf(name);
            if (pos !== -1) {
                for(let index = 0; index <= pos; index++){
                    const element = this.stack.shift();
                    // We know the stack has sufficient elements.
                    (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, element, index !== pos);
                }
            } else if (this.htmlMode && name === "p") {
                // Implicit open before close
                this.emitOpenTag("p");
                this.closeCurrentTag(true);
            }
        } else if (this.htmlMode && name === "br") {
            // We can't use `emitOpenTag` for implicit open, as `br` would be implicitly closed.
            (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, "br");
            (_f = (_e = this.cbs).onopentag) === null || _f === void 0 ? void 0 : _f.call(_e, "br", {}, true);
            (_h = (_g = this.cbs).onclosetag) === null || _h === void 0 ? void 0 : _h.call(_g, "br", false);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onselfclosingtag(endIndex) {
        this.endIndex = endIndex;
        if (this.recognizeSelfClosing || this.foreignContext[0]) {
            this.closeCurrentTag(false);
            // Set `startIndex` for next node
            this.startIndex = endIndex + 1;
        } else {
            // Ignore the fact that the tag is self-closing.
            this.onopentagend(endIndex);
        }
    }
    closeCurrentTag(isOpenImplied) {
        var _a, _b;
        const name = this.tagname;
        this.endOpenTag(isOpenImplied);
        // Self-closing tags will be on the top of the stack
        if (this.stack[0] === name) {
            // If the opening tag isn't implied, the closing tag has to be implied.
            (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name, !isOpenImplied);
            this.stack.shift();
        }
    }
    /** @internal */ onattribname(start, endIndex) {
        this.startIndex = start;
        const name = this.getSlice(start, endIndex);
        this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
    }
    /** @internal */ onattribdata(start, endIndex) {
        this.attribvalue += this.getSlice(start, endIndex);
    }
    /** @internal */ onattribentity(cp) {
        this.attribvalue += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2d$codepoint$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fromCodePoint"])(cp);
    }
    /** @internal */ onattribend(quote, endIndex) {
        var _a, _b;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QuoteType"].Double ? '"' : quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QuoteType"].Single ? "'" : quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QuoteType"].NoValue ? undefined : null);
        if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
            this.attribs[this.attribname] = this.attribvalue;
        }
        this.attribvalue = "";
    }
    getInstructionName(value) {
        const index = value.search(reNameEnd);
        let name = index < 0 ? value : value.substr(0, index);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        return name;
    }
    /** @internal */ ondeclaration(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onprocessinginstruction(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ oncomment(start, endIndex, offset) {
        var _a, _b, _c, _d;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, this.getSlice(start, endIndex - offset));
        (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ oncdata(start, endIndex, offset) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex - offset);
        if (!this.htmlMode || this.options.recognizeCDATA) {
            (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
            (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
            (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
        } else {
            (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, `[CDATA[${value}]]`);
            (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onend() {
        var _a, _b;
        if (this.cbs.onclosetag) {
            // Set the end index for all remaining tags
            this.endIndex = this.startIndex;
            for(let index = 0; index < this.stack.length; index++){
                this.cbs.onclosetag(this.stack[index], true);
            }
        }
        (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    /**
     * Resets the parser to a blank state, ready to parse a new HTML document
     */ reset() {
        var _a, _b, _c, _d;
        (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.tokenizer.reset();
        this.tagname = "";
        this.attribname = "";
        this.attribs = null;
        this.stack.length = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
        this.buffers.length = 0;
        this.foreignContext.length = 0;
        this.foreignContext.unshift(!this.htmlMode);
        this.bufferOffset = 0;
        this.writeIndex = 0;
        this.ended = false;
    }
    /**
     * Resets the parser, then parses a complete document and
     * pushes it to the handler.
     *
     * @param data Document to parse.
     */ parseComplete(data) {
        this.reset();
        this.end(data);
    }
    getSlice(start, end) {
        while(start - this.bufferOffset >= this.buffers[0].length){
            this.shiftBuffer();
        }
        let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
        while(end - this.bufferOffset > this.buffers[0].length){
            this.shiftBuffer();
            slice += this.buffers[0].slice(0, end - this.bufferOffset);
        }
        return slice;
    }
    shiftBuffer() {
        this.bufferOffset += this.buffers[0].length;
        this.writeIndex--;
        this.buffers.shift();
    }
    /**
     * Parses a chunk of data and calls the corresponding callbacks.
     *
     * @param chunk Chunk to parse.
     */ write(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".write() after done!"));
            return;
        }
        this.buffers.push(chunk);
        if (this.tokenizer.running) {
            this.tokenizer.write(chunk);
            this.writeIndex++;
        }
    }
    /**
     * Parses the end of the buffer and clears the stack, calls onend.
     *
     * @param chunk Optional final chunk to parse.
     */ end(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".end() after done!"));
            return;
        }
        if (chunk) this.write(chunk);
        this.ended = true;
        this.tokenizer.end();
    }
    /**
     * Pauses parsing. The parser won't emit events until `resume` is called.
     */ pause() {
        this.tokenizer.pause();
    }
    /**
     * Resumes parsing after `pause` was called.
     */ resume() {
        this.tokenizer.resume();
        while(this.tokenizer.running && this.writeIndex < this.buffers.length){
            this.tokenizer.write(this.buffers[this.writeIndex++]);
        }
        if (this.ended) this.tokenizer.end();
    }
    /**
     * Alias of `write`, for backwards compatibility.
     *
     * @param chunk Chunk to parse.
     * @deprecated
     */ parseChunk(chunk) {
        this.write(chunk);
    }
    /**
     * Alias of `end`, for backwards compatibility.
     *
     * @param chunk Optional final chunk to parse.
     * @deprecated
     */ done(chunk) {
        this.end(chunk);
    }
}
}),
"[project]/node_modules/htmlparser2/dist/esm/Tokenizer.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuoteType",
    ()=>QuoteType,
    "default",
    ()=>Tokenizer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/node_modules/entities/dist/esm/decode.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$generated$2f$decode$2d$data$2d$html$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/node_modules/entities/dist/esm/generated/decode-data-html.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$generated$2f$decode$2d$data$2d$xml$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/node_modules/entities/dist/esm/generated/decode-data-xml.js [app-rsc] (ecmascript)");
;
var CharCodes;
(function(CharCodes) {
    CharCodes[CharCodes["Tab"] = 9] = "Tab";
    CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
    CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
    CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
    CharCodes[CharCodes["Space"] = 32] = "Space";
    CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
    CharCodes[CharCodes["Number"] = 35] = "Number";
    CharCodes[CharCodes["Amp"] = 38] = "Amp";
    CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
    CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
    CharCodes[CharCodes["Dash"] = 45] = "Dash";
    CharCodes[CharCodes["Slash"] = 47] = "Slash";
    CharCodes[CharCodes["Zero"] = 48] = "Zero";
    CharCodes[CharCodes["Nine"] = 57] = "Nine";
    CharCodes[CharCodes["Semi"] = 59] = "Semi";
    CharCodes[CharCodes["Lt"] = 60] = "Lt";
    CharCodes[CharCodes["Eq"] = 61] = "Eq";
    CharCodes[CharCodes["Gt"] = 62] = "Gt";
    CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
    CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
    CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
    CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
    CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
    CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
    CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
    CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
    CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes || (CharCodes = {}));
/** All the states the tokenizer can be in. */ var State;
(function(State) {
    State[State["Text"] = 1] = "Text";
    State[State["BeforeTagName"] = 2] = "BeforeTagName";
    State[State["InTagName"] = 3] = "InTagName";
    State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
    State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
    State[State["InClosingTagName"] = 6] = "InClosingTagName";
    State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
    // Attributes
    State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
    State[State["InAttributeName"] = 9] = "InAttributeName";
    State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
    State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
    State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
    State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
    State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
    // Declarations
    State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
    State[State["InDeclaration"] = 16] = "InDeclaration";
    // Processing instructions
    State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
    // Comments & CDATA
    State[State["BeforeComment"] = 18] = "BeforeComment";
    State[State["CDATASequence"] = 19] = "CDATASequence";
    State[State["InSpecialComment"] = 20] = "InSpecialComment";
    State[State["InCommentLike"] = 21] = "InCommentLike";
    // Special tags
    State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
    State[State["BeforeSpecialT"] = 23] = "BeforeSpecialT";
    State[State["SpecialStartSequence"] = 24] = "SpecialStartSequence";
    State[State["InSpecialTag"] = 25] = "InSpecialTag";
    State[State["InEntity"] = 26] = "InEntity";
})(State || (State = {}));
function isWhitespace(c) {
    return c === CharCodes.Space || c === CharCodes.NewLine || c === CharCodes.Tab || c === CharCodes.FormFeed || c === CharCodes.CarriageReturn;
}
function isEndOfTagSection(c) {
    return c === CharCodes.Slash || c === CharCodes.Gt || isWhitespace(c);
}
function isASCIIAlpha(c) {
    return c >= CharCodes.LowerA && c <= CharCodes.LowerZ || c >= CharCodes.UpperA && c <= CharCodes.UpperZ;
}
var QuoteType;
(function(QuoteType) {
    QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
    QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
    QuoteType[QuoteType["Single"] = 2] = "Single";
    QuoteType[QuoteType["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
/**
 * Sequences used to match longer strings.
 *
 * We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
 * sequences with an increased offset.
 */ const Sequences = {
    Cdata: new Uint8Array([
        0x43,
        0x44,
        0x41,
        0x54,
        0x41,
        0x5b
    ]),
    CdataEnd: new Uint8Array([
        0x5d,
        0x5d,
        0x3e
    ]),
    CommentEnd: new Uint8Array([
        0x2d,
        0x2d,
        0x3e
    ]),
    ScriptEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x73,
        0x63,
        0x72,
        0x69,
        0x70,
        0x74
    ]),
    StyleEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x73,
        0x74,
        0x79,
        0x6c,
        0x65
    ]),
    TitleEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x74,
        0x69,
        0x74,
        0x6c,
        0x65
    ]),
    TextareaEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x74,
        0x65,
        0x78,
        0x74,
        0x61,
        0x72,
        0x65,
        0x61
    ]),
    XmpEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x78,
        0x6d,
        0x70
    ])
};
class Tokenizer {
    constructor({ xmlMode = false, decodeEntities = true }, cbs){
        this.cbs = cbs;
        /** The current state the tokenizer is in. */ this.state = State.Text;
        /** The read buffer. */ this.buffer = "";
        /** The beginning of the section that is currently being read. */ this.sectionStart = 0;
        /** The index within the buffer that we are currently looking at. */ this.index = 0;
        /** The start of the last entity. */ this.entityStart = 0;
        /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */ this.baseState = State.Text;
        /** For special parsing behavior inside of script and style tags. */ this.isSpecial = false;
        /** Indicates whether the tokenizer has been paused. */ this.running = true;
        /** The offset of the current buffer. */ this.offset = 0;
        this.currentSequence = undefined;
        this.sequenceIndex = 0;
        this.xmlMode = xmlMode;
        this.decodeEntities = decodeEntities;
        this.entityDecoder = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["EntityDecoder"](xmlMode ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$generated$2f$decode$2d$data$2d$xml$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["xmlDecodeTree"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$generated$2f$decode$2d$data$2d$html$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["htmlDecodeTree"], (cp, consumed)=>this.emitCodePoint(cp, consumed));
    }
    reset() {
        this.state = State.Text;
        this.buffer = "";
        this.sectionStart = 0;
        this.index = 0;
        this.baseState = State.Text;
        this.currentSequence = undefined;
        this.running = true;
        this.offset = 0;
    }
    write(chunk) {
        this.offset += this.buffer.length;
        this.buffer = chunk;
        this.parse();
    }
    end() {
        if (this.running) this.finish();
    }
    pause() {
        this.running = false;
    }
    resume() {
        this.running = true;
        if (this.index < this.buffer.length + this.offset) {
            this.parse();
        }
    }
    stateText(c) {
        if (c === CharCodes.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes.Lt)) {
            if (this.index > this.sectionStart) {
                this.cbs.ontext(this.sectionStart, this.index);
            }
            this.state = State.BeforeTagName;
            this.sectionStart = this.index;
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateSpecialStartSequence(c) {
        const isEnd = this.sequenceIndex === this.currentSequence.length;
        const isMatch = isEnd ? isEndOfTagSection(c) : (c | 0x20) === this.currentSequence[this.sequenceIndex];
        if (!isMatch) {
            this.isSpecial = false;
        } else if (!isEnd) {
            this.sequenceIndex++;
            return;
        }
        this.sequenceIndex = 0;
        this.state = State.InTagName;
        this.stateInTagName(c);
    }
    /** Look for an end tag. For <title> tags, also decode entities. */ stateInSpecialTag(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
            if (c === CharCodes.Gt || isWhitespace(c)) {
                const endOfText = this.index - this.currentSequence.length;
                if (this.sectionStart < endOfText) {
                    // Spoof the index so that reported locations match up.
                    const actualIndex = this.index;
                    this.index = endOfText;
                    this.cbs.ontext(this.sectionStart, endOfText);
                    this.index = actualIndex;
                }
                this.isSpecial = false;
                this.sectionStart = endOfText + 2; // Skip over the `</`
                this.stateInClosingTagName(c);
                return; // We are done; skip the rest of the function.
            }
            this.sequenceIndex = 0;
        }
        if ((c | 0x20) === this.currentSequence[this.sequenceIndex]) {
            this.sequenceIndex += 1;
        } else if (this.sequenceIndex === 0) {
            if (this.currentSequence === Sequences.TitleEnd) {
                // We have to parse entities in <title> tags.
                if (this.decodeEntities && c === CharCodes.Amp) {
                    this.startEntity();
                }
            } else if (this.fastForwardTo(CharCodes.Lt)) {
                // Outside of <title> tags, we can fast-forward.
                this.sequenceIndex = 1;
            }
        } else {
            // If we see a `<`, set the sequence index to 1; useful for eg. `<</script>`.
            this.sequenceIndex = Number(c === CharCodes.Lt);
        }
    }
    stateCDATASequence(c) {
        if (c === Sequences.Cdata[this.sequenceIndex]) {
            if (++this.sequenceIndex === Sequences.Cdata.length) {
                this.state = State.InCommentLike;
                this.currentSequence = Sequences.CdataEnd;
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
            }
        } else {
            this.sequenceIndex = 0;
            this.state = State.InDeclaration;
            this.stateInDeclaration(c); // Reconsume the character
        }
    }
    /**
     * When we wait for one specific character, we can speed things up
     * by skipping through the buffer until we find it.
     *
     * @returns Whether the character was found.
     */ fastForwardTo(c) {
        while(++this.index < this.buffer.length + this.offset){
            if (this.buffer.charCodeAt(this.index - this.offset) === c) {
                return true;
            }
        }
        /*
         * We increment the index at the end of the `parse` loop,
         * so set it to `buffer.length - 1` here.
         *
         * TODO: Refactor `parse` to increment index before calling states.
         */ this.index = this.buffer.length + this.offset - 1;
        return false;
    }
    /**
     * Comments and CDATA end with `-->` and `]]>`.
     *
     * Their common qualities are:
     * - Their end sequences have a distinct character they start with.
     * - That character is then repeated, so we have to check multiple repeats.
     * - All characters but the start character of the sequence can be skipped.
     */ stateInCommentLike(c) {
        if (c === this.currentSequence[this.sequenceIndex]) {
            if (++this.sequenceIndex === this.currentSequence.length) {
                if (this.currentSequence === Sequences.CdataEnd) {
                    this.cbs.oncdata(this.sectionStart, this.index, 2);
                } else {
                    this.cbs.oncomment(this.sectionStart, this.index, 2);
                }
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
                this.state = State.Text;
            }
        } else if (this.sequenceIndex === 0) {
            // Fast-forward to the first character of the sequence
            if (this.fastForwardTo(this.currentSequence[0])) {
                this.sequenceIndex = 1;
            }
        } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
            // Allow long sequences, eg. --->, ]]]>
            this.sequenceIndex = 0;
        }
    }
    /**
     * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
     *
     * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
     * We allow anything that wouldn't end the tag.
     */ isTagStartChar(c) {
        return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
    }
    startSpecial(sequence, offset) {
        this.isSpecial = true;
        this.currentSequence = sequence;
        this.sequenceIndex = offset;
        this.state = State.SpecialStartSequence;
    }
    stateBeforeTagName(c) {
        if (c === CharCodes.ExclamationMark) {
            this.state = State.BeforeDeclaration;
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.Questionmark) {
            this.state = State.InProcessingInstruction;
            this.sectionStart = this.index + 1;
        } else if (this.isTagStartChar(c)) {
            const lower = c | 0x20;
            this.sectionStart = this.index;
            if (this.xmlMode) {
                this.state = State.InTagName;
            } else if (lower === Sequences.ScriptEnd[2]) {
                this.state = State.BeforeSpecialS;
            } else if (lower === Sequences.TitleEnd[2] || lower === Sequences.XmpEnd[2]) {
                this.state = State.BeforeSpecialT;
            } else {
                this.state = State.InTagName;
            }
        } else if (c === CharCodes.Slash) {
            this.state = State.BeforeClosingTagName;
        } else {
            this.state = State.Text;
            this.stateText(c);
        }
    }
    stateInTagName(c) {
        if (isEndOfTagSection(c)) {
            this.cbs.onopentagname(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateBeforeClosingTagName(c) {
        if (isWhitespace(c)) {
        // Ignore
        } else if (c === CharCodes.Gt) {
            this.state = State.Text;
        } else {
            this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
            this.sectionStart = this.index;
        }
    }
    stateInClosingTagName(c) {
        if (c === CharCodes.Gt || isWhitespace(c)) {
            this.cbs.onclosetag(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.AfterClosingTagName;
            this.stateAfterClosingTagName(c);
        }
    }
    stateAfterClosingTagName(c) {
        // Skip everything until ">"
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeAttributeName(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onopentagend(this.index);
            if (this.isSpecial) {
                this.state = State.InSpecialTag;
                this.sequenceIndex = 0;
            } else {
                this.state = State.Text;
            }
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.Slash) {
            this.state = State.InSelfClosingTag;
        } else if (!isWhitespace(c)) {
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateInSelfClosingTag(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onselfclosingtag(this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
            this.isSpecial = false; // Reset special state, in case of self-closing special tags
        } else if (!isWhitespace(c)) {
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateInAttributeName(c) {
        if (c === CharCodes.Eq || isEndOfTagSection(c)) {
            this.cbs.onattribname(this.sectionStart, this.index);
            this.sectionStart = this.index;
            this.state = State.AfterAttributeName;
            this.stateAfterAttributeName(c);
        }
    }
    stateAfterAttributeName(c) {
        if (c === CharCodes.Eq) {
            this.state = State.BeforeAttributeValue;
        } else if (c === CharCodes.Slash || c === CharCodes.Gt) {
            this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        } else if (!isWhitespace(c)) {
            this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateBeforeAttributeValue(c) {
        if (c === CharCodes.DoubleQuote) {
            this.state = State.InAttributeValueDq;
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.SingleQuote) {
            this.state = State.InAttributeValueSq;
            this.sectionStart = this.index + 1;
        } else if (!isWhitespace(c)) {
            this.sectionStart = this.index;
            this.state = State.InAttributeValueNq;
            this.stateInAttributeValueNoQuotes(c); // Reconsume token
        }
    }
    handleInAttributeValue(c, quote) {
        if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(quote === CharCodes.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
            this.state = State.BeforeAttributeName;
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateInAttributeValueDoubleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.DoubleQuote);
    }
    stateInAttributeValueSingleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.SingleQuote);
    }
    stateInAttributeValueNoQuotes(c) {
        if (isWhitespace(c) || c === CharCodes.Gt) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(QuoteType.Unquoted, this.index);
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.startEntity();
        }
    }
    stateBeforeDeclaration(c) {
        if (c === CharCodes.OpeningSquareBracket) {
            this.state = State.CDATASequence;
            this.sequenceIndex = 0;
        } else {
            this.state = c === CharCodes.Dash ? State.BeforeComment : State.InDeclaration;
        }
    }
    stateInDeclaration(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.ondeclaration(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateInProcessingInstruction(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.onprocessinginstruction(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeComment(c) {
        if (c === CharCodes.Dash) {
            this.state = State.InCommentLike;
            this.currentSequence = Sequences.CommentEnd;
            // Allow short comments (eg. <!-->)
            this.sequenceIndex = 2;
            this.sectionStart = this.index + 1;
        } else {
            this.state = State.InDeclaration;
        }
    }
    stateInSpecialComment(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.oncomment(this.sectionStart, this.index, 0);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeSpecialS(c) {
        const lower = c | 0x20;
        if (lower === Sequences.ScriptEnd[3]) {
            this.startSpecial(Sequences.ScriptEnd, 4);
        } else if (lower === Sequences.StyleEnd[3]) {
            this.startSpecial(Sequences.StyleEnd, 4);
        } else {
            this.state = State.InTagName;
            this.stateInTagName(c); // Consume the token again
        }
    }
    stateBeforeSpecialT(c) {
        const lower = c | 0x20;
        switch(lower){
            case Sequences.TitleEnd[3]:
                {
                    this.startSpecial(Sequences.TitleEnd, 4);
                    break;
                }
            case Sequences.TextareaEnd[3]:
                {
                    this.startSpecial(Sequences.TextareaEnd, 4);
                    break;
                }
            case Sequences.XmpEnd[3]:
                {
                    this.startSpecial(Sequences.XmpEnd, 4);
                    break;
                }
            default:
                {
                    this.state = State.InTagName;
                    this.stateInTagName(c); // Consume the token again
                }
        }
    }
    startEntity() {
        this.baseState = this.state;
        this.state = State.InEntity;
        this.entityStart = this.index;
        this.entityDecoder.startEntity(this.xmlMode ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DecodingMode"].Strict : this.baseState === State.Text || this.baseState === State.InSpecialTag ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DecodingMode"].Legacy : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$node_modules$2f$entities$2f$dist$2f$esm$2f$decode$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DecodingMode"].Attribute);
    }
    stateInEntity() {
        const indexInBuffer = this.index - this.offset;
        const length = this.entityDecoder.write(this.buffer, indexInBuffer);
        // If `length` is positive, we are done with the entity.
        if (length >= 0) {
            this.state = this.baseState;
            if (length === 0) {
                this.index -= 1;
            }
        } else {
            if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes.Amp) {
                this.state = this.baseState;
                this.index -= 1;
                return;
            }
            // Mark buffer as consumed.
            this.index = this.offset + this.buffer.length - 1;
        }
    }
    /**
     * Remove data that has already been consumed from the buffer.
     */ cleanup() {
        // If we are inside of text or attributes, emit what we already have.
        if (this.running && this.sectionStart !== this.index) {
            if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
                this.cbs.ontext(this.sectionStart, this.index);
                this.sectionStart = this.index;
            } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
                this.cbs.onattribdata(this.sectionStart, this.index);
                this.sectionStart = this.index;
            }
        }
    }
    shouldContinue() {
        return this.index < this.buffer.length + this.offset && this.running;
    }
    /**
     * Iterates through the buffer, calling the function corresponding to the current state.
     *
     * States that are more likely to be hit are higher up, as a performance improvement.
     */ parse() {
        while(this.shouldContinue()){
            const c = this.buffer.charCodeAt(this.index - this.offset);
            switch(this.state){
                case State.Text:
                    {
                        this.stateText(c);
                        break;
                    }
                case State.SpecialStartSequence:
                    {
                        this.stateSpecialStartSequence(c);
                        break;
                    }
                case State.InSpecialTag:
                    {
                        this.stateInSpecialTag(c);
                        break;
                    }
                case State.CDATASequence:
                    {
                        this.stateCDATASequence(c);
                        break;
                    }
                case State.InAttributeValueDq:
                    {
                        this.stateInAttributeValueDoubleQuotes(c);
                        break;
                    }
                case State.InAttributeName:
                    {
                        this.stateInAttributeName(c);
                        break;
                    }
                case State.InCommentLike:
                    {
                        this.stateInCommentLike(c);
                        break;
                    }
                case State.InSpecialComment:
                    {
                        this.stateInSpecialComment(c);
                        break;
                    }
                case State.BeforeAttributeName:
                    {
                        this.stateBeforeAttributeName(c);
                        break;
                    }
                case State.InTagName:
                    {
                        this.stateInTagName(c);
                        break;
                    }
                case State.InClosingTagName:
                    {
                        this.stateInClosingTagName(c);
                        break;
                    }
                case State.BeforeTagName:
                    {
                        this.stateBeforeTagName(c);
                        break;
                    }
                case State.AfterAttributeName:
                    {
                        this.stateAfterAttributeName(c);
                        break;
                    }
                case State.InAttributeValueSq:
                    {
                        this.stateInAttributeValueSingleQuotes(c);
                        break;
                    }
                case State.BeforeAttributeValue:
                    {
                        this.stateBeforeAttributeValue(c);
                        break;
                    }
                case State.BeforeClosingTagName:
                    {
                        this.stateBeforeClosingTagName(c);
                        break;
                    }
                case State.AfterClosingTagName:
                    {
                        this.stateAfterClosingTagName(c);
                        break;
                    }
                case State.BeforeSpecialS:
                    {
                        this.stateBeforeSpecialS(c);
                        break;
                    }
                case State.BeforeSpecialT:
                    {
                        this.stateBeforeSpecialT(c);
                        break;
                    }
                case State.InAttributeValueNq:
                    {
                        this.stateInAttributeValueNoQuotes(c);
                        break;
                    }
                case State.InSelfClosingTag:
                    {
                        this.stateInSelfClosingTag(c);
                        break;
                    }
                case State.InDeclaration:
                    {
                        this.stateInDeclaration(c);
                        break;
                    }
                case State.BeforeDeclaration:
                    {
                        this.stateBeforeDeclaration(c);
                        break;
                    }
                case State.BeforeComment:
                    {
                        this.stateBeforeComment(c);
                        break;
                    }
                case State.InProcessingInstruction:
                    {
                        this.stateInProcessingInstruction(c);
                        break;
                    }
                case State.InEntity:
                    {
                        this.stateInEntity();
                        break;
                    }
            }
            this.index++;
        }
        this.cleanup();
    }
    finish() {
        if (this.state === State.InEntity) {
            this.entityDecoder.end();
            this.state = this.baseState;
        }
        this.handleTrailingData();
        this.cbs.onend();
    }
    /** Handle any trailing data. */ handleTrailingData() {
        const endIndex = this.buffer.length + this.offset;
        // If there is no remaining data, we are done.
        if (this.sectionStart >= endIndex) {
            return;
        }
        if (this.state === State.InCommentLike) {
            if (this.currentSequence === Sequences.CdataEnd) {
                this.cbs.oncdata(this.sectionStart, endIndex, 0);
            } else {
                this.cbs.oncomment(this.sectionStart, endIndex, 0);
            }
        } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {
        /*
             * If we are currently in an opening or closing tag, us not calling the
             * respective callback signals that the tag should be ignored.
             */ } else {
            this.cbs.ontext(this.sectionStart, endIndex);
        }
    }
    emitCodePoint(cp, consumed) {
        if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
            if (this.sectionStart < this.entityStart) {
                this.cbs.onattribdata(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.index = this.sectionStart - 1;
            this.cbs.onattribentity(cp);
        } else {
            if (this.sectionStart < this.entityStart) {
                this.cbs.ontext(this.sectionStart, this.entityStart);
            }
            this.sectionStart = this.entityStart + consumed;
            this.index = this.sectionStart - 1;
            this.cbs.ontextentity(cp, this.sectionStart);
        }
    }
}
}),
"[project]/node_modules/htmlparser2/dist/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDocumentStream",
    ()=>createDocumentStream,
    "createDomStream",
    ()=>createDomStream,
    "parseDOM",
    ()=>parseDOM,
    "parseDocument",
    ()=>parseDocument,
    "parseFeed",
    ()=>parseFeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/Parser.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/dist/esm/Tokenizer.js [app-rsc] (ecmascript)");
/*
 * All of the following exports exist for backwards-compatibility.
 * They should probably be removed eventually.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/feeds.js [app-rsc] (ecmascript)");
;
;
;
;
function parseDocument(data, options) {
    const handler = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DomHandler"](undefined, options);
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Parser"](handler, options).end(data);
    return handler.root;
}
function parseDOM(data, options) {
    return parseDocument(data, options).children;
}
function createDocumentStream(callback, options, elementCallback) {
    const handler = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DomHandler"]((error)=>callback(error, handler.root), options, elementCallback);
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Parser"](handler, options);
}
function createDomStream(callback, options, elementCallback) {
    const handler = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DomHandler"](callback, options, elementCallback);
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$dist$2f$esm$2f$Parser$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Parser"](handler, options);
}
;
;
;
;
const parseFeedDefaultOptions = {
    xmlMode: true
};
function parseFeed(feed, options = parseFeedDefaultOptions) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeed"])(parseDOM(feed, options));
}
;
}),
"[project]/node_modules/non-error/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NonError
]);
const isNonErrorSymbol = Symbol('isNonError');
function defineProperty(object, key, value) {
    Object.defineProperty(object, key, {
        value,
        writable: false,
        enumerable: false,
        configurable: false
    });
}
function stringify(value) {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'bigint') {
        return `${value}n`;
    }
    if (typeof value === 'symbol') {
        return value.toString();
    }
    if (typeof value === 'function') {
        return `[Function${value.name ? ` ${value.name}` : ' (anonymous)'}]`;
    }
    // TODO: Use `Error.isError` when targeting Node.js 24
    if (value instanceof Error) {
        try {
            return String(value);
        } catch  {
            return '<Unserializable error>';
        }
    }
    try {
        return JSON.stringify(value);
    } catch  {
        try {
            return String(value);
        } catch  {
            return '<Unserializable value>';
        }
    }
}
class NonError extends Error {
    constructor(value, { superclass: Superclass = Error } = {}){
        // If already a NonError, return it as-is
        if (NonError.isNonError(value)) {
            return value; // eslint-disable-line no-constructor-return
        }
        if (value instanceof Error) {
            throw new TypeError('Do not pass Error instances to NonError. Throw the error directly instead.');
        }
        super(`Non-error value: ${stringify(value)}`);
        if (Superclass !== Error) {
            // Change this instance's prototype to Superclass.prototype
            // This makes instanceof Superclass work
            Object.setPrototypeOf(this, Superclass.prototype);
        }
        defineProperty(this, 'name', 'NonError');
        defineProperty(this, isNonErrorSymbol, true);
        defineProperty(this, 'isNonError', true);
        defineProperty(this, 'value', value);
    }
    static isNonError(value) {
        return value?.[isNonErrorSymbol] === true;
    }
    static #handleCallback(callback, arguments_) {
        try {
            const result = callback(...arguments_);
            // If the result is thenable (Promise-like), handle async rejections
            if (result && typeof result.then === 'function') {
                return (async ()=>{
                    try {
                        return await result;
                    } catch (error) {
                        // TODO: Use `Error.isError` when targeting Node.js 24
                        if (error instanceof Error) {
                            throw error;
                        }
                        throw new NonError(error);
                    }
                })();
            }
            return result;
        } catch (error) {
            // TODO: Use `Error.isError` when targeting Node.js 24
            // If it's already an Error, re-throw as-is
            if (error instanceof Error) {
                throw error;
            }
            // Otherwise, wrap it in NonError
            throw new NonError(error);
        }
    }
    static try(callback) {
        return NonError.#handleCallback(callback, []);
    }
    static wrap(callback) {
        return (...arguments_)=>NonError.#handleCallback(callback, arguments_);
    }
    // This makes instanceof work even when using the `superclass` option
    static [Symbol.hasInstance](instance) {
        return NonError.isNonError(instance);
    }
}
}),
"[project]/node_modules/nth-check/lib/esm/compile.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compile",
    ()=>compile,
    "generate",
    ()=>generate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/boolbase/index.js [app-rsc] (ecmascript)");
;
function compile(parsed) {
    const a = parsed[0];
    // Subtract 1 from `b`, to convert from one- to zero-indexed.
    const b = parsed[1] - 1;
    /*
     * When `b <= 0`, `a * n` won't be lead to any matches for `a < 0`.
     * Besides, the specification states that no elements are
     * matched when `a` and `b` are 0.
     *
     * `b < 0` here as we subtracted 1 from `b` above.
     */ if (b < 0 && a <= 0) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].falseFunc;
    // When `a` is in the range -1..1, it matches any element (so only `b` is checked).
    if (a === -1) return (index)=>index <= b;
    if (a === 0) return (index)=>index === b;
    // When `b <= 0` and `a === 1`, they match any element.
    if (a === 1) return b < 0 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$boolbase$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].trueFunc : (index)=>index >= b;
    /*
     * Otherwise, modulo can be used to check if there is a match.
     *
     * Modulo doesn't care about the sign, so let's use `a`s absolute value.
     */ const absA = Math.abs(a);
    // Get `b mod a`, + a if this is negative.
    const bMod = (b % absA + absA) % absA;
    return a > 1 ? (index)=>index >= b && index % absA === bMod : (index)=>index <= b && index % absA === bMod;
}
function generate(parsed) {
    const a = parsed[0];
    // Subtract 1 from `b`, to convert from one- to zero-indexed.
    let b = parsed[1] - 1;
    let n = 0;
    // Make sure to always return an increasing sequence
    if (a < 0) {
        const aPos = -a;
        // Get `b mod a`
        const minValue = (b % aPos + aPos) % aPos;
        return ()=>{
            const val = minValue + aPos * n++;
            return val > b ? null : val;
        };
    }
    if (a === 0) return b < 0 ? ()=>null : ()=>n++ === 0 ? b : null;
    if (b < 0) {
        b += a * Math.ceil(-b / a);
    }
    return ()=>a * n++ + b;
}
}),
"[project]/node_modules/nth-check/lib/esm/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>nthCheck,
    "sequence",
    ()=>sequence
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nth-check/lib/esm/parse.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nth-check/lib/esm/compile.js [app-rsc] (ecmascript)");
;
;
;
function nthCheck(formula) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["compile"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(formula));
}
function sequence(formula) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$compile$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generate"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nth$2d$check$2f$lib$2f$esm$2f$parse$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["parse"])(formula));
}
}),
"[project]/node_modules/nth-check/lib/esm/parse.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parse",
    ()=>parse
]);
// Following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo
// Whitespace as per https://www.w3.org/TR/selectors-3/#lex is " \t\r\n\f"
const whitespace = new Set([
    9,
    10,
    12,
    13,
    32
]);
const ZERO = "0".charCodeAt(0);
const NINE = "9".charCodeAt(0);
function parse(formula) {
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
        return [
            2,
            0
        ];
    } else if (formula === "odd") {
        return [
            2,
            1
        ];
    }
    // Parse [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
    let idx = 0;
    let a = 0;
    let sign = readSign();
    let number = readNumber();
    if (idx < formula.length && formula.charAt(idx) === "n") {
        idx++;
        a = sign * (number !== null && number !== void 0 ? number : 1);
        skipWhitespace();
        if (idx < formula.length) {
            sign = readSign();
            skipWhitespace();
            number = readNumber();
        } else {
            sign = number = 0;
        }
    }
    // Throw if there is anything else
    if (number === null || idx < formula.length) {
        throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
    }
    return [
        a,
        sign * number
    ];
    //TURBOPACK unreachable
    ;
    function readSign() {
        if (formula.charAt(idx) === "-") {
            idx++;
            return -1;
        }
        if (formula.charAt(idx) === "+") {
            idx++;
        }
        return 1;
    }
    function readNumber() {
        const start = idx;
        let value = 0;
        while(idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE){
            value = value * 10 + (formula.charCodeAt(idx) - ZERO);
            idx++;
        }
        // Return `null` if we didn't read anything.
        return idx === start ? null : value;
    }
    function skipWhitespace() {
        while(idx < formula.length && whitespace.has(formula.charCodeAt(idx))){
            idx++;
        }
    }
}
}),
"[project]/node_modules/parse5-htmlparser2-tree-adapter/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adapter",
    ()=>adapter,
    "serializeDoctypeContent",
    ()=>serializeDoctypeContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$common$2f$html$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__html__$2e$DOCUMENT_MODE$3e$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/common/html.js [app-rsc] (ecmascript) <export * as html .DOCUMENT_MODE>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-rsc] (ecmascript)");
;
;
function enquoteDoctypeId(id) {
    const quote = id.includes('"') ? "'" : '"';
    return quote + id + quote;
}
function serializeDoctypeContent(name, publicId, systemId) {
    let str = '!DOCTYPE ';
    if (name) {
        str += name;
    }
    if (publicId) {
        str += ` PUBLIC ${enquoteDoctypeId(publicId)}`;
    } else if (systemId) {
        str += ' SYSTEM';
    }
    if (systemId) {
        str += ` ${enquoteDoctypeId(systemId)}`;
    }
    return str;
}
const adapter = {
    // Re-exports from domhandler
    isCommentNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isComment"],
    isElementNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isTag"],
    isTextNode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"],
    //Node construction
    createDocument () {
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"]([]);
        node['x-mode'] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$common$2f$html$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__html__$2e$DOCUMENT_MODE$3e$__["html"].DOCUMENT_MODE.NO_QUIRKS;
        return node;
    },
    createDocumentFragment () {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Document"]([]);
    },
    createElement (tagName, namespaceURI, attrs) {
        const attribs = Object.create(null);
        const attribsNamespace = Object.create(null);
        const attribsPrefix = Object.create(null);
        for(let i = 0; i < attrs.length; i++){
            const attrName = attrs[i].name;
            attribs[attrName] = attrs[i].value;
            attribsNamespace[attrName] = attrs[i].namespace;
            attribsPrefix[attrName] = attrs[i].prefix;
        }
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Element"](tagName, attribs, []);
        node.namespace = namespaceURI;
        node['x-attribsNamespace'] = attribsNamespace;
        node['x-attribsPrefix'] = attribsPrefix;
        return node;
    },
    createCommentNode (data) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Comment"](data);
    },
    createTextNode (value) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Text"](value);
    },
    //Tree mutation
    appendChild (parentNode, newNode) {
        const prev = parentNode.children[parentNode.children.length - 1];
        if (prev) {
            prev.next = newNode;
            newNode.prev = prev;
        }
        parentNode.children.push(newNode);
        newNode.parent = parentNode;
    },
    insertBefore (parentNode, newNode, referenceNode) {
        const insertionIdx = parentNode.children.indexOf(referenceNode);
        const { prev } = referenceNode;
        if (prev) {
            prev.next = newNode;
            newNode.prev = prev;
        }
        referenceNode.prev = newNode;
        newNode.next = referenceNode;
        parentNode.children.splice(insertionIdx, 0, newNode);
        newNode.parent = parentNode;
    },
    setTemplateContent (templateElement, contentElement) {
        adapter.appendChild(templateElement, contentElement);
    },
    getTemplateContent (templateElement) {
        return templateElement.children[0];
    },
    setDocumentType (document, name, publicId, systemId) {
        const data = serializeDoctypeContent(name, publicId, systemId);
        let doctypeNode = document.children.find((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDirective"])(node) && node.name === '!doctype');
        if (doctypeNode) {
            doctypeNode.data = data !== null && data !== void 0 ? data : null;
        } else {
            doctypeNode = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ProcessingInstruction"]('!doctype', data);
            adapter.appendChild(document, doctypeNode);
        }
        doctypeNode['x-name'] = name;
        doctypeNode['x-publicId'] = publicId;
        doctypeNode['x-systemId'] = systemId;
    },
    setDocumentMode (document, mode) {
        document['x-mode'] = mode;
    },
    getDocumentMode (document) {
        return document['x-mode'];
    },
    detachNode (node) {
        if (node.parent) {
            const idx = node.parent.children.indexOf(node);
            const { prev, next } = node;
            node.prev = null;
            node.next = null;
            if (prev) {
                prev.next = next;
            }
            if (next) {
                next.prev = prev;
            }
            node.parent.children.splice(idx, 1);
            node.parent = null;
        }
    },
    insertText (parentNode, text) {
        const lastChild = parentNode.children[parentNode.children.length - 1];
        if (lastChild && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(lastChild)) {
            lastChild.data += text;
        } else {
            adapter.appendChild(parentNode, adapter.createTextNode(text));
        }
    },
    insertTextBefore (parentNode, text, referenceNode) {
        const prevNode = parentNode.children[parentNode.children.indexOf(referenceNode) - 1];
        if (prevNode && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isText"])(prevNode)) {
            prevNode.data += text;
        } else {
            adapter.insertBefore(parentNode, adapter.createTextNode(text), referenceNode);
        }
    },
    adoptAttributes (recipient, attrs) {
        for(let i = 0; i < attrs.length; i++){
            const attrName = attrs[i].name;
            if (recipient.attribs[attrName] === undefined) {
                recipient.attribs[attrName] = attrs[i].value;
                recipient['x-attribsNamespace'][attrName] = attrs[i].namespace;
                recipient['x-attribsPrefix'][attrName] = attrs[i].prefix;
            }
        }
    },
    //Tree traversing
    getFirstChild (node) {
        return node.children[0];
    },
    getChildNodes (node) {
        return node.children;
    },
    getParentNode (node) {
        return node.parent;
    },
    getAttrList (element) {
        return element.attributes;
    },
    //Node data
    getTagName (element) {
        return element.name;
    },
    getNamespaceURI (element) {
        return element.namespace;
    },
    getTextNodeContent (textNode) {
        return textNode.data;
    },
    getCommentNodeContent (commentNode) {
        return commentNode.data;
    },
    getDocumentTypeNodeName (doctypeNode) {
        var _a;
        return (_a = doctypeNode['x-name']) !== null && _a !== void 0 ? _a : '';
    },
    getDocumentTypeNodePublicId (doctypeNode) {
        var _a;
        return (_a = doctypeNode['x-publicId']) !== null && _a !== void 0 ? _a : '';
    },
    getDocumentTypeNodeSystemId (doctypeNode) {
        var _a;
        return (_a = doctypeNode['x-systemId']) !== null && _a !== void 0 ? _a : '';
    },
    //Node types
    isDocumentTypeNode (node) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isDirective"])(node) && node.name === '!doctype';
    },
    // Source code location
    setNodeSourceCodeLocation (node, location) {
        if (location) {
            node.startIndex = location.startOffset;
            node.endIndex = location.endOffset;
        }
        node.sourceCodeLocation = location;
    },
    getNodeSourceCodeLocation (node) {
        return node.sourceCodeLocation;
    },
    updateNodeSourceCodeLocation (node, endLocation) {
        if (endLocation.endOffset != null) node.endIndex = endLocation.endOffset;
        node.sourceCodeLocation = {
            ...node.sourceCodeLocation,
            ...endLocation
        };
    }
};
}),
"[project]/node_modules/parse5-parser-stream/dist/index.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParserStream",
    ()=>ParserStream
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:stream [external] (node:stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$parser$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parse5/dist/parser/index.js [app-rsc] (ecmascript)");
;
;
class ParserStream extends __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__["Writable"] {
    static getFragmentStream(fragmentContext, options) {
        const parser = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$parser$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Parser"].getFragmentParser(fragmentContext, options);
        const stream = new ParserStream(options, parser);
        return stream;
    }
    /** The resulting document node. */ get document() {
        return this.parser.document;
    }
    getFragment() {
        return this.parser.getFragment();
    }
    /**
     * @param options Parsing options.
     */ constructor(options, parser = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parse5$2f$dist$2f$parser$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Parser"](options)){
        super({
            decodeStrings: false
        });
        this.parser = parser;
        this.lastChunkWritten = false;
        this.writeCallback = undefined;
        this.pendingHtmlInsertions = [];
        const resume = ()=>{
            for(let i = this.pendingHtmlInsertions.length - 1; i >= 0; i--){
                this.parser.tokenizer.insertHtmlAtCurrentPos(this.pendingHtmlInsertions[i]);
            }
            this.pendingHtmlInsertions.length = 0;
            //NOTE: keep parsing if we don't wait for the next input chunk
            this.parser.tokenizer.resume(this.writeCallback);
        };
        const documentWrite = (html)=>{
            if (!this.parser.stopped) {
                this.pendingHtmlInsertions.push(html);
            }
        };
        const scriptHandler = (scriptElement)=>{
            if (this.listenerCount('script') > 0) {
                this.parser.tokenizer.pause();
                this.emit('script', scriptElement, documentWrite, resume);
            }
        };
        this.parser.scriptHandler = scriptHandler;
    }
    //WritableStream implementation
    _write(chunk, _encoding, callback) {
        if (typeof chunk !== 'string') {
            throw new TypeError('Parser can work only with string streams.');
        }
        this.writeCallback = callback;
        this.parser.tokenizer.write(chunk, this.lastChunkWritten, this.writeCallback);
    }
    // TODO [engine:node@>=16]: Due to issues with Node < 16, we are overriding `end` instead of `_final`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    end(chunk, encoding, callback) {
        this.lastChunkWritten = true;
        super.end(chunk || '', encoding, callback);
    }
}
}),
"[project]/node_modules/pend/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = Pend;
function Pend() {
    this.pending = 0;
    this.max = Infinity;
    this.listeners = [];
    this.waiting = [];
    this.error = null;
}
Pend.prototype.go = function(fn) {
    if (this.pending < this.max) {
        pendGo(this, fn);
    } else {
        this.waiting.push(fn);
    }
};
Pend.prototype.wait = function(cb) {
    if (this.pending === 0) {
        cb(this.error);
    } else {
        this.listeners.push(cb);
    }
};
Pend.prototype.hold = function() {
    return pendHold(this);
};
function pendHold(self) {
    self.pending += 1;
    var called = false;
    return onCb;
    //TURBOPACK unreachable
    ;
    function onCb(err) {
        if (called) throw new Error("callback called twice");
        called = true;
        self.error = self.error || err;
        self.pending -= 1;
        if (self.waiting.length > 0 && self.pending < self.max) {
            pendGo(self, self.waiting.shift());
        } else if (self.pending === 0) {
            var listeners = self.listeners;
            self.listeners = [];
            listeners.forEach(cbListener);
        }
    }
    function cbListener(listener) {
        listener(self.error);
    }
}
function pendGo(self, fn) {
    fn(pendHold(self));
}
}),
"[project]/node_modules/robots-parser/Robots.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

/**
 * Trims the white space from the start and end of the line.
 *
 * If the line is an array it will strip the white space from
 * the start and end of each element of the array.
 *
 * @param  {string|Array} line
 * @return {string|Array}
 * @private
 */ function trimLine(line) {
    if (!line) {
        return null;
    }
    if (Array.isArray(line)) {
        return line.map(trimLine);
    }
    return String(line).trim();
}
/**
 * Remove comments from lines
 *
 * @param {string} line
 * @return {string}
 * @private
 */ function removeComments(line) {
    var commentStartIndex = line.indexOf('#');
    if (commentStartIndex > -1) {
        return line.substr(0, commentStartIndex);
    }
    return line;
}
/**
 * Splits a line at the first occurrence of :
 *
 * @param  {string} line
 * @return {Array.<string>}
 * @private
 */ function splitLine(line) {
    var idx = String(line).indexOf(':');
    if (!line || idx < 0) {
        return null;
    }
    return [
        line.slice(0, idx),
        line.slice(idx + 1)
    ];
}
/**
 * Normalises the user-agent string by converting it to
 * lower case and removing any version numbers.
 *
 * @param  {string} userAgent
 * @return {string}
 * @private
 */ function formatUserAgent(userAgent) {
    var formattedUserAgent = userAgent.toLowerCase();
    // Strip the version number from robot/1.0 user agents
    var idx = formattedUserAgent.indexOf('/');
    if (idx > -1) {
        formattedUserAgent = formattedUserAgent.substr(0, idx);
    }
    return formattedUserAgent.trim();
}
/**
 * Normalises the URL encoding of a path by encoding
 * unicode characters.
 *
 * @param {string} path
 * @return {string}
 * @private
 */ function normaliseEncoding(path) {
    try {
        return urlEncodeToUpper(encodeURI(path).replace(/%25/g, '%'));
    } catch (e) {
        return path;
    }
}
/**
 * Convert URL encodings to support case.
 *
 * e.g.: %2a%ef becomes %2A%EF
 *
 * @param {string} path
 * @return {string}
 * @private
 */ function urlEncodeToUpper(path) {
    return path.replace(/%[0-9a-fA-F]{2}/g, function(match) {
        return match.toUpperCase();
    });
}
/**
 * Matches a pattern with the specified path
 *
 * Uses same algorithm to match patterns as the Google implementation in
 * google/robotstxt so it should be consistent with the spec.
 *
 * @see https://github.com/google/robotstxt/blob/f465f0ede81099dd8bc4aeb2966b3a892bd488b3/robots.cc#L74
 * @param {string} pattern
 * @param {string} path
 * @return {boolean}
 * @private
 */ function matches(pattern, path) {
    // I've added extra comments to try make this easier to understand
    // Stores the lengths of all the current matching substrings.
    // Maximum number of possible matching lengths is every length in path plus
    // 1 to handle 0 length too (if pattern starts with * which is zero or more)
    var matchingLengths = new Array(path.length + 1);
    var numMatchingLengths = 1;
    // Initially longest match is 0
    matchingLengths[0] = 0;
    for(var p = 0; p < pattern.length; p++){
        // If $ is at the end of pattern then we must match the whole path.
        // Which is true if the longest matching length matches path length
        if (pattern[p] === '$' && p + 1 === pattern.length) {
            return matchingLengths[numMatchingLengths - 1] === path.length;
        }
        // Handle wildcards
        if (pattern[p] == '*') {
            // Wildcard so all substrings minus the current smallest matching
            // length are matches
            numMatchingLengths = path.length - matchingLengths[0] + 1;
            // Update matching lengths to include the smallest all the way up
            // to numMatchingLengths
            // Don't update smallest possible match as * matches zero or more
            // so the smallest current match is also valid
            for(var i = 1; i < numMatchingLengths; i++){
                matchingLengths[i] = matchingLengths[i - 1] + 1;
            }
        } else {
            // Check the char at the matching length matches the pattern, if it
            // does increment it and add it as a valid length, ignore if not.
            var numMatches = 0;
            for(var i = 0; i < numMatchingLengths; i++){
                if (matchingLengths[i] < path.length && path[matchingLengths[i]] === pattern[p]) {
                    matchingLengths[numMatches++] = matchingLengths[i] + 1;
                }
            }
            // No paths matched the current pattern char so not a match
            if (numMatches == 0) {
                return false;
            }
            numMatchingLengths = numMatches;
        }
    }
    return true;
}
function parseRobots(contents, robots) {
    var newlineRegex = /\r\n|\r|\n/;
    var lines = contents.split(newlineRegex).map(removeComments).map(splitLine).map(trimLine);
    var currentUserAgents = [];
    var isNoneUserAgentState = true;
    for(var i = 0; i < lines.length; i++){
        var line = lines[i];
        if (!line || !line[0]) {
            continue;
        }
        switch(line[0].toLowerCase()){
            case 'user-agent':
                if (isNoneUserAgentState) {
                    currentUserAgents.length = 0;
                }
                if (line[1]) {
                    currentUserAgents.push(formatUserAgent(line[1]));
                }
                break;
            case 'disallow':
                robots.addRule(currentUserAgents, line[1], false, i + 1);
                break;
            case 'allow':
                robots.addRule(currentUserAgents, line[1], true, i + 1);
                break;
            case 'crawl-delay':
                robots.setCrawlDelay(currentUserAgents, line[1]);
                break;
            case 'sitemap':
                if (line[1]) {
                    robots.addSitemap(line[1]);
                }
                break;
            case 'host':
                if (line[1]) {
                    robots.setPreferredHost(line[1].toLowerCase());
                }
                break;
        }
        isNoneUserAgentState = line[0].toLowerCase() !== 'user-agent';
    }
}
/**
 * Returns if a pattern is allowed by the specified rules.
 *
 * @param  {string}  path
 * @param  {Array.<Object>}  rules
 * @return {Object?}
 * @private
 */ function findRule(path, rules) {
    var matchedRule = null;
    for(var i = 0; i < rules.length; i++){
        var rule = rules[i];
        if (!matches(rule.pattern, path)) {
            continue;
        }
        // The longest matching rule takes precedence
        // If rules are the same length then allow takes precedence
        if (!matchedRule || rule.pattern.length > matchedRule.pattern.length) {
            matchedRule = rule;
        } else if (rule.pattern.length == matchedRule.pattern.length && rule.allow && !matchedRule.allow) {
            matchedRule = rule;
        }
    }
    return matchedRule;
}
/**
 * Converts provided string into an URL object.
 *
 * Will return null if provided string is not a valid URL.
 *
 * @param {string} url
 * @return {?URL}
 * @private
 */ function parseUrl(url) {
    try {
        // Specify a URL to be used with relative paths
        // Using non-existent subdomain so can never cause conflict unless
        // trying to crawl it but doesn't exist and even if tried worst that can
        // happen is it allows relative URLs on it.
        var url = new URL(url, 'http://robots-relative.samclarke.com/');
        if (!url.port) {
            url.port = url.protocol === 'https:' ? 443 : 80;
        }
        return url;
    } catch (e) {
        return null;
    }
}
function Robots(url, contents) {
    this._url = parseUrl(url) || {};
    this._rules = Object.create(null);
    this._sitemaps = [];
    this._preferredHost = null;
    parseRobots(contents || '', this);
}
/**
 * Adds the specified allow/deny rule to the rules
 * for the specified user-agents.
 *
 * @param {Array.<string>} userAgents
 * @param {string} pattern
 * @param {boolean} allow
 * @param {number} [lineNumber] Should use 1-based indexing
 */ Robots.prototype.addRule = function(userAgents, pattern, allow, lineNumber) {
    var rules = this._rules;
    userAgents.forEach(function(userAgent) {
        rules[userAgent] = rules[userAgent] || [];
        if (!pattern) {
            return;
        }
        rules[userAgent].push({
            pattern: normaliseEncoding(pattern),
            allow: allow,
            lineNumber: lineNumber
        });
    });
};
/**
 * Adds the specified delay to the specified user agents.
 *
 * @param {Array.<string>} userAgents
 * @param {string} delayStr
 */ Robots.prototype.setCrawlDelay = function(userAgents, delayStr) {
    var rules = this._rules;
    var delay = Number(delayStr);
    userAgents.forEach(function(userAgent) {
        rules[userAgent] = rules[userAgent] || [];
        if (isNaN(delay)) {
            return;
        }
        rules[userAgent].crawlDelay = delay;
    });
};
/**
 * Add a sitemap
 *
 * @param {string} url
 */ Robots.prototype.addSitemap = function(url) {
    this._sitemaps.push(url);
};
/**
 * Sets the preferred host name
 *
 * @param {string} url
 */ Robots.prototype.setPreferredHost = function(url) {
    this._preferredHost = url;
};
Robots.prototype._getRule = function(url, ua) {
    var parsedUrl = parseUrl(url) || {};
    var userAgent = formatUserAgent(ua || '*');
    // The base URL must match otherwise this robots.txt is not valid for it.
    if (parsedUrl.protocol !== this._url.protocol || parsedUrl.hostname !== this._url.hostname || parsedUrl.port !== this._url.port) {
        return;
    }
    var rules = this._rules[userAgent] || this._rules['*'] || [];
    var path = urlEncodeToUpper(parsedUrl.pathname + parsedUrl.search);
    var rule = findRule(path, rules);
    return rule;
};
/**
 * Returns true if allowed, false if not allowed.
 *
 * Will return undefined if the URL is not valid for
 * this robots.txt file.
 *
 * @param  {string}  url
 * @param  {string?}  ua
 * @return {boolean?}
 */ Robots.prototype.isAllowed = function(url, ua) {
    var rule = this._getRule(url, ua);
    if (typeof rule === 'undefined') {
        return;
    }
    return !rule || rule.allow;
};
/**
 * Returns the line number of the matching directive for the specified
 * URL and user-agent if any.
 *
 * The line numbers start at 1 and go up (1-based indexing).
 *
 * Return -1 if there is no matching directive. If a rule is manually
 * added without a lineNumber then this will return undefined for that
 * rule.
 *
 * @param  {string}  url
 * @param  {string?}  ua
 * @return {number?}
 */ Robots.prototype.getMatchingLineNumber = function(url, ua) {
    var rule = this._getRule(url, ua);
    return rule ? rule.lineNumber : -1;
};
/**
 * Returns the opposite of isAllowed()
 *
 * @param  {string}  url
 * @param  {string}  ua
 * @return {boolean}
 */ Robots.prototype.isDisallowed = function(url, ua) {
    return !this.isAllowed(url, ua);
};
/**
 * Gets the crawl delay if there is one.
 *
 * Will return undefined if there is no crawl delay set.
 *
 * @param  {string} ua
 * @return {number?}
 */ Robots.prototype.getCrawlDelay = function(ua) {
    var userAgent = formatUserAgent(ua || '*');
    return (this._rules[userAgent] || this._rules['*'] || {}).crawlDelay;
};
/**
 * Returns the preferred host if there is one.
 *
 * @return {string?}
 */ Robots.prototype.getPreferredHost = function() {
    return this._preferredHost;
};
/**
 * Returns an array of sitemap URLs if there are any.
 *
 * @return {Array.<string>}
 */ Robots.prototype.getSitemaps = function() {
    return this._sitemaps.slice(0);
};
module.exports = Robots;
}),
"[project]/node_modules/robots-parser/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

var Robots = __turbopack_context__.r("[project]/node_modules/robots-parser/Robots.js [app-rsc] (ecmascript)");
module.exports = function(url, contents) {
    return new Robots(url, contents);
};
}),
"[project]/node_modules/safer-buffer/safer.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable node/no-deprecated-api */ var buffer = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)");
var Buffer = buffer.Buffer;
var safer = {};
var key;
for(key in buffer){
    if (!buffer.hasOwnProperty(key)) continue;
    if (key === 'SlowBuffer' || key === 'Buffer') continue;
    safer[key] = buffer[key];
}
var Safer = safer.Buffer = {};
for(key in Buffer){
    if (!Buffer.hasOwnProperty(key)) continue;
    if (key === 'allocUnsafe' || key === 'allocUnsafeSlow') continue;
    Safer[key] = Buffer[key];
}
safer.Buffer.prototype = Buffer.prototype;
if (!Safer.from || Safer.from === Uint8Array.from) {
    Safer.from = function(value, encodingOrOffset, length) {
        if (typeof value === 'number') {
            throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
        }
        if (value && typeof value.length === 'undefined') {
            throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type ' + typeof value);
        }
        return Buffer(value, encodingOrOffset, length);
    };
}
if (!Safer.alloc) {
    Safer.alloc = function(size, fill, encoding) {
        if (typeof size !== 'number') {
            throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
        }
        if (size < 0 || size >= 2 * (1 << 30)) {
            throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
        var buf = Buffer(size);
        if (!fill || fill.length === 0) {
            buf.fill(0);
        } else if (typeof encoding === 'string') {
            buf.fill(fill, encoding);
        } else {
            buf.fill(fill);
        }
        return buf;
    };
}
if (!safer.kStringMaxLength) {
    try {
        safer.kStringMaxLength = process.binding('buffer').kStringMaxLength;
    } catch (e) {
    // we can't determine kStringMaxLength in environments where process.binding
    // is unsupported, so let's not set it
    }
}
if (!safer.constants) {
    safer.constants = {
        MAX_LENGTH: safer.kMaxLength
    };
    if (safer.kStringMaxLength) {
        safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
    }
}
module.exports = safer;
}),
"[project]/node_modules/serialize-error/error-constructors.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addKnownErrorConstructor",
    ()=>addKnownErrorConstructor,
    "errorConstructors",
    ()=>errorConstructors,
    "errorFactories",
    ()=>errorFactories,
    "isErrorInstance",
    ()=>isErrorInstance
]);
const list = [
    // Native ES errors https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    AggregateError,
    // Built-in errors
    globalThis.DOMException,
    // Node-specific errors
    // https://nodejs.org/api/errors.html
    globalThis.AssertionError,
    globalThis.SystemError
]// Non-native Errors are used with `globalThis` because they might be missing. This filter drops them when undefined.
.filter(Boolean).map((constructor)=>[
        constructor.name,
        constructor
    ]);
const errorConstructors = new Map(list);
const errorFactories = new Map();
const isErrorInstance = (value)=>value instanceof Error || (Error.isError?.(value) ?? Object.prototype.toString.call(value) === '[object Error]');
function addKnownErrorConstructor(constructor, factory) {
    let instance;
    let resolvedName;
    if (typeof constructor !== 'function') {
        throw new TypeError('Constructor must be a function');
    }
    if (factory && typeof factory !== 'function') {
        throw new TypeError('Factory must be a function');
    }
    // Prove the pair can produce an instance, reading the name inside the guard so a throwing getter keeps this context
    try {
        instance = factory ? factory() : new constructor();
        resolvedName = instance.name;
    } catch (error) {
        const subject = factory ? 'Factory' : `Constructor "${constructor.name}"`;
        throw new Error(`${subject} is not compatible`, {
            cause: error
        });
    }
    // A factory can stand in for a constructor it is not, which would put the wrong prototype on the result
    if (factory && !(instance instanceof constructor)) {
        throw new TypeError('Factory must return an instance of the constructor');
    }
    // `deserializeError()` is typed as returning an `Error`, and this check gates the non-enumerable error properties
    if (!isErrorInstance(instance)) {
        throw new TypeError('Constructor must produce an instance of `Error`');
    }
    // `deserializeError()` adds the payload's properties to the instance, which a frozen or sealed one cannot take
    if (!Object.isExtensible(instance)) {
        throw new TypeError('Constructor must produce an extensible instance');
    }
    if (!resolvedName || typeof resolvedName !== 'string') {
        throw new TypeError('Error instances must have a non-empty string "name" property');
    }
    // `newError()` always returns a real `NonError` for this name, so registering it would be silently ignored
    if (resolvedName === 'NonError') {
        throw new Error('Error constructor name "NonError" is reserved');
    }
    if (errorConstructors.has(resolvedName)) {
        throw new Error(`Error constructor "${resolvedName}" is already known`);
    }
    errorConstructors.set(resolvedName, constructor);
    if (factory) {
        errorFactories.set(resolvedName, factory);
    }
}
}),
"[project]/node_modules/serialize-error/index.js [app-rsc] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializeError",
    ()=>deserializeError,
    "isErrorLike",
    ()=>isErrorLike,
    "serializeError",
    ()=>serializeError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$non$2d$error$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/non-error/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$serialize$2d$error$2f$error$2d$constructors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/serialize-error/error-constructors.js [app-rsc] (ecmascript)");
;
;
const errorProperties = [
    {
        property: 'name',
        enumerable: false
    },
    {
        property: 'message',
        enumerable: false
    },
    {
        property: 'stack',
        enumerable: false
    },
    {
        property: 'code',
        enumerable: true
    },
    {
        property: 'cause',
        enumerable: false
    },
    {
        property: 'errors',
        enumerable: false
    }
];
const toJsonWasCalled = new WeakSet();
const toJSON = (from)=>{
    toJsonWasCalled.add(from);
    try {
        return from.toJSON();
    } finally{
        toJsonWasCalled.delete(from);
    }
};
// Some errors expose getter-only properties that cannot be assigned to, like `DOMException.prototype.code`
const setProperty = (to, key, value)=>{
    try {
        to[key] = value;
    } catch  {}
};
// Derived from the descriptors so the two property loops always agree on which names they own.
const errorPropertyNames = new Set(errorProperties.map(({ property })=>property));
const newError = (name)=>{
    if (name === 'NonError') {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$non$2d$error$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]();
    }
    const factory = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$serialize$2d$error$2f$error$2d$constructors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["errorFactories"].get(name);
    if (factory) {
        return factory();
    }
    const ErrorConstructor = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$serialize$2d$error$2f$error$2d$constructors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["errorConstructors"].get(name) ?? Error;
    return ErrorConstructor === AggregateError ? new ErrorConstructor([]) : new ErrorConstructor();
};
// Returned for values that must not be copied, such as functions when serializing
const skip = Symbol('skip');
// Converts a single property value into its serialized form.
// Shared by the regular properties and the error properties so both get the same conversions.
// Reads `options` lazily rather than destructuring it, because this runs for every property of every object.
const destroyValue = (value, options, depth)=>{
    if (value && value instanceof Uint8Array && value.constructor?.name === 'Buffer') {
        return options.serialize ? '[object Buffer]' : value;
    }
    // Every stream is also an `EventEmitter`, so requiring `on` keeps plain objects that merely define `pipe` from being mistaken for one
    if (value !== null && typeof value === 'object' && typeof value.pipe === 'function' && typeof value.on === 'function') {
        return options.serialize ? '[object Stream]' : value;
    }
    if (typeof value === 'function') {
        return options.serialize ? skip : value;
    }
    if (options.serialize && typeof value === 'bigint') {
        return `${value}n`;
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    if (options.seen.has(value)) {
        return '[Circular]';
    }
    // Recursing through `destroyCircular` directly, rather than through a per-call wrapper, keeps the stack depth per level unchanged
    return destroyCircular({
        ...options,
        from: value,
        to: undefined,
        depth
    });
};
const createTarget = (from, serialize)=>{
    if (Array.isArray(from)) {
        return [];
    }
    if (!serialize && isErrorLike(from)) {
        return newError(from.name);
    }
    return {};
};
// Some errors have non-configurable properties that cannot be redefined.
// `addKnownErrorConstructor()` rejects a non-extensible instance, so a property `to` does not have yet can be added. That is only checked on the first call, and a constructor that freezes its instance later is unsupported.
const canRedefine = (to, property)=>Object.getOwnPropertyDescriptor(to, property)?.configurable !== false;
// Returned when a speculative read throws, so the property is skipped rather than written as `undefined`
const unreadable = Symbol('unreadable');
// The error property names are probed on every value walked, including plain objects that are not errors, and through
// the prototype chain, since `name` lives on `Error.prototype`. `JSON.stringify()` reads neither a non-enumerable nor
// an inherited property, so a getter on one of these would otherwise take the whole call down over a property it would
// never have read either. The regular property loop below is left alone, since it only reads keys `JSON.stringify()`
// reads too, and a throwing getter there propagates the same way it does natively.
const readProperty = (from, property)=>{
    try {
        return from[property];
    } catch  {
        return unreadable;
    }
};
// An error property the source did not set, which must not be invented. An own `null` or `undefined` is kept, because the source set it deliberately and `null` survives `JSON.stringify`.
// It does not have to be enumerable. `new Error('m', {cause: null})` and `deserializeError()` both set a non-enumerable one, and requiring enumerability lost it on a round trip.
// Takes the already-read value, so the property is only read once.
const isAbsent = (from, property, value)=>(value === undefined || value === null) && !Object.hasOwn(from, property);
const destroyCircular = (options)=>{
    const { from, seen, forceEnumerable, maxDepth, depth, useToJSON, serialize } = options;
    const to = options.to ?? createTarget(from, serialize);
    seen.add(from);
    if (depth >= maxDepth) {
        seen.delete(from);
        return to;
    }
    if (useToJSON && typeof from.toJSON === 'function' && !toJsonWasCalled.has(from)) {
        const json = toJSON(from);
        // A `toJSON()` returning its own receiver is a no-op, so keep serializing instead of handing back the original object
        if (json !== from) {
            seen.delete(from);
            return json;
        }
    }
    // Only a serialized result or a real error gets the error properties below. A nested plain object keeps these
    // names through the loop that follows instead, which is why that loop only steps aside in this case.
    // A registered constructor can come from another realm, so this cannot be a plain `instanceof`.
    const copyErrorProperties = serialize || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$serialize$2d$error$2f$error$2d$constructors$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isErrorInstance"])(to);
    // Copies error properties first; JavaScript still enumerates array-index keys before them. This also applies to nested plain objects when serializing.
    if (copyErrorProperties) {
        for (const { property, enumerable } of errorProperties){
            const rawValue = readProperty(from, property);
            if (rawValue === unreadable || isAbsent(from, property, rawValue)) {
                continue;
            }
            const value = destroyValue(rawValue, options, depth + 1);
            if (value === skip) {
                continue;
            }
            if (!canRedefine(to, property)) {
                setProperty(to, property, value);
                continue;
            }
            Object.defineProperty(to, property, {
                value,
                enumerable: forceEnumerable || enumerable,
                configurable: true,
                writable: true
            });
        }
    }
    for (const key of Object.keys(from)){
        // `JSON.parse` makes `__proto__` an own enumerable property, and assigning it would replace the prototype instead of adding a property
        if (key === '__proto__') {
            continue;
        }
        // Copying these here as well would destroy them twice, running getters and `toJSON()` twice
        if (copyErrorProperties && errorPropertyNames.has(key)) {
            continue;
        }
        const value = destroyValue(from[key], options, depth + 1);
        if (value !== skip) {
            setProperty(to, key, value);
        }
    }
    seen.delete(from);
    return to;
};
function serializeError(value, options = {}) {
    const { maxDepth = Number.POSITIVE_INFINITY, useToJSON = true } = options;
    // People sometimes throw things besides Error objects…
    if (typeof value !== 'object' || value === null) {
        value = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$non$2d$error$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"](typeof value === 'function' ? '<Function>' : value);
    }
    return destroyCircular({
        from: value,
        seen: new Set(),
        forceEnumerable: true,
        maxDepth,
        depth: 0,
        useToJSON,
        serialize: true
    });
}
function deserializeError(value, options = {}) {
    const { maxDepth = Number.POSITIVE_INFINITY } = options;
    if (value instanceof Error) {
        return value;
    }
    if (isMinimumViableSerializedError(value)) {
        return destroyCircular({
            from: value,
            seen: new Set(),
            to: newError(value.name),
            maxDepth,
            depth: 0,
            serialize: false
        });
    }
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$non$2d$error$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"](value);
}
function isErrorLike(value) {
    // A predicate answers yes or no, and this runs on every nested value while deserializing, so a getter on one of
    // the three names must not escape as an exception.
    return Boolean(value) && typeof value === 'object' && typeof readProperty(value, 'name') === 'string' && typeof readProperty(value, 'message') === 'string' && typeof readProperty(value, 'stack') === 'string';
}
// Used as a weak check for immediately-passed objects, whereas `isErrorLike` is used for nested values to avoid bad detection
function isMinimumViableSerializedError(value) {
    return Boolean(value) && typeof value === 'object' && typeof value.message === 'string' && !Array.isArray(value);
}
;
;
}),
"[project]/node_modules/whatwg-encoding/lib/labels-to-names.json.[json].cjs [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = {
    "866": "IBM866",
    "unicode-1-1-utf-8": "UTF-8",
    "unicode11utf8": "UTF-8",
    "unicode20utf8": "UTF-8",
    "utf-8": "UTF-8",
    "utf8": "UTF-8",
    "x-unicode20utf8": "UTF-8",
    "cp866": "IBM866",
    "csibm866": "IBM866",
    "ibm866": "IBM866",
    "csisolatin2": "ISO-8859-2",
    "iso-8859-2": "ISO-8859-2",
    "iso-ir-101": "ISO-8859-2",
    "iso8859-2": "ISO-8859-2",
    "iso88592": "ISO-8859-2",
    "iso_8859-2": "ISO-8859-2",
    "iso_8859-2:1987": "ISO-8859-2",
    "l2": "ISO-8859-2",
    "latin2": "ISO-8859-2",
    "csisolatin3": "ISO-8859-3",
    "iso-8859-3": "ISO-8859-3",
    "iso-ir-109": "ISO-8859-3",
    "iso8859-3": "ISO-8859-3",
    "iso88593": "ISO-8859-3",
    "iso_8859-3": "ISO-8859-3",
    "iso_8859-3:1988": "ISO-8859-3",
    "l3": "ISO-8859-3",
    "latin3": "ISO-8859-3",
    "csisolatin4": "ISO-8859-4",
    "iso-8859-4": "ISO-8859-4",
    "iso-ir-110": "ISO-8859-4",
    "iso8859-4": "ISO-8859-4",
    "iso88594": "ISO-8859-4",
    "iso_8859-4": "ISO-8859-4",
    "iso_8859-4:1988": "ISO-8859-4",
    "l4": "ISO-8859-4",
    "latin4": "ISO-8859-4",
    "csisolatincyrillic": "ISO-8859-5",
    "cyrillic": "ISO-8859-5",
    "iso-8859-5": "ISO-8859-5",
    "iso-ir-144": "ISO-8859-5",
    "iso8859-5": "ISO-8859-5",
    "iso88595": "ISO-8859-5",
    "iso_8859-5": "ISO-8859-5",
    "iso_8859-5:1988": "ISO-8859-5",
    "arabic": "ISO-8859-6",
    "asmo-708": "ISO-8859-6",
    "csiso88596e": "ISO-8859-6",
    "csiso88596i": "ISO-8859-6",
    "csisolatinarabic": "ISO-8859-6",
    "ecma-114": "ISO-8859-6",
    "iso-8859-6": "ISO-8859-6",
    "iso-8859-6-e": "ISO-8859-6",
    "iso-8859-6-i": "ISO-8859-6",
    "iso-ir-127": "ISO-8859-6",
    "iso8859-6": "ISO-8859-6",
    "iso88596": "ISO-8859-6",
    "iso_8859-6": "ISO-8859-6",
    "iso_8859-6:1987": "ISO-8859-6",
    "csisolatingreek": "ISO-8859-7",
    "ecma-118": "ISO-8859-7",
    "elot_928": "ISO-8859-7",
    "greek": "ISO-8859-7",
    "greek8": "ISO-8859-7",
    "iso-8859-7": "ISO-8859-7",
    "iso-ir-126": "ISO-8859-7",
    "iso8859-7": "ISO-8859-7",
    "iso88597": "ISO-8859-7",
    "iso_8859-7": "ISO-8859-7",
    "iso_8859-7:1987": "ISO-8859-7",
    "sun_eu_greek": "ISO-8859-7",
    "csiso88598e": "ISO-8859-8",
    "csisolatinhebrew": "ISO-8859-8",
    "hebrew": "ISO-8859-8",
    "iso-8859-8": "ISO-8859-8",
    "iso-8859-8-e": "ISO-8859-8",
    "iso-ir-138": "ISO-8859-8",
    "iso8859-8": "ISO-8859-8",
    "iso88598": "ISO-8859-8",
    "iso_8859-8": "ISO-8859-8",
    "iso_8859-8:1988": "ISO-8859-8",
    "visual": "ISO-8859-8",
    "csisolatin6": "ISO-8859-10",
    "iso-8859-10": "ISO-8859-10",
    "iso-ir-157": "ISO-8859-10",
    "iso8859-10": "ISO-8859-10",
    "iso885910": "ISO-8859-10",
    "l6": "ISO-8859-10",
    "latin6": "ISO-8859-10",
    "iso-8859-13": "ISO-8859-13",
    "iso8859-13": "ISO-8859-13",
    "iso885913": "ISO-8859-13",
    "iso-8859-14": "ISO-8859-14",
    "iso8859-14": "ISO-8859-14",
    "iso885914": "ISO-8859-14",
    "csisolatin9": "ISO-8859-15",
    "iso-8859-15": "ISO-8859-15",
    "iso8859-15": "ISO-8859-15",
    "iso885915": "ISO-8859-15",
    "iso_8859-15": "ISO-8859-15",
    "l9": "ISO-8859-15",
    "iso-8859-16": "ISO-8859-16",
    "cskoi8r": "KOI8-R",
    "koi": "KOI8-R",
    "koi8": "KOI8-R",
    "koi8-r": "KOI8-R",
    "koi8_r": "KOI8-R",
    "koi8-ru": "KOI8-U",
    "koi8-u": "KOI8-U",
    "csmacintosh": "macintosh",
    "mac": "macintosh",
    "macintosh": "macintosh",
    "x-mac-roman": "macintosh",
    "dos-874": "windows-874",
    "iso-8859-11": "windows-874",
    "iso8859-11": "windows-874",
    "iso885911": "windows-874",
    "tis-620": "windows-874",
    "windows-874": "windows-874",
    "cp1250": "windows-1250",
    "windows-1250": "windows-1250",
    "x-cp1250": "windows-1250",
    "cp1251": "windows-1251",
    "windows-1251": "windows-1251",
    "x-cp1251": "windows-1251",
    "ansi_x3.4-1968": "windows-1252",
    "ascii": "windows-1252",
    "cp1252": "windows-1252",
    "cp819": "windows-1252",
    "csisolatin1": "windows-1252",
    "ibm819": "windows-1252",
    "iso-8859-1": "windows-1252",
    "iso-ir-100": "windows-1252",
    "iso8859-1": "windows-1252",
    "iso88591": "windows-1252",
    "iso_8859-1": "windows-1252",
    "iso_8859-1:1987": "windows-1252",
    "l1": "windows-1252",
    "latin1": "windows-1252",
    "us-ascii": "windows-1252",
    "windows-1252": "windows-1252",
    "x-cp1252": "windows-1252",
    "cp1253": "windows-1253",
    "windows-1253": "windows-1253",
    "x-cp1253": "windows-1253",
    "cp1254": "windows-1254",
    "csisolatin5": "windows-1254",
    "iso-8859-9": "windows-1254",
    "iso-ir-148": "windows-1254",
    "iso8859-9": "windows-1254",
    "iso88599": "windows-1254",
    "iso_8859-9": "windows-1254",
    "iso_8859-9:1989": "windows-1254",
    "l5": "windows-1254",
    "latin5": "windows-1254",
    "windows-1254": "windows-1254",
    "x-cp1254": "windows-1254",
    "cp1255": "windows-1255",
    "windows-1255": "windows-1255",
    "x-cp1255": "windows-1255",
    "cp1256": "windows-1256",
    "windows-1256": "windows-1256",
    "x-cp1256": "windows-1256",
    "cp1257": "windows-1257",
    "windows-1257": "windows-1257",
    "x-cp1257": "windows-1257",
    "cp1258": "windows-1258",
    "windows-1258": "windows-1258",
    "x-cp1258": "windows-1258",
    "chinese": "GBK",
    "csgb2312": "GBK",
    "csiso58gb231280": "GBK",
    "gb2312": "GBK",
    "gb_2312": "GBK",
    "gb_2312-80": "GBK",
    "gbk": "GBK",
    "iso-ir-58": "GBK",
    "x-gbk": "GBK",
    "gb18030": "gb18030",
    "big5": "Big5",
    "big5-hkscs": "Big5",
    "cn-big5": "Big5",
    "csbig5": "Big5",
    "x-x-big5": "Big5",
    "cseucpkdfmtjapanese": "EUC-JP",
    "euc-jp": "EUC-JP",
    "x-euc-jp": "EUC-JP",
    "csshiftjis": "Shift_JIS",
    "ms932": "Shift_JIS",
    "ms_kanji": "Shift_JIS",
    "shift-jis": "Shift_JIS",
    "shift_jis": "Shift_JIS",
    "sjis": "Shift_JIS",
    "windows-31j": "Shift_JIS",
    "x-sjis": "Shift_JIS",
    "cseuckr": "EUC-KR",
    "csksc56011987": "EUC-KR",
    "euc-kr": "EUC-KR",
    "iso-ir-149": "EUC-KR",
    "korean": "EUC-KR",
    "ks_c_5601-1987": "EUC-KR",
    "ks_c_5601-1989": "EUC-KR",
    "ksc5601": "EUC-KR",
    "ksc_5601": "EUC-KR",
    "windows-949": "EUC-KR",
    "unicodefffe": "UTF-16BE",
    "utf-16be": "UTF-16BE",
    "csunicode": "UTF-16LE",
    "iso-10646-ucs-2": "UTF-16LE",
    "ucs-2": "UTF-16LE",
    "unicode": "UTF-16LE",
    "unicodefeff": "UTF-16LE",
    "utf-16": "UTF-16LE",
    "utf-16le": "UTF-16LE",
    "x-user-defined": "x-user-defined"
};
}),
"[project]/node_modules/whatwg-encoding/lib/supported-names.json.[json].cjs [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = [
    "UTF-8",
    "IBM866",
    "ISO-8859-2",
    "ISO-8859-3",
    "ISO-8859-4",
    "ISO-8859-5",
    "ISO-8859-6",
    "ISO-8859-7",
    "ISO-8859-8",
    "ISO-8859-10",
    "ISO-8859-13",
    "ISO-8859-14",
    "ISO-8859-15",
    "ISO-8859-16",
    "KOI8-R",
    "KOI8-U",
    "macintosh",
    "windows-874",
    "windows-1250",
    "windows-1251",
    "windows-1252",
    "windows-1253",
    "windows-1254",
    "windows-1255",
    "windows-1256",
    "windows-1257",
    "windows-1258",
    "GBK",
    "gb18030",
    "Big5",
    "EUC-JP",
    "Shift_JIS",
    "EUC-KR",
    "UTF-16BE",
    "UTF-16LE",
    "x-user-defined"
];
}),
"[project]/node_modules/whatwg-encoding/lib/whatwg-encoding.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const iconvLite = __turbopack_context__.r("[project]/node_modules/iconv-lite/lib/index.js [app-rsc] (ecmascript)");
const supportedNames = __turbopack_context__.r("[project]/node_modules/whatwg-encoding/lib/supported-names.json.[json].cjs [app-rsc] (ecmascript)");
const labelsToNames = __turbopack_context__.r("[project]/node_modules/whatwg-encoding/lib/labels-to-names.json.[json].cjs [app-rsc] (ecmascript)");
const supportedNamesSet = new Set(supportedNames);
// https://encoding.spec.whatwg.org/#concept-encoding-get
exports.labelToName = (label)=>{
    label = String(label).trim().toLowerCase();
    return labelsToNames[label] || null;
};
// https://encoding.spec.whatwg.org/#decode
exports.decode = (uint8Array, fallbackEncodingName)=>{
    let encoding = fallbackEncodingName;
    if (!exports.isSupported(encoding)) {
        throw new RangeError(`"${encoding}" is not a supported encoding name`);
    }
    const bomEncoding = exports.getBOMEncoding(uint8Array);
    if (bomEncoding !== null) {
        encoding = bomEncoding;
    // iconv-lite will strip BOMs for us, so no need to do the extra byte removal that the spec does.
    // Note that we won't end up in the x-user-defined case when there's a bomEncoding.
    }
    if (encoding === "x-user-defined") {
        // https://encoding.spec.whatwg.org/#x-user-defined-decoder
        let result = "";
        for (const byte of uint8Array){
            if (byte <= 0x7F) {
                result += String.fromCodePoint(byte);
            } else {
                result += String.fromCodePoint(0xF780 + byte - 0x80);
            }
        }
        return result;
    }
    return iconvLite.decode(uint8Array, encoding);
};
// https://github.com/whatwg/html/issues/1910#issuecomment-254017369
exports.getBOMEncoding = (uint8Array)=>{
    if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
        return "UTF-16BE";
    } else if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
        return "UTF-16LE";
    } else if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
        return "UTF-8";
    }
    return null;
};
exports.isSupported = (name)=>{
    return supportedNamesSet.has(String(name));
};
}),
"[project]/node_modules/whatwg-mimetype/lib/mime-type-parameters.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const { asciiLowercase, solelyContainsHTTPTokenCodePoints, soleyContainsHTTPQuotedStringTokenCodePoints } = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/utils.js [app-rsc] (ecmascript)");
module.exports = class MIMETypeParameters {
    constructor(map){
        this._map = map;
    }
    get size() {
        return this._map.size;
    }
    get(name) {
        name = asciiLowercase(String(name));
        return this._map.get(name);
    }
    has(name) {
        name = asciiLowercase(String(name));
        return this._map.has(name);
    }
    set(name, value) {
        name = asciiLowercase(String(name));
        value = String(value);
        if (!solelyContainsHTTPTokenCodePoints(name)) {
            throw new Error(`Invalid MIME type parameter name "${name}": only HTTP token code points are valid.`);
        }
        if (!soleyContainsHTTPQuotedStringTokenCodePoints(value)) {
            throw new Error(`Invalid MIME type parameter value "${value}": only HTTP quoted-string token code points are ` + `valid.`);
        }
        return this._map.set(name, value);
    }
    clear() {
        this._map.clear();
    }
    delete(name) {
        name = asciiLowercase(String(name));
        return this._map.delete(name);
    }
    forEach(callbackFn, thisArg) {
        this._map.forEach(callbackFn, thisArg);
    }
    keys() {
        return this._map.keys();
    }
    values() {
        return this._map.values();
    }
    entries() {
        return this._map.entries();
    }
    [Symbol.iterator]() {
        return this._map[Symbol.iterator]();
    }
};
}),
"[project]/node_modules/whatwg-mimetype/lib/mime-type.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const MIMETypeParameters = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/mime-type-parameters.js [app-rsc] (ecmascript)");
const parse = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/parser.js [app-rsc] (ecmascript)");
const serialize = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/serializer.js [app-rsc] (ecmascript)");
const { asciiLowercase, solelyContainsHTTPTokenCodePoints } = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/utils.js [app-rsc] (ecmascript)");
module.exports = class MIMEType {
    constructor(string){
        string = String(string);
        const result = parse(string);
        if (result === null) {
            throw new Error(`Could not parse MIME type string "${string}"`);
        }
        this._type = result.type;
        this._subtype = result.subtype;
        this._parameters = new MIMETypeParameters(result.parameters);
    }
    static parse(string) {
        try {
            return new this(string);
        } catch (e) {
            return null;
        }
    }
    get essence() {
        return `${this.type}/${this.subtype}`;
    }
    get type() {
        return this._type;
    }
    set type(value) {
        value = asciiLowercase(String(value));
        if (value.length === 0) {
            throw new Error("Invalid type: must be a non-empty string");
        }
        if (!solelyContainsHTTPTokenCodePoints(value)) {
            throw new Error(`Invalid type ${value}: must contain only HTTP token code points`);
        }
        this._type = value;
    }
    get subtype() {
        return this._subtype;
    }
    set subtype(value) {
        value = asciiLowercase(String(value));
        if (value.length === 0) {
            throw new Error("Invalid subtype: must be a non-empty string");
        }
        if (!solelyContainsHTTPTokenCodePoints(value)) {
            throw new Error(`Invalid subtype ${value}: must contain only HTTP token code points`);
        }
        this._subtype = value;
    }
    get parameters() {
        return this._parameters;
    }
    toString() {
        // The serialize function works on both "MIME type records" (i.e. the results of parse) and on this class, since
        // this class's interface is identical.
        return serialize(this);
    }
    isJavaScript({ prohibitParameters = false } = {}) {
        switch(this._type){
            case "text":
                {
                    switch(this._subtype){
                        case "ecmascript":
                        case "javascript":
                        case "javascript1.0":
                        case "javascript1.1":
                        case "javascript1.2":
                        case "javascript1.3":
                        case "javascript1.4":
                        case "javascript1.5":
                        case "jscript":
                        case "livescript":
                        case "x-ecmascript":
                        case "x-javascript":
                            {
                                return !prohibitParameters || this._parameters.size === 0;
                            }
                        default:
                            {
                                return false;
                            }
                    }
                }
            case "application":
                {
                    switch(this._subtype){
                        case "ecmascript":
                        case "javascript":
                        case "x-ecmascript":
                        case "x-javascript":
                            {
                                return !prohibitParameters || this._parameters.size === 0;
                            }
                        default:
                            {
                                return false;
                            }
                    }
                }
            default:
                {
                    return false;
                }
        }
    }
    isXML() {
        return this._subtype === "xml" && (this._type === "text" || this._type === "application") || this._subtype.endsWith("+xml");
    }
    isHTML() {
        return this._subtype === "html" && this._type === "text";
    }
};
}),
"[project]/node_modules/whatwg-mimetype/lib/parser.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const { removeLeadingAndTrailingHTTPWhitespace, removeTrailingHTTPWhitespace, isHTTPWhitespaceChar, solelyContainsHTTPTokenCodePoints, soleyContainsHTTPQuotedStringTokenCodePoints, asciiLowercase, collectAnHTTPQuotedString } = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/utils.js [app-rsc] (ecmascript)");
module.exports = (input)=>{
    input = removeLeadingAndTrailingHTTPWhitespace(input);
    let position = 0;
    let type = "";
    while(position < input.length && input[position] !== "/"){
        type += input[position];
        ++position;
    }
    if (type.length === 0 || !solelyContainsHTTPTokenCodePoints(type)) {
        return null;
    }
    if (position >= input.length) {
        return null;
    }
    // Skips past "/"
    ++position;
    let subtype = "";
    while(position < input.length && input[position] !== ";"){
        subtype += input[position];
        ++position;
    }
    subtype = removeTrailingHTTPWhitespace(subtype);
    if (subtype.length === 0 || !solelyContainsHTTPTokenCodePoints(subtype)) {
        return null;
    }
    const mimeType = {
        type: asciiLowercase(type),
        subtype: asciiLowercase(subtype),
        parameters: new Map()
    };
    while(position < input.length){
        // Skip past ";"
        ++position;
        while(isHTTPWhitespaceChar(input[position])){
            ++position;
        }
        let parameterName = "";
        while(position < input.length && input[position] !== ";" && input[position] !== "="){
            parameterName += input[position];
            ++position;
        }
        parameterName = asciiLowercase(parameterName);
        if (position < input.length) {
            if (input[position] === ";") {
                continue;
            }
            // Skip past "="
            ++position;
        }
        let parameterValue = null;
        if (input[position] === "\"") {
            [parameterValue, position] = collectAnHTTPQuotedString(input, position);
            while(position < input.length && input[position] !== ";"){
                ++position;
            }
        } else {
            parameterValue = "";
            while(position < input.length && input[position] !== ";"){
                parameterValue += input[position];
                ++position;
            }
            parameterValue = removeTrailingHTTPWhitespace(parameterValue);
            if (parameterValue === "") {
                continue;
            }
        }
        if (parameterName.length > 0 && solelyContainsHTTPTokenCodePoints(parameterName) && soleyContainsHTTPQuotedStringTokenCodePoints(parameterValue) && !mimeType.parameters.has(parameterName)) {
            mimeType.parameters.set(parameterName, parameterValue);
        }
    }
    return mimeType;
};
}),
"[project]/node_modules/whatwg-mimetype/lib/serializer.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

const { solelyContainsHTTPTokenCodePoints } = __turbopack_context__.r("[project]/node_modules/whatwg-mimetype/lib/utils.js [app-rsc] (ecmascript)");
module.exports = (mimeType)=>{
    let serialization = `${mimeType.type}/${mimeType.subtype}`;
    if (mimeType.parameters.size === 0) {
        return serialization;
    }
    for (let [name, value] of mimeType.parameters){
        serialization += ";";
        serialization += name;
        serialization += "=";
        if (!solelyContainsHTTPTokenCodePoints(value) || value.length === 0) {
            value = value.replace(/(["\\])/ug, "\\$1");
            value = `"${value}"`;
        }
        serialization += value;
    }
    return serialization;
};
}),
"[project]/node_modules/whatwg-mimetype/lib/utils.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

exports.removeLeadingAndTrailingHTTPWhitespace = (string)=>{
    return string.replace(/^[ \t\n\r]+/u, "").replace(/[ \t\n\r]+$/u, "");
};
exports.removeTrailingHTTPWhitespace = (string)=>{
    return string.replace(/[ \t\n\r]+$/u, "");
};
exports.isHTTPWhitespaceChar = (char)=>{
    return char === " " || char === "\t" || char === "\n" || char === "\r";
};
exports.solelyContainsHTTPTokenCodePoints = (string)=>{
    return /^[-!#$%&'*+.^_`|~A-Za-z0-9]*$/u.test(string);
};
exports.soleyContainsHTTPQuotedStringTokenCodePoints = (string)=>{
    return /^[\t\u0020-\u007E\u0080-\u00FF]*$/u.test(string);
};
exports.asciiLowercase = (string)=>{
    return string.replace(/[A-Z]/ug, (l)=>l.toLowerCase());
};
// This variant only implements it with the extract-value flag set.
exports.collectAnHTTPQuotedString = (input, position)=>{
    let value = "";
    position++;
    while(true){
        while(position < input.length && input[position] !== "\"" && input[position] !== "\\"){
            value += input[position];
            ++position;
        }
        if (position >= input.length) {
            break;
        }
        const quoteOrBackslash = input[position];
        ++position;
        if (quoteOrBackslash === "\\") {
            if (position >= input.length) {
                value += "\\";
                break;
            }
            value += input[position];
            ++position;
        } else {
            break;
        }
    }
    return [
        value,
        position
    ];
};
}),
"[project]/node_modules/yauzl/crc32.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

// Adapted from https://github.com/brianloveswords/buffer-crc32/blob/v0.2.13/index.js
const CRC_TABLE = new Int32Array([
    0x00000000,
    0x77073096,
    0xee0e612c,
    0x990951ba,
    0x076dc419,
    0x706af48f,
    0xe963a535,
    0x9e6495a3,
    0x0edb8832,
    0x79dcb8a4,
    0xe0d5e91e,
    0x97d2d988,
    0x09b64c2b,
    0x7eb17cbd,
    0xe7b82d07,
    0x90bf1d91,
    0x1db71064,
    0x6ab020f2,
    0xf3b97148,
    0x84be41de,
    0x1adad47d,
    0x6ddde4eb,
    0xf4d4b551,
    0x83d385c7,
    0x136c9856,
    0x646ba8c0,
    0xfd62f97a,
    0x8a65c9ec,
    0x14015c4f,
    0x63066cd9,
    0xfa0f3d63,
    0x8d080df5,
    0x3b6e20c8,
    0x4c69105e,
    0xd56041e4,
    0xa2677172,
    0x3c03e4d1,
    0x4b04d447,
    0xd20d85fd,
    0xa50ab56b,
    0x35b5a8fa,
    0x42b2986c,
    0xdbbbc9d6,
    0xacbcf940,
    0x32d86ce3,
    0x45df5c75,
    0xdcd60dcf,
    0xabd13d59,
    0x26d930ac,
    0x51de003a,
    0xc8d75180,
    0xbfd06116,
    0x21b4f4b5,
    0x56b3c423,
    0xcfba9599,
    0xb8bda50f,
    0x2802b89e,
    0x5f058808,
    0xc60cd9b2,
    0xb10be924,
    0x2f6f7c87,
    0x58684c11,
    0xc1611dab,
    0xb6662d3d,
    0x76dc4190,
    0x01db7106,
    0x98d220bc,
    0xefd5102a,
    0x71b18589,
    0x06b6b51f,
    0x9fbfe4a5,
    0xe8b8d433,
    0x7807c9a2,
    0x0f00f934,
    0x9609a88e,
    0xe10e9818,
    0x7f6a0dbb,
    0x086d3d2d,
    0x91646c97,
    0xe6635c01,
    0x6b6b51f4,
    0x1c6c6162,
    0x856530d8,
    0xf262004e,
    0x6c0695ed,
    0x1b01a57b,
    0x8208f4c1,
    0xf50fc457,
    0x65b0d9c6,
    0x12b7e950,
    0x8bbeb8ea,
    0xfcb9887c,
    0x62dd1ddf,
    0x15da2d49,
    0x8cd37cf3,
    0xfbd44c65,
    0x4db26158,
    0x3ab551ce,
    0xa3bc0074,
    0xd4bb30e2,
    0x4adfa541,
    0x3dd895d7,
    0xa4d1c46d,
    0xd3d6f4fb,
    0x4369e96a,
    0x346ed9fc,
    0xad678846,
    0xda60b8d0,
    0x44042d73,
    0x33031de5,
    0xaa0a4c5f,
    0xdd0d7cc9,
    0x5005713c,
    0x270241aa,
    0xbe0b1010,
    0xc90c2086,
    0x5768b525,
    0x206f85b3,
    0xb966d409,
    0xce61e49f,
    0x5edef90e,
    0x29d9c998,
    0xb0d09822,
    0xc7d7a8b4,
    0x59b33d17,
    0x2eb40d81,
    0xb7bd5c3b,
    0xc0ba6cad,
    0xedb88320,
    0x9abfb3b6,
    0x03b6e20c,
    0x74b1d29a,
    0xead54739,
    0x9dd277af,
    0x04db2615,
    0x73dc1683,
    0xe3630b12,
    0x94643b84,
    0x0d6d6a3e,
    0x7a6a5aa8,
    0xe40ecf0b,
    0x9309ff9d,
    0x0a00ae27,
    0x7d079eb1,
    0xf00f9344,
    0x8708a3d2,
    0x1e01f268,
    0x6906c2fe,
    0xf762575d,
    0x806567cb,
    0x196c3671,
    0x6e6b06e7,
    0xfed41b76,
    0x89d32be0,
    0x10da7a5a,
    0x67dd4acc,
    0xf9b9df6f,
    0x8ebeeff9,
    0x17b7be43,
    0x60b08ed5,
    0xd6d6a3e8,
    0xa1d1937e,
    0x38d8c2c4,
    0x4fdff252,
    0xd1bb67f1,
    0xa6bc5767,
    0x3fb506dd,
    0x48b2364b,
    0xd80d2bda,
    0xaf0a1b4c,
    0x36034af6,
    0x41047a60,
    0xdf60efc3,
    0xa867df55,
    0x316e8eef,
    0x4669be79,
    0xcb61b38c,
    0xbc66831a,
    0x256fd2a0,
    0x5268e236,
    0xcc0c7795,
    0xbb0b4703,
    0x220216b9,
    0x5505262f,
    0xc5ba3bbe,
    0xb2bd0b28,
    0x2bb45a92,
    0x5cb36a04,
    0xc2d7ffa7,
    0xb5d0cf31,
    0x2cd99e8b,
    0x5bdeae1d,
    0x9b64c2b0,
    0xec63f226,
    0x756aa39c,
    0x026d930a,
    0x9c0906a9,
    0xeb0e363f,
    0x72076785,
    0x05005713,
    0x95bf4a82,
    0xe2b87a14,
    0x7bb12bae,
    0x0cb61b38,
    0x92d28e9b,
    0xe5d5be0d,
    0x7cdcefb7,
    0x0bdbdf21,
    0x86d3d2d4,
    0xf1d4e242,
    0x68ddb3f8,
    0x1fda836e,
    0x81be16cd,
    0xf6b9265b,
    0x6fb077e1,
    0x18b74777,
    0x88085ae6,
    0xff0f6a70,
    0x66063bca,
    0x11010b5c,
    0x8f659eff,
    0xf862ae69,
    0x616bffd3,
    0x166ccf45,
    0xa00ae278,
    0xd70dd2ee,
    0x4e048354,
    0x3903b3c2,
    0xa7672661,
    0xd06016f7,
    0x4969474d,
    0x3e6e77db,
    0xaed16a4a,
    0xd9d65adc,
    0x40df0b66,
    0x37d83bf0,
    0xa9bcae53,
    0xdebb9ec5,
    0x47b2cf7f,
    0x30b5ffe9,
    0xbdbdf21c,
    0xcabac28a,
    0x53b39330,
    0x24b4a3a6,
    0xbad03605,
    0xcdd70693,
    0x54de5729,
    0x23d967bf,
    0xb3667a2e,
    0xc4614ab8,
    0x5d681b02,
    0x2a6f2b94,
    0xb40bbe37,
    0xc30c8ea1,
    0x5a05df1b,
    0x2d02ef8d
]);
function crc32(buf) {
    let crc = -1;
    for (let x of buf){
        crc = CRC_TABLE[(crc ^ x) & 0xff] ^ crc >>> 8;
    }
    return (crc ^ -1) >>> 0;
}
module.exports = crc32;
}),
"[project]/node_modules/yauzl/fd-slicer.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

// This was adapted from https://github.com/andrewrk/node-fd-slicer by Andrew Kelley under the MIT License.
var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
var stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
var Readable = stream.Readable;
var PassThrough = stream.PassThrough;
var Pend = __turbopack_context__.r("[project]/node_modules/pend/index.js [app-rsc] (ecmascript)");
var EventEmitter = __turbopack_context__.r("[externals]/events [external] (events, cjs)").EventEmitter;
exports.BufferSlicer = BufferSlicer;
exports.FdSlicer = FdSlicer;
util.inherits(FdSlicer, EventEmitter);
function FdSlicer(fd) {
    EventEmitter.call(this);
    this.fd = fd;
    this.pend = new Pend();
    this.pend.max = 1;
    this.refCount = 0;
}
FdSlicer.prototype.read = function(buffer, offset, length, position, callback) {
    var self = this;
    self.pend.go(function(cb) {
        fs.read(self.fd, buffer, offset, length, position, function(err, bytesRead, buffer) {
            cb();
            callback(err, bytesRead, buffer);
        });
    });
};
FdSlicer.prototype.createReadStream = function(options) {
    return new ReadStream(this, options);
};
FdSlicer.prototype.ref = function() {
    this.refCount += 1;
};
FdSlicer.prototype.unref = function() {
    var self = this;
    self.refCount -= 1;
    if (self.refCount < 0) throw new Error("invalid unref");
    if (self.refCount > 0) return;
    fs.close(self.fd, onCloseDone);
    function onCloseDone(err) {
        if (err) {
            self.emit('error', err);
        } else {
            self.emit('close');
        }
    }
};
util.inherits(ReadStream, Readable);
function ReadStream(context, options) {
    options = options || {};
    Readable.call(this, options);
    this.context = context;
    this.context.ref();
    this.start = options.start || 0;
    this.endOffset = options.end;
    this.pos = this.start;
}
ReadStream.prototype._read = function(n) {
    var self = this;
    var toRead = Math.min(self._readableState.highWaterMark, n);
    if (self.endOffset != null) {
        toRead = Math.min(toRead, self.endOffset - self.pos);
    }
    if (toRead <= 0) {
        self.push(null);
        this._cleanup();
        return;
    }
    self.context.pend.go(function(cb) {
        var buffer = Buffer.allocUnsafe(toRead);
        fs.read(self.context.fd, buffer, 0, toRead, self.pos, function(err, bytesRead) {
            if (err) {
                self.destroy(err);
            } else if (bytesRead === 0) {
                self.push(null);
                self._cleanup();
            } else {
                self.pos += bytesRead;
                self.push(buffer.slice(0, bytesRead));
            }
            cb();
        });
    });
};
ReadStream.prototype._destroy = function(err, cb) {
    // Node 14+ calls this automatically at EOF.
    this._cleanup();
    cb(err);
};
ReadStream.prototype._cleanup = function() {
    if (this.context != null) {
        this.context.unref();
        this.context = null;
    }
};
util.inherits(BufferSlicer, EventEmitter);
function BufferSlicer(buffer) {
    EventEmitter.call(this);
    this.refCount = 0;
    this.buffer = buffer;
}
BufferSlicer.prototype.read = function(buffer, offset, length, position, callback) {
    if (!(0 <= offset && offset <= buffer.length)) throw new RangeError("offset outside buffer: 0 <= " + offset + " <= " + buffer.length);
    if (position < 0) throw new RangeError("position is negative: " + position);
    if (offset + length > buffer.length) {
        // The caller's buffer can't hold all the bytes they're trying to read.
        // Clamp the length instead of giving an error.
        // The callback will be informed of fewer than expected bytes written.
        length = buffer.length - offset;
    }
    if (position + length > this.buffer.length) {
        // Clamp any attempt to read past the end of the source buffer.
        length = this.buffer.length - position;
    }
    if (length <= 0) {
        // After any clamping, we're fully out of bounds or otherwise have nothing to do.
        // This isn't an error; it's just zero bytes written.
        setImmediate(function() {
            callback(null, 0);
        });
        return;
    }
    this.buffer.copy(buffer, offset, position, position + length);
    setImmediate(function() {
        callback(null, length);
    });
};
BufferSlicer.prototype.createReadStream = function(options) {
    options = options || {};
    var readStream = new PassThrough(options);
    readStream.start = options.start || 0;
    readStream.endOffset = options.end;
    // by the time this function returns, we'll be done.
    readStream.pos = readStream.endOffset || this.buffer.length;
    var entireSlice = this.buffer.slice(readStream.start, readStream.pos);
    // Cut the buffer into smaller slices for better memory usage when streaming into a zlib inflate stream.
    // See https://github.com/thejoshwolfe/yauzl/issues/87
    var maxChunkSize = 0x10000;
    var offset = 0;
    while(true){
        var nextOffset = offset + maxChunkSize;
        if (nextOffset >= entireSlice.length) {
            // last chunk
            if (offset < entireSlice.length) {
                readStream.write(entireSlice.slice(offset, entireSlice.length));
            }
            break;
        }
        readStream.write(entireSlice.slice(offset, nextOffset));
        offset = nextOffset;
    }
    readStream.end();
    return readStream;
};
BufferSlicer.prototype.ref = function() {
    this.refCount += 1;
};
BufferSlicer.prototype.unref = function() {
    this.refCount -= 1;
    if (this.refCount < 0) {
        throw new Error("invalid unref");
    }
};
}),
"[project]/node_modules/yauzl/index.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
var zlib = __turbopack_context__.r("[externals]/zlib [external] (zlib, cjs)");
var fd_slicer = __turbopack_context__.r("[project]/node_modules/yauzl/fd-slicer.js [app-rsc] (ecmascript)");
var util = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
var EventEmitter = __turbopack_context__.r("[externals]/events [external] (events, cjs)").EventEmitter;
var Transform = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)").Transform;
var PassThrough = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)").PassThrough;
var Writable = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)").Writable;
// Node 20 added zlib.crc32.
const crc32 = typeof zlib.crc32 === "function" ? zlib.crc32 : __turbopack_context__.r("[project]/node_modules/yauzl/crc32.js [app-rsc] (ecmascript)");
exports.open = open;
exports.fromFd = fromFd;
exports.fromBuffer = fromBuffer;
exports.fromRandomAccessReader = fromRandomAccessReader;
exports.openPromise = openPromise;
exports.fromFdPromise = fromFdPromise;
exports.fromBufferPromise = fromBufferPromise;
exports.fromRandomAccessReaderPromise = fromRandomAccessReaderPromise;
exports.dosDateTimeToDate = dosDateTimeToDate;
exports.getFileNameLowLevel = getFileNameLowLevel;
exports.validateFileName = validateFileName;
exports.parseExtraFields = parseExtraFields;
exports.ZipFile = ZipFile;
exports.Entry = Entry;
exports.LocalFileHeader = LocalFileHeader;
exports.RandomAccessReader = RandomAccessReader;
function openPromise(path, options1) {
    return new Promise((resolve, reject)=>{
        open(path, {
            ...options1,
            lazyEntries: true
        }, function(err, zipfile) {
            if (err) return reject(err);
            resolve(zipfile);
        });
    });
}
function fromFdPromise(fd, options1) {
    return new Promise((resolve, reject)=>{
        fromFd(fd, {
            ...options1,
            lazyEntries: true
        }, function(err, zipfile) {
            if (err) return reject(err);
            resolve(zipfile);
        });
    });
}
function fromBufferPromise(buffer, options1) {
    return new Promise((resolve, reject)=>{
        fromBuffer(buffer, {
            ...options1,
            lazyEntries: true
        }, function(err, zipfile) {
            if (err) return reject(err);
            resolve(zipfile);
        });
    });
}
function fromRandomAccessReaderPromise(reader, totalSize, options1) {
    return new Promise((resolve, reject)=>{
        fromRandomAccessReader(reader, totalSize, {
            ...options1,
            lazyEntries: true
        }, function(err, zipfile) {
            if (err) return reject(err);
            resolve(zipfile);
        });
    });
}
function open(path, options1, callback) {
    if (typeof options1 === "function") {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) options1 = {};
    if (options1.autoClose == null) options1.autoClose = true;
    if (options1.lazyEntries == null) options1.lazyEntries = false;
    if (options1.decodeStrings == null) options1.decodeStrings = true;
    if (options1.validateEntrySizes == null) options1.validateEntrySizes = true;
    if (options1.strictFileNames == null) options1.strictFileNames = false;
    if (callback == null) callback = defaultCallback;
    fs.open(path, "r", function(err, fd) {
        if (err) return callback(err);
        fromFd(fd, options1, function(err, zipfile) {
            if (err) fs.close(fd, defaultCallback);
            callback(err, zipfile);
        });
    });
}
function fromFd(fd, options1, callback) {
    if (typeof options1 === "function") {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) options1 = {};
    if (options1.autoClose == null) options1.autoClose = false;
    if (options1.lazyEntries == null) options1.lazyEntries = false;
    if (options1.decodeStrings == null) options1.decodeStrings = true;
    if (options1.validateEntrySizes == null) options1.validateEntrySizes = true;
    if (options1.strictFileNames == null) options1.strictFileNames = false;
    if (callback == null) callback = defaultCallback;
    fs.fstat(fd, function(err, stats) {
        if (err) return callback(err);
        var reader = new fd_slicer.FdSlicer(fd);
        fromRandomAccessReader(reader, stats.size, options1, callback);
    });
}
function fromBuffer(buffer, options1, callback) {
    if (typeof options1 === "function") {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) options1 = {};
    options1.autoClose = false;
    if (options1.lazyEntries == null) options1.lazyEntries = false;
    if (options1.decodeStrings == null) options1.decodeStrings = true;
    if (options1.validateEntrySizes == null) options1.validateEntrySizes = true;
    if (options1.strictFileNames == null) options1.strictFileNames = false;
    var reader = new fd_slicer.BufferSlicer(buffer);
    fromRandomAccessReader(reader, buffer.length, options1, callback);
}
function fromRandomAccessReader(reader, totalSize, options1, callback) {
    if (typeof options1 === "function") {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) options1 = {};
    if (options1.autoClose == null) options1.autoClose = true;
    if (options1.lazyEntries == null) options1.lazyEntries = false;
    if (options1.decodeStrings == null) options1.decodeStrings = true;
    var decodeStrings = !!options1.decodeStrings;
    if (options1.validateEntrySizes == null) options1.validateEntrySizes = true;
    if (options1.strictFileNames == null) options1.strictFileNames = false;
    if (callback == null) callback = defaultCallback;
    if (typeof totalSize !== "number") throw new Error("expected totalSize parameter to be a number");
    if (totalSize > Number.MAX_SAFE_INTEGER) {
        throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
    }
    // the matching unref() call is in zipfile.close()
    reader.ref();
    // eocdr means End of Central Directory Record.
    // search backwards for the eocdr signature.
    // the last field of the eocdr is a variable-length comment.
    // the comment size is encoded in a 2-byte field in the eocdr, which we can't find without trudging backwards through the comment to find it.
    // as a consequence of this design decision, it's possible to have ambiguous zip file metadata if a coherent eocdr was in the comment.
    // we search backwards for a eocdr signature, and hope that whoever made the zip file was smart enough to forbid the eocdr signature in the comment.
    var eocdrWithoutCommentSize = 22;
    var zip64EocdlSize = 20; // Zip64 end of central directory locator
    var maxCommentSize = 0xffff; // 2-byte size
    var bufferSize = Math.min(zip64EocdlSize + eocdrWithoutCommentSize + maxCommentSize, totalSize);
    var buffer = newBuffer(bufferSize);
    var bufferReadStart = totalSize - buffer.length;
    readAndAssertNoEof(reader, buffer, 0, bufferSize, bufferReadStart, function(err) {
        if (err) return callback(err);
        for(var i = bufferSize - eocdrWithoutCommentSize; i >= 0; i -= 1){
            if (buffer.readUInt32LE(i) !== 0x06054b50) continue;
            // found eocdr
            var eocdrBuffer = buffer.subarray(i);
            // 0 - End of central directory signature = 0x06054b50
            // 4 - Number of this disk
            var diskNumber = eocdrBuffer.readUInt16LE(4);
            // 6 - Disk where central directory starts
            // 8 - Number of central directory records on this disk
            // 10 - Total number of central directory records
            var entryCount = eocdrBuffer.readUInt16LE(10);
            // 12 - Size of central directory (bytes)
            // 16 - Offset of start of central directory, relative to start of archive
            var centralDirectoryOffset = eocdrBuffer.readUInt32LE(16);
            // 20 - Comment length
            var commentLength = eocdrBuffer.readUInt16LE(20);
            var expectedCommentLength = eocdrBuffer.length - eocdrWithoutCommentSize;
            if (commentLength !== expectedCommentLength) {
                return callback(new Error("Invalid comment length. Expected: " + expectedCommentLength + ". Found: " + commentLength + ". Are there extra bytes at the end of the file? Or is the end of central dir signature `PK☺☻` in the comment?"));
            }
            // 22 - Comment
            // the encoding is always cp437.
            var comment = decodeStrings ? decodeBuffer(eocdrBuffer.subarray(22), false) : eocdrBuffer.subarray(22);
            // Look for a Zip64 end of central directory locator
            if (i - zip64EocdlSize >= 0 && buffer.readUInt32LE(i - zip64EocdlSize) === 0x07064b50) {
                // ZIP64 format
                var zip64EocdlBuffer = buffer.subarray(i - zip64EocdlSize, i - zip64EocdlSize + zip64EocdlSize);
                // 0 - zip64 end of central dir locator signature = 0x07064b50
                // 4 - number of the disk with the start of the zip64 end of central directory
                // 8 - relative offset of the zip64 end of central directory record
                var zip64EocdrOffset = readUInt64LE(zip64EocdlBuffer, 8);
                // 16 - total number of disks
                // ZIP64 end of central directory record
                var zip64EocdrBuffer = newBuffer(56);
                return readAndAssertNoEof(reader, zip64EocdrBuffer, 0, zip64EocdrBuffer.length, zip64EocdrOffset, function(err) {
                    if (err) return callback(err);
                    // 0 - zip64 end of central dir signature                           4 bytes  (0x06064b50)
                    if (zip64EocdrBuffer.readUInt32LE(0) !== 0x06064b50) {
                        return callback(new Error("invalid zip64 end of central directory record signature"));
                    }
                    // 4 - size of zip64 end of central directory record                8 bytes
                    // 12 - version made by                                             2 bytes
                    // 14 - version needed to extract                                   2 bytes
                    // 16 - number of this disk                                         4 bytes
                    diskNumber = zip64EocdrBuffer.readUInt32LE(16);
                    if (diskNumber !== 0) {
                        // Check this only after zip64 overrides. See #118.
                        return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
                    }
                    // 20 - number of the disk with the start of the central directory  4 bytes
                    // 24 - total number of entries in the central directory on this disk         8 bytes
                    // 32 - total number of entries in the central directory            8 bytes
                    entryCount = readUInt64LE(zip64EocdrBuffer, 32);
                    // 40 - size of the central directory                               8 bytes
                    // 48 - offset of start of central directory with respect to the starting disk number     8 bytes
                    centralDirectoryOffset = readUInt64LE(zip64EocdrBuffer, 48);
                    // 56 - zip64 extensible data sector                                (variable size)
                    return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options1.autoClose, options1.lazyEntries, decodeStrings, options1.validateEntrySizes, options1.strictFileNames));
                });
            }
            // Not ZIP64 format
            if (diskNumber !== 0) {
                return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
            }
            return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options1.autoClose, options1.lazyEntries, decodeStrings, options1.validateEntrySizes, options1.strictFileNames));
        }
        // Not a zip file.
        callback(new Error("End of central directory record signature not found. Either not a zip file, or file is truncated."));
    });
}
util.inherits(ZipFile, EventEmitter);
function ZipFile(reader, centralDirectoryOffset, fileSize, entryCount, comment, autoClose, lazyEntries, decodeStrings, validateEntrySizes, strictFileNames) {
    var self = this;
    EventEmitter.call(self);
    self.reader = reader;
    // forward close events
    self.reader.on("error", function(err) {
        // error closing the fd
        emitError(self, err);
    });
    self.reader.once("close", function() {
        self.emit("close");
    });
    self.readEntryCursor = centralDirectoryOffset;
    self.fileSize = fileSize;
    self.entryCount = entryCount;
    self.comment = comment;
    self.entriesRead = 0;
    self.autoClose = !!autoClose;
    self.lazyEntries = !!lazyEntries;
    self.decodeStrings = !!decodeStrings;
    self.validateEntrySizes = !!validateEntrySizes;
    self.strictFileNames = !!strictFileNames;
    self.isOpen = true;
    self.emittedError = false;
    self.hasEachEntryBeenCalled = false;
    if (!self.lazyEntries) self._readEntry();
}
ZipFile.prototype.close = function() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.reader.unref();
};
function emitErrorAndAutoClose(self, err) {
    if (self.autoClose) self.close();
    emitError(self, err);
}
function emitError(self, err) {
    if (self.emittedError) return;
    self.emittedError = true;
    self.emit("error", err);
}
ZipFile.prototype.readEntry = function() {
    if (!this.lazyEntries) throw new Error("readEntry() called without lazyEntries:true");
    this._readEntry();
};
ZipFile.prototype._readEntry = function() {
    var self = this;
    if (self.entryCount === self.entriesRead) {
        // done with metadata
        setImmediate(function() {
            if (self.autoClose) self.close();
            if (self.emittedError) return;
            self.emit("end");
        });
        return;
    }
    if (self.emittedError) return;
    var buffer = newBuffer(46);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
        if (err) return emitErrorAndAutoClose(self, err);
        if (self.emittedError) return;
        var entry = new Entry();
        // 0 - Central directory file header signature
        var signature = buffer.readUInt32LE(0);
        if (signature !== 0x02014b50) return emitErrorAndAutoClose(self, new Error("invalid central directory file header signature: 0x" + signature.toString(16)));
        // 4 - Version made by
        entry.versionMadeBy = buffer.readUInt16LE(4);
        // 6 - Version needed to extract (minimum)
        entry.versionNeededToExtract = buffer.readUInt16LE(6);
        // 8 - General purpose bit flag
        entry.generalPurposeBitFlag = buffer.readUInt16LE(8);
        // 10 - Compression method
        entry.compressionMethod = buffer.readUInt16LE(10);
        // 12 - File last modification time
        entry.lastModFileTime = buffer.readUInt16LE(12);
        // 14 - File last modification date
        entry.lastModFileDate = buffer.readUInt16LE(14);
        // 16 - CRC-32
        entry.crc32 = buffer.readUInt32LE(16);
        // 20 - Compressed size
        entry.compressedSize = buffer.readUInt32LE(20);
        // 24 - Uncompressed size
        entry.uncompressedSize = buffer.readUInt32LE(24);
        // 28 - File name length (n)
        entry.fileNameLength = buffer.readUInt16LE(28);
        // 30 - Extra field length (m)
        entry.extraFieldLength = buffer.readUInt16LE(30);
        // 32 - File comment length (k)
        entry.fileCommentLength = buffer.readUInt16LE(32);
        // 34 - Disk number where file starts
        // 36 - Internal file attributes
        entry.internalFileAttributes = buffer.readUInt16LE(36);
        // 38 - External file attributes
        entry.externalFileAttributes = buffer.readUInt32LE(38);
        // 42 - Relative offset of local file header
        entry.relativeOffsetOfLocalHeader = buffer.readUInt32LE(42);
        if (entry.generalPurposeBitFlag & 0x40) return emitErrorAndAutoClose(self, new Error("strong encryption is not supported"));
        self.readEntryCursor += 46;
        buffer = newBuffer(entry.fileNameLength + entry.extraFieldLength + entry.fileCommentLength);
        readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function(err) {
            if (err) return emitErrorAndAutoClose(self, err);
            if (self.emittedError) return;
            // 46 - File name
            entry.fileNameRaw = buffer.subarray(0, entry.fileNameLength);
            // 46+n - Extra field
            var fileCommentStart = entry.fileNameLength + entry.extraFieldLength;
            entry.extraFieldRaw = buffer.subarray(entry.fileNameLength, fileCommentStart);
            // 46+n+m - File comment
            entry.fileCommentRaw = buffer.subarray(fileCommentStart, fileCommentStart + entry.fileCommentLength);
            // Parse the extra fields, which we need for processing other fields.
            try {
                entry.extraFields = parseExtraFields(entry.extraFieldRaw);
            } catch (err) {
                return emitErrorAndAutoClose(self, err);
            }
            // Interpret strings according to bit flags, extra fields, and options.
            if (self.decodeStrings) {
                var isUtf8 = (entry.generalPurposeBitFlag & 0x800) !== 0;
                entry.fileComment = decodeBuffer(entry.fileCommentRaw, isUtf8);
                entry.fileName = getFileNameLowLevel(entry.generalPurposeBitFlag, entry.fileNameRaw, entry.extraFields, self.strictFileNames);
                var errorMessage = validateFileName(entry.fileName);
                if (errorMessage != null) return emitErrorAndAutoClose(self, new Error(errorMessage));
            } else {
                entry.fileComment = entry.fileCommentRaw;
                entry.fileName = entry.fileNameRaw;
            }
            // Maintain API compatibility. See https://github.com/thejoshwolfe/yauzl/issues/47
            entry.comment = entry.fileComment;
            self.readEntryCursor += buffer.length;
            self.entriesRead += 1;
            // Check for the Zip64 Extended Information Extra Field.
            for(var i = 0; i < entry.extraFields.length; i++){
                var extraField = entry.extraFields[i];
                if (extraField.id !== 0x0001) continue;
                // Found it.
                var zip64EiefBuffer = extraField.data;
                var index = 0;
                // 0 - Original Size          8 bytes
                if (entry.uncompressedSize === 0xffffffff) {
                    if (index + 8 > zip64EiefBuffer.length) {
                        return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include uncompressed size"));
                    }
                    entry.uncompressedSize = readUInt64LE(zip64EiefBuffer, index);
                    index += 8;
                }
                // 8 - Compressed Size        8 bytes
                if (entry.compressedSize === 0xffffffff) {
                    if (index + 8 > zip64EiefBuffer.length) {
                        return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include compressed size"));
                    }
                    entry.compressedSize = readUInt64LE(zip64EiefBuffer, index);
                    index += 8;
                }
                // 16 - Relative Header Offset 8 bytes
                if (entry.relativeOffsetOfLocalHeader === 0xffffffff) {
                    if (index + 8 > zip64EiefBuffer.length) {
                        return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include relative header offset"));
                    }
                    entry.relativeOffsetOfLocalHeader = readUInt64LE(zip64EiefBuffer, index);
                    index += 8;
                }
                break;
            }
            // validate file size
            if (self.validateEntrySizes && entry.compressionMethod === 0) {
                var expectedCompressedSize = entry.uncompressedSize;
                if (entry.isEncrypted()) {
                    // traditional encryption prefixes the file data with a header
                    expectedCompressedSize += 12;
                }
                if (entry.compressedSize !== expectedCompressedSize) {
                    var msg = "compressed/uncompressed size mismatch for stored file: " + entry.compressedSize + " != " + entry.uncompressedSize;
                    return emitErrorAndAutoClose(self, new Error(msg));
                }
            }
            self.emit("entry", entry);
            if (!self.lazyEntries) self._readEntry();
        });
    });
};
ZipFile.prototype.eachEntry = function() {
    const self = this;
    if (!self.lazyEntries) throw new Error("eachEntry() requires lazyEntries: true");
    if (self.hasEachEntryBeenCalled) throw new Error("eachEntry() must only be called once per ZipFile");
    self.hasEachEntryBeenCalled = true;
    let pendingResolveReject = null;
    self.on("entry", onEntry);
    self.on("end", onEnd);
    self.on("error", onError);
    function cleanup() {
        self.removeListener("entry", onEntry);
        self.removeListener("end", onEnd);
        self.removeListener("error", onError);
        if (self.autoClose) self.close();
    }
    function onEntry(entry) {
        let { resolve } = pendingResolveReject;
        pendingResolveReject = null;
        resolve({
            value: entry
        });
    }
    function onEnd() {
        let { resolve } = pendingResolveReject;
        pendingResolveReject = null;
        cleanup();
        resolve({
            done: true
        });
    }
    function onError(err) {
        let { reject } = pendingResolveReject;
        pendingResolveReject = null;
        cleanup();
        reject(err);
    }
    return {
        [Symbol.asyncIterator] () {
            // Called once by `for await...of`.
            return this;
        },
        next () {
            // Called on each iteration in a `for await...of`.
            const promise = new Promise((resolve, reject)=>{
                if (pendingResolveReject != null) throw new Error("next() called before previous Promise was resolved.");
                pendingResolveReject = {
                    resolve,
                    reject
                };
            });
            self.readEntry();
            return promise;
        },
        return (value) {
            // Called when breaking, returning, throwing out of a `for await...of`.
            cleanup();
            return Promise.resolve({
                done: true,
                value
            });
        },
        throw (value) {
            // Almost never called. Something about `yield*` maybe?
            cleanup();
            return Promise.reject(value);
        }
    };
};
ZipFile.prototype.openReadStream = function(entry, options1, callback) {
    var self = this;
    // parameter validation
    var relativeStart = 0;
    var relativeEnd = entry.compressedSize;
    if (callback == null) {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) {
        options1 = {};
    } else {
        if (options1.decodeFileData === false) {
            // new, simple option
            if (options1.decrypt != null) {
                throw new Error("cannot use options.decrypt when options.decodeFileData === false");
            }
            if (options1.decompress != null) {
                throw new Error("cannot use options.decompress when options.decodeFileData === false");
            }
        // start and end are allowed
        } else {
            // old, complicated options
            if (options1.decrypt != null) {
                if (!entry.isEncrypted()) {
                    throw new Error("options.decrypt can only be specified for encrypted entries. See also option decodeFileData.");
                }
                if (options1.decrypt !== false) throw new Error("invalid options.decrypt value: " + options1.decrypt);
                if (entry.isCompressed()) {
                    if (options1.decompress !== false) throw new Error("entry is encrypted and compressed, and options.decompress !== false. See also option decodeFileData.");
                }
            }
            if (options1.decompress != null) {
                if (!entry.isCompressed()) {
                    throw new Error("options.decompress can only be specified for compressed entries. See also option decodeFileData.");
                }
                if (!(options1.decompress === false || options1.decompress === true)) {
                    throw new Error("invalid options.decompress value: " + options1.decompress);
                }
                decompress = options1.decompress;
            }
        }
        if (options1.start != null) {
            relativeStart = options1.start;
            if (relativeStart < 0) throw new Error("options.start < 0");
            if (relativeStart > entry.compressedSize) throw new Error("options.start > entry.compressedSize");
        }
        if (options1.end != null) {
            relativeEnd = options1.end;
            if (relativeEnd < 0) throw new Error("options.end < 0");
            if (relativeEnd > entry.compressedSize) throw new Error("options.end > entry.compressedSize");
            if (relativeEnd < relativeStart) throw new Error("options.end < options.start");
        }
    }
    var rawMode = options1.decodeFileData === false || (entry.compressionMethod === 0 || entry.compressionMethod === 8 && options1.decompress === false // Deprecated compression bypass option.
    ) && (!entry.isEncrypted() || // Naturally without encryption.
    options1.decrypt === false // Deprecated encryption bypass option.
    );
    if (options1.start != null || options1.end != null) {
        // Ensure slicing deals with raw data.
        if (!rawMode) throw new Error("start/end range require options.decodeFileData === false for non-trivial encoded entries.");
    }
    // any further errors can either be caused by the zipfile,
    // or were introduced in a minor version of yauzl,
    // so should be passed to the client rather than thrown.
    if (!self.isOpen) return callback(new Error("closed"));
    if (entry.isEncrypted() && !rawMode) {
        if (options1.decrypt !== false) return callback(new Error("entry is encrypted, and options.decodeFileData !== false"));
    }
    var decompress;
    if (rawMode) {
        decompress = false;
    } else if (entry.compressionMethod === 8) {
        // 8 - The file is Deflated
        decompress = options1.decodeFileData !== true;
    } else {
        return callback(new Error("unsupported compression method: " + entry.compressionMethod));
    }
    self.readLocalFileHeader(entry, {
        minimal: true
    }, function(err, localFileHeader) {
        if (err) return callback(err);
        self.openReadStreamLowLevel(localFileHeader.fileDataStart, entry.compressedSize, relativeStart, relativeEnd, decompress, entry.uncompressedSize, callback);
    });
};
ZipFile.prototype.openReadStreamLowLevel = function(fileDataStart, compressedSize, relativeStart, relativeEnd, decompress, uncompressedSize, callback) {
    var self = this;
    var fileDataEnd = fileDataStart + compressedSize;
    var readStream = self.reader.createReadStream({
        start: fileDataStart + relativeStart,
        end: fileDataStart + relativeEnd
    });
    var endpointStream = readStream;
    if (decompress) {
        var destroyed = false;
        var inflateFilter = zlib.createInflateRaw();
        readStream.on("error", function(err) {
            // setImmediate here because errors can be emitted during the first call to pipe()
            setImmediate(function() {
                if (!destroyed) inflateFilter.emit("error", err);
            });
        });
        readStream.pipe(inflateFilter);
        if (self.validateEntrySizes) {
            endpointStream = new AssertByteCountStream(uncompressedSize);
            inflateFilter.on("error", function(err) {
                // forward zlib errors to the client-visible stream
                setImmediate(function() {
                    if (!destroyed) endpointStream.emit("error", err);
                });
            });
            inflateFilter.pipe(endpointStream);
        } else {
            // the zlib filter is the client-visible stream
            endpointStream = inflateFilter;
        }
        // this is part of yauzl's API, so implement this function on the client-visible stream
        installDestroyFn(endpointStream, function() {
            destroyed = true;
            if (inflateFilter !== endpointStream) inflateFilter.unpipe(endpointStream);
            readStream.unpipe(inflateFilter);
            // TODO: the inflateFilter may cause a memory leak. see Issue #27.
            readStream.destroy();
        });
    }
    callback(null, endpointStream);
};
ZipFile.prototype.readLocalFileHeader = function(entry, options1, callback) {
    var self = this;
    if (callback == null) {
        callback = options1;
        options1 = null;
    }
    if (options1 == null) options1 = {};
    self.reader.ref();
    var buffer = newBuffer(30);
    readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader, function(err) {
        try {
            if (err) return callback(err);
            // 0 - Local file header signature = 0x04034b50
            var signature = buffer.readUInt32LE(0);
            if (signature !== 0x04034b50) {
                return callback(new Error("invalid local file header signature: 0x" + signature.toString(16)));
            }
            var fileNameLength = buffer.readUInt16LE(26);
            var extraFieldLength = buffer.readUInt16LE(28);
            var fileDataStart = entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength;
            // We now have enough information to do this bounds check.
            if (fileDataStart + entry.compressedSize > self.fileSize) {
                return callback(new Error("file data overflows file bounds: " + fileDataStart + " + " + entry.compressedSize + " > " + self.fileSize));
            }
            if (options1.minimal) {
                return callback(null, {
                    fileDataStart: fileDataStart
                });
            }
            var localFileHeader = new LocalFileHeader();
            localFileHeader.fileDataStart = fileDataStart;
            // 4 - Version needed to extract (minimum)
            localFileHeader.versionNeededToExtract = buffer.readUInt16LE(4);
            // 6 - General purpose bit flag
            localFileHeader.generalPurposeBitFlag = buffer.readUInt16LE(6);
            // 8 - Compression method
            localFileHeader.compressionMethod = buffer.readUInt16LE(8);
            // 10 - File last modification time
            localFileHeader.lastModFileTime = buffer.readUInt16LE(10);
            // 12 - File last modification date
            localFileHeader.lastModFileDate = buffer.readUInt16LE(12);
            // 14 - CRC-32
            localFileHeader.crc32 = buffer.readUInt32LE(14);
            // 18 - Compressed size
            localFileHeader.compressedSize = buffer.readUInt32LE(18);
            // 22 - Uncompressed size
            localFileHeader.uncompressedSize = buffer.readUInt32LE(22);
            // 26 - File name length (n)
            localFileHeader.fileNameLength = fileNameLength;
            // 28 - Extra field length (m)
            localFileHeader.extraFieldLength = extraFieldLength;
            // 30 - File name
            // 30+n - Extra field
            buffer = newBuffer(fileNameLength + extraFieldLength);
            self.reader.ref();
            readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader + 30, function(err) {
                try {
                    if (err) return callback(err);
                    localFileHeader.fileName = buffer.subarray(0, fileNameLength);
                    localFileHeader.extraField = buffer.subarray(fileNameLength);
                    return callback(null, localFileHeader);
                } finally{
                    self.reader.unref();
                }
            });
        } finally{
            self.reader.unref();
        }
    });
};
ZipFile.prototype.openReadStreamPromise = function(entry, options1) {
    return new Promise((resolve, reject)=>{
        this.openReadStream(entry, options1, function(err, readStream) {
            if (err) return reject(err);
            resolve(readStream);
        });
    });
};
ZipFile.prototype.openReadStreamLowLevelPromise = function(fileDataStart, compressedSize, relativeStart, relativeEnd, decompress, uncompressedSize) {
    return new Promise((resolve, reject)=>{
        this.openReadStream(fileDataStart, compressedSize, relativeStart, relativeEnd, decompress, uncompressedSize, function(err, readStream) {
            if (err) return reject(err);
            resolve(readStream);
        });
    });
};
ZipFile.prototype.readLocalFileHeaderPromise = function(entry, options1) {
    return new Promise((resolve, reject)=>{
        this.readLocalFileHeader(entry, options1, function(err, localFileHeader) {
            if (err) return reject(err);
            resolve(localFileHeader);
        });
    });
};
function Entry() {}
Entry.prototype.getLastModDate = function(options1) {
    if (options1 == null) options1 = {};
    if (!options1.forceDosFormat) {
        // Check extended fields.
        for(var i = 0; i < this.extraFields.length; i++){
            var extraField = this.extraFields[i];
            if (extraField.id === 0x5455) {
                // Info-ZIP "universal timestamp" extended field (`0x5455` aka `"UT"`).
                // See the Info-ZIP source code unix/unix.c:set_extra_field() and zipfile.c:ef_scan_ut_time().
                var data = extraField.data;
                if (data.length < 5) continue; // Too short.
                // The flags define which of the three fields are present: mtime, atime, ctime.
                // We only care about mtime.
                // Also, ctime is never included in practice.
                // And also, atime is only included in the local file header for some reason
                // despite the flags lying about its inclusion in the central header.
                var flags = data[0];
                var HAS_MTIME = 1;
                if (!(flags & HAS_MTIME)) continue; // This will realistically never happen.
                // Although the positions of all of the fields shift around depending on the presence of other fields,
                // mtime is always first if present, and that's the only one we care about.
                var posixTimestamp = data.readInt32LE(1);
                return new Date(posixTimestamp * 1000);
            } else if (extraField.id === 0x000a) {
                var data = extraField.data;
                if (data.length !== 32) continue; // The length is always the same.
                // 4 bytes reserved
                // 2 bytes Tag
                if (data.readUInt16LE(4) !== 1) continue; // Tag1 is actually the only defined Tag.
                // 2 bytes Size
                if (data.readUInt16LE(6) !== 24) continue; // Size is always 24.
                // 8 bytes Mtime
                var hundredNanoSecondsSince1601 = data.readUInt32LE(8) + 4294967296 * data.readInt32LE(12);
                // Convert from NTFS to POSIX milliseconds.
                // The big number below is the milliseconds between year 1601 and year 1970
                // (i.e. the negative POSIX timestamp of 1601-01-01 00:00:00Z)
                var millisecondsSince1970 = hundredNanoSecondsSince1601 / 10000 - 11644473600000;
                // Note on numeric precision: JavaScript Number objects lose precision above Number.MAX_SAFE_INTEGER,
                // and NTFS timestamps are typically much bigger than that limit.
                // (MAX_SAFE_INTEGER would represent 1629-07-17T23:58:45.475Z.)
                // However, we're losing precision in the conversion from 100nanosecond units to millisecond units anyway,
                // and the time at which we also lose 1-millisecond precision is year 275760, the JavaScript Date limit (by design).
                // Up through the year 2057, this conversion only drops 4 bits of precision,
                // which is well under the 13-14 bits ratio between the milliseconds and 100nanoseconds.
                return new Date(millisecondsSince1970);
            }
        }
    }
    // Fallback to non-extended encoding.
    return dosDateTimeToDate(this.lastModFileDate, this.lastModFileTime, options1.timezone);
};
Entry.prototype.canDecodeFileData = function() {
    return !this.isEncrypted() && (this.compressionMethod === 0 || this.compressionMethod === 8);
};
Entry.prototype.isEncrypted = function() {
    return (this.generalPurposeBitFlag & 0x1) !== 0;
};
Entry.prototype.isCompressed = function() {
    return this.compressionMethod === 8;
};
function LocalFileHeader() {}
function dosDateTimeToDate(date, time, timezone) {
    var day = date & 0x1f; // 1-31
    var month = (date >> 5 & 0xf) - 1; // 1-12, 0-11
    var year = (date >> 9 & 0x7f) + 1980; // 0-128, 1980-2108
    var millisecond = 0;
    var second = (time & 0x1f) * 2; // 0-29, 0-58 (even numbers)
    var minute = time >> 5 & 0x3f; // 0-59
    var hour = time >> 11 & 0x1f; // 0-23
    if (timezone == null || timezone === "local") {
        return new Date(year, month, day, hour, minute, second, millisecond);
    } else if (timezone === "UTC") {
        return new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
    } else {
        throw new Error("unrecognized options.timezone: " + options.timezone);
    }
}
function getFileNameLowLevel(generalPurposeBitFlag, fileNameBuffer, extraFields, strictFileNames) {
    var fileName = null;
    // check for Info-ZIP Unicode Path Extra Field (0x7075)
    // see https://github.com/thejoshwolfe/yauzl/issues/33
    for(var i = 0; i < extraFields.length; i++){
        var extraField = extraFields[i];
        if (extraField.id === 0x7075) {
            if (extraField.data.length < 6) {
                continue;
            }
            // Version       1 byte      version of this extra field, currently 1
            if (extraField.data.readUInt8(0) !== 1) {
                continue;
            }
            // NameCRC32     4 bytes     File Name Field CRC32 Checksum
            var oldNameCrc32 = extraField.data.readUInt32LE(1);
            if (crc32(fileNameBuffer) !== oldNameCrc32) {
                continue;
            }
            // UnicodeName   Variable    UTF-8 version of the entry File Name
            fileName = decodeBuffer(extraField.data.subarray(5), true);
            break;
        }
    }
    if (fileName == null) {
        // The typical case.
        var isUtf8 = (generalPurposeBitFlag & 0x800) !== 0;
        fileName = decodeBuffer(fileNameBuffer, isUtf8);
    }
    if (!strictFileNames) {
        // Allow backslash.
        fileName = fileName.replace(/\\/g, "/");
    }
    return fileName;
}
function validateFileName(fileName) {
    if (fileName.indexOf("\\") !== -1) {
        return "invalid characters in fileName: " + fileName;
    }
    if (/^[a-zA-Z]:/.test(fileName) || /^\//.test(fileName)) {
        return "absolute path: " + fileName;
    }
    if (fileName.split("/").indexOf("..") !== -1) {
        return "invalid relative path: " + fileName;
    }
    // all good
    return null;
}
function parseExtraFields(extraFieldBuffer) {
    var extraFields = [];
    var i = 0;
    while(i < extraFieldBuffer.length - 3){
        var headerId = extraFieldBuffer.readUInt16LE(i + 0);
        var dataSize = extraFieldBuffer.readUInt16LE(i + 2);
        var dataStart = i + 4;
        var dataEnd = dataStart + dataSize;
        if (dataEnd > extraFieldBuffer.length) throw new Error("extra field length exceeds extra field buffer size");
        var dataBuffer = extraFieldBuffer.subarray(dataStart, dataEnd);
        extraFields.push({
            id: headerId,
            data: dataBuffer
        });
        i = dataEnd;
    }
    return extraFields;
}
function readAndAssertNoEof(reader, buffer, offset, length, position, callback) {
    if (length === 0) {
        // fs.read will throw an out-of-bounds error if you try to read 0 bytes from a 0 byte file
        return setImmediate(function() {
            callback(null, newBuffer(0));
        });
    }
    reader.read(buffer, offset, length, position, function(err, bytesRead) {
        if (err) return callback(err);
        if (bytesRead < length) {
            return callback(new Error("unexpected EOF"));
        }
        callback();
    });
}
util.inherits(AssertByteCountStream, Transform);
function AssertByteCountStream(byteCount) {
    Transform.call(this);
    this.actualByteCount = 0;
    this.expectedByteCount = byteCount;
}
AssertByteCountStream.prototype._transform = function(chunk, encoding, cb) {
    this.actualByteCount += chunk.length;
    if (this.actualByteCount > this.expectedByteCount) {
        var msg = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
        return cb(new Error(msg));
    }
    cb(null, chunk);
};
AssertByteCountStream.prototype._flush = function(cb) {
    if (this.actualByteCount < this.expectedByteCount) {
        var msg = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
        return cb(new Error(msg));
    }
    cb();
};
util.inherits(RandomAccessReader, EventEmitter);
function RandomAccessReader() {
    EventEmitter.call(this);
    this.refCount = 0;
}
RandomAccessReader.prototype.ref = function() {
    this.refCount += 1;
};
RandomAccessReader.prototype.unref = function() {
    var self = this;
    self.refCount -= 1;
    if (self.refCount > 0) return;
    if (self.refCount < 0) throw new Error("invalid unref");
    self.close(onCloseDone);
    function onCloseDone(err) {
        if (err) return self.emit('error', err);
        self.emit('close');
    }
};
RandomAccessReader.prototype.createReadStream = function(options1) {
    if (options1 == null) options1 = {};
    var start = options1.start;
    var end = options1.end;
    if (start === end) {
        var emptyStream = new PassThrough();
        setImmediate(function() {
            emptyStream.end();
        });
        return emptyStream;
    }
    var stream = this._readStreamForRange(start, end);
    var destroyed = false;
    var refUnrefFilter = new RefUnrefFilter(this);
    stream.on("error", function(err) {
        setImmediate(function() {
            if (!destroyed) refUnrefFilter.emit("error", err);
        });
    });
    installDestroyFn(refUnrefFilter, function() {
        stream.unpipe(refUnrefFilter);
        refUnrefFilter.unref();
        stream.destroy();
    });
    var byteCounter = new AssertByteCountStream(end - start);
    refUnrefFilter.on("error", function(err) {
        setImmediate(function() {
            if (!destroyed) byteCounter.emit("error", err);
        });
    });
    installDestroyFn(byteCounter, function() {
        destroyed = true;
        refUnrefFilter.unpipe(byteCounter);
        refUnrefFilter.destroy();
    });
    return stream.pipe(refUnrefFilter).pipe(byteCounter);
};
RandomAccessReader.prototype._readStreamForRange = function(start, end) {
    throw new Error("not implemented");
};
RandomAccessReader.prototype.read = function(buffer, offset, length, position, callback) {
    var readStream = this.createReadStream({
        start: position,
        end: position + length
    });
    var writeStream = new Writable();
    var written = 0;
    writeStream._write = function(chunk, encoding, cb) {
        chunk.copy(buffer, offset + written, 0, chunk.length);
        written += chunk.length;
        cb();
    };
    writeStream.on("finish", callback);
    readStream.on("error", function(error) {
        callback(error);
    });
    readStream.pipe(writeStream);
};
RandomAccessReader.prototype.close = function(callback) {
    setImmediate(callback);
};
util.inherits(RefUnrefFilter, PassThrough);
function RefUnrefFilter(context) {
    PassThrough.call(this);
    this.context = context;
    this.context.ref();
    this.unreffedYet = false;
}
RefUnrefFilter.prototype._flush = function(cb) {
    this.unref();
    cb();
};
RefUnrefFilter.prototype.unref = function(cb) {
    if (this.unreffedYet) return;
    this.unreffedYet = true;
    this.context.unref();
};
var cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
function decodeBuffer(buffer, isUtf8) {
    if (isUtf8) {
        return buffer.toString("utf8");
    } else {
        var result = "";
        for(var i = 0; i < buffer.length; i++){
            result += cp437[buffer[i]];
        }
        return result;
    }
}
function readUInt64LE(buffer, offset) {
    // There is no native function for this, because we can't actually store 64-bit integers precisely.
    // after 53 bits, JavaScript's Number type (IEEE 754 double) can't store individual integers anymore.
    // but since 53 bits is a whole lot more than 32 bits, we do our best anyway.
    // As of 2020, Node has added support for BigInt, which obviates this whole function,
    // but yauzl hasn't been updated to depend on BigInt (yet?).
    var lower32 = buffer.readUInt32LE(offset);
    var upper32 = buffer.readUInt32LE(offset + 4);
    // we can't use bitshifting here, because JavaScript bitshifting only works on 32-bit integers.
    return upper32 * 0x100000000 + lower32;
// as long as we're bounds checking the result of this function against the total file size,
// we'll catch any overflow errors, because we already made sure the total file size was within reason.
}
// Node 10 deprecated new Buffer().
var newBuffer;
if (typeof Buffer.allocUnsafe === "function") {
    newBuffer = function(len) {
        return Buffer.allocUnsafe(len);
    };
} else {
    newBuffer = function(len) {
        return new Buffer(len);
    };
}
// Node 8 introduced a proper destroy() implementation on writable streams.
function installDestroyFn(stream, fn) {
    if (typeof stream.destroy === "function") {
        // New API.
        stream._destroy = function(err, cb) {
            fn();
            if (cb != null) cb(err);
        };
    } else {
        // Old API.
        stream.destroy = fn;
    }
}
function defaultCallback(err) {
    if (err) throw err;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__20fe-av751b5-._.js.map