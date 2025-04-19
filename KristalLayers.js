// @ts-check

function addKristalLayersTo(/** @type {TileMap} */map) {
    const tryAddLayer = function (/** @type {string} */ name, /** @type {string} */ color) {
        for (let i = 0; i < map.layers.length; i++) {
            const layer = map.layers[i];
            if (layer.isObjectLayer && layer.name == name) {return}
        }
        let layer = new ObjectGroup(name)
        if (color) layer.color = tiled.color(color)
        map.addLayer(layer)
        return layer
    }
    tryAddLayer("objects_bg")
    tryAddLayer("objects_party", "#FF00FF")
    tryAddLayer("objects_fg")
    tryAddLayer("collision", "#0000FF")
    tryAddLayer("controllers", "#00C000")
    tryAddLayer("markers", "#7F00FF")
    tryAddLayer("battleareas", "#00FF00")
}

let action = tiled.registerAction("CreateKristalLayers", function(action) {
    const asset = tiled.activeAsset
    if (!asset || !asset.isTileMap) {
        tiled.alert("Not a tile map!"); return;
    }
    const map = /** @type {TileMap} */ (asset)

    addKristalLayersTo(map)
    
})
let auto_create = tiled.registerAction("AutoCreateKristalLayers", function(action) {
    // TODO: Save this preference
})

tiled.assetCreated.connect(function(asset) {
    if (!auto_create.checked) return
    if (!asset.isTileMap) return
    const map = /** @type {TileMap} */ (asset)
    addKristalLayersTo(map)
})

action.shortcut = "Ctrl+K"
action.text = "Create Kristal layers"

auto_create.text = "Automatically Create Kristal layers"
auto_create.iconVisibleInMenu = false
auto_create.checkable = true
auto_create.checked = false

tiled.extendMenu("Map", [
    {action: "CreateKristalLayers", before: "MapProperties"}
])

tiled.extendMenu("Edit", [
    {action: "AutoCreateKristalLayers", before: "Preferences"}
])
