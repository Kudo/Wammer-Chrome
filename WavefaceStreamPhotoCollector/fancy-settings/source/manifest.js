// SAMPLE
this.manifest = {
    "name": "Waveface Web Clipper",
    "icon": "../../waveface_icon_128.png",
    "settings": [
        {
            "tab": i18n.get("settings"),
            "group": i18n.get("endpoints"),
            "name": "endpoints",
            "type": "radioButtons",
            "options": [
                ["production", i18n.get("production")],
                ["staging", i18n.get("staging")],
                ["development", i18n.get("development")]
            ]
        }
    ]
};
