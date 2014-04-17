var puca = {};
puca.plugins = [];

(function () {
    var includes = [
        "/puca/api/site" /* assume we always want this */
    ];

    includes.forEach(function(include, i){
        var script = document.createElement("script");
        script.setAttribute("src", include);
        script.setAttribute("type", "text/javascript");
        document.write(script.outerHTML);
    });
})();

document.addEventListener("DOMContentLoaded", function onDOMContentLoaded() {
    document.removeEventListener("DOMContentLoaded", onDOMContentLoaded); // remove self
    
    puca.plugins.forEach(function (plugin, i) {
        if (typeof plugin.init == "function") {
            plugin.init.call(plugin);
        }
    });
    
    var body = document.body.innerHTML;
    document.body.innerHTML = Handlebars.compile(body)(puca);
    var title = puca.site.title || "";
    document.title = Handlebars.compile(title)(puca);
});

/**
 * The constructor for a Púca plugin
 * @param id The ID to be used by the plugin and the tag name of the plugin view.
 */
function PucaPlugin(id) {
    if (!/^[a-z]+$/.test(id)) {
        console.error("Plugin IDs can only contain lowecase letters.");
        return;
    }
    
    this.id = id;
    
    var _that = this;

    var PluginElementPrototype = Object.create(HTMLElement.prototype);
    
    PluginElementPrototype.createdCallback = function () {
        _that.update.call(_that, this);
    };
    
    PluginElementPrototype.attributeChangedCallback = function () {
        _that.update.call(_that, this);
    };

    // register with the document
    var PluginElement = document.register('x-' + this.id, {
        prototype: PluginElementPrototype
    });
    
    puca.plugins.push(this);
};

PucaPlugin.prototype.name = null;
PucaPlugin.prototype.description = null;
PucaPlugin.prototype.id = null;
PucaPlugin.prototype.init = function () {};
PucaPlugin.prototype.update = function () {};
