// @ts-check

let action = tiled.registerAction("CreateKristalLayers", function(action) {
    const asset = tiled.activeAsset
    if (!asset || !asset.isTileMap) {
        tiled.alert("Not a tile map!"); return;
    } /* @ts-ignore */
    /** @type {TileMap} */ const map = asset
    const tryAddLayer = function (/** @type {string} */ name, /** @type {string} */ color) {
        for (let i = 0; i < map.layers.length; i++) {
            const layer = map.layers[i];
            if (layer.isObjectLayer && layer.name == name) {return}
        }
        let layer = new ObjectGroup(name)
        if (color) layer.color = tiled.color(color)
        map.addLayer(layer)
    }
    tryAddLayer("collision", "#0000FF")
    tryAddLayer("objects", "#FF00FF")
    tryAddLayer("controllers")
    tryAddLayer("markers", "#7F00FF")
    tryAddLayer("battleareas", "#00FF00")
})

action.shortcut = "Ctrl+K"
action.text = "Create Kristal layers"

tiled.extendMenu("Map", [
    {action: "CreateKristalLayers", before: "MapProperties"}
])
