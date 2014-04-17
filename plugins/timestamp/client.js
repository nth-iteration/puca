var Timestamp = new PucaPlugin();

// updates the HTML tags associated with each plugin
Timestamp.update = function (view) {
    view.innerHTML = new Date();
};
