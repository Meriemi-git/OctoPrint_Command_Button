# -*- coding: utf-8 -*-
from __future__ import absolute_import, unicode_literals

import octoprint.plugin


class CommandButtonPlugin(octoprint.plugin.StartupPlugin, octoprint.plugin.TemplatePlugin, octoprint.plugin.SettingsPlugin, octoprint.plugin.AssetPlugin):
    def on_after_startup(self):
        self._logger.info("Hello World!")

    def get_settings_defaults(self):
        return dict(
            commands=[],
            terminal_controls=[]
        )

    def get_assets(self):
        return dict(
                js=["js/jquery-ui.min.js","js/knockout-sortable.1.2.0.js","js/fontawesome-iconpicker.js","js/ko.iconpicker.js","js/command_button.js"],
                css=["css/font-awesome.min.css","css/font-awesome-v4-shims.min.css","css/fontawesome-iconpicker.css","css/command_button.css"]
                )


__plugin_name__ = "Command Button"
__plugin_pythoncompat__ = ">=2.7,<4"
__plugin_implementation__ = CommandButtonPlugin()
