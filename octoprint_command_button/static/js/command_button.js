$(function () {
    function CommandButtonViewModel(parameters) {
        var self = this;

        self.loginStateViewModel = parameters[0];
        self.settingsViewModel = parameters[1];
        self.controlViewModel = parameters[2];
        self.terminalViewModel = parameters[3];

        self.selected_command = ko.observable();

        self.onBeforeBinding = function () {
            self.settings = self.settingsViewModel.settings;
            self.multidimensional_array = ko.computed(function () {
                let matrix = [[]], column_counter = 0, row_counter = 0;
                ko.utils.arrayForEach(self.settingsViewModel.settings.plugins.command_button.commands(), function (item) {
                    column_counter += (parseInt(item.width()) + parseInt(item.offset()));
                    if (column_counter > 12) {
                        row_counter++;
                        column_counter = parseInt(item.width()) + parseInt(item.offset());
                        matrix[row_counter] = [];
                    }
                    matrix[row_counter].push(item);
                });
                return matrix;
            });
        };

        // Custom command list functions

        self.showEditor = function (data) {
            self.selected_command(data);
            $('#command_button_editor').modal('show');
        };

        self.addCommand = function () {
            self.selected_command({
                icon: ko.observable('fas fa-gear'),
                label: ko.observable(''),
                tooltip: ko.observable(''),
                width: ko.observable(3),
                offset: ko.observable(0),
                command: ko.observable(''),
                confirmation: ko.observable(false),
                message: ko.observable(''),
                input: ko.observableArray([]),
                enabled_while_printing: ko.observable(false)
            });
            self.settingsViewModel.settings.plugins.command_button.commands.push(self.selected_command());
            $('#command_button_editor').modal('show');
        };

        self.addBreak = function () {
            self.selected_command({
                icon: ko.observable('fas fa-gear'),
                label: ko.observable('<BR>'),
                tooltip: ko.observable(''),
                width: ko.observable(12),
                offset: ko.observable(0),
                command: ko.observable(''),
                confirmation: ko.observable(false),
                message: ko.observable(''),
                input: ko.observableArray([]),
                enabled_while_printing: ko.observable(false)
            });
            self.settingsViewModel.settings.plugins.command_button.commands.push(self.selected_command());
        };
        self.copyCommand = function (data) {
            self.settingsViewModel.settings.plugins.command_button.commands.push({
                icon: ko.observable(data.icon()),
                label: ko.observable(data.label()),
                tooltip: ko.observable(data.tooltip()),
                command: ko.observable(data.command()),
                width: ko.observable(data.width()),
                offset: ko.observable(data.offset()),
                confirmation: ko.observable(data.confirmation()),
                message: ko.observable(data.message()),
                input: ko.observableArray(data.input()),
                enabled_while_printing: ko.observable(data.enabled_while_printing())
            });
        };

        self.removeCommand = function (data) {
            self.settingsViewModel.settings.plugins.command_button.commands.remove(data);
        };

        self.addParameter = function (data) {
            data.input.push({ label: ko.observable(''), parameter: ko.observable(''), value: ko.observable('') });
        }

        self.insertParameter = function (data) {
            var text = self.selected_command().command();
            text += '%(' + data.parameter() + ')s';
            self.selected_command().command(text);
            console.log(data);
        }

        self.removeParameter = function (data) {
            var text = self.selected_command().command();
            var search = '%\\(' + data.parameter() + '\\)s';
            var re = new RegExp(search, "gm");
            var new_text = text.replace(re, '');
            self.selected_command().command(new_text);
            self.selected_command().input.remove(data);
        }

        self.runCustomCommand = function (data) {
            var gcode_cmds = data.command().split("\n");
            var parameters = {};

            // clean extraneous code
            gcode_cmds = gcode_cmds.filter(function (array_val) {
                var x = Boolean(array_val);
                return x == true;
            });
            if (data.input().length > 0) {
                _.each(data.input(), function (input) {
                    if (!input.hasOwnProperty("parameter") || !input.hasOwnProperty("value")) {
                        return;
                    }
                    parameters[input.parameter()] = input.value();
                });
            }
            if (data.confirmation()) {
                showConfirmationDialog({
                    message: data.message(),
                    onproceed: function (e) {
                        OctoPrint.control.sendGcodeWithParameters(gcode_cmds, parameters);
                    }
                });
            } else {
                console.log("data", data)
                OctoPrint.system.executeCommand("custom", data.label());
                $.ajax({
                    url: API_BASEURL + "settings",
                    type: "GET",
                    dataType: "json",
                    success: function (response) {
                        console.log("Get system commands", response.system.actions)
                    }
                });
            }
        };

        self.onSettingsBeforeSave = function () {
            var customs = []
            _.each(self.settingsViewModel.settings.plugins.command_button.commands(), function (command) {
                var systemCommand = {
                    command: command.command(),
                    action: command.label(),
                    name: command.label(),
                    source: "custom"
                }
                customs.push(systemCommand)
            })
            console.log("customs", customs)
            self.settingsViewModel.system_actions(customs)
        };
    }

    // This is how our plugin registers itself with the application, by adding some configuration
    // information to the global variable OCTOPRINT_VIEWMODELS
    OCTOPRINT_VIEWMODELS.push([
        // This is the constructor to call for instantiating the plugin
        CommandButtonViewModel,
        // This is a list of dependencies to inject into the plugin, the order which you request
        // here is the order in which the dependencies will be injected into your view model upon
        // instantiation via the parameters argument
        ["loginStateViewModel", "settingsViewModel", "controlViewModel", "terminalViewModel"],
        // Finally, this is the list of selectors for all elements we want this view model to be bound to.
        ["#control-terminal-custom", "#command_button", "#settings_plugin_command_button"]
    ]);
});
