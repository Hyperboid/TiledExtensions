// @ts-check
var SKME = {
    Utils: {
        startsWith(value, prefix){
            return value.startsWith(prefix)
        }
    },
    init() {
        tiled.registerMapFormat("skme", {
            extension: "lua",
            name: "Stupid Kristal Map Editor",
            outputFiles: SKME.outputFiles,
            write: SKME.write,
        })
    },
    /**
     * @param {TileMap} map 
     * @param {string} fileName 
     * @returns {string | undefined}
     */
    write(map, fileName) {
        let file = new TextFile(fileName, TextFile.WriteOnly)
        console.log(file.filePath)
        // @ts-ignore because it doesn't see it as optional
        file.write("return " + SKME.object_to_luastring(SKME.saveMap(map)))
        file.commit()
        return
    },

    /**
     * @param {TileMap} map
     * @returns {Object}
     */
    saveMap(map) {
        let data = {}
        data.format = "skme"
        data.properties = map.resolvedProperties()
        /** @type {Object[]} */
        data.layers = []
        data.width = map.width
        // data.tileWidth = map.tileWidth
        data.height = map.height
        // data.tileHeight = map.tileHeight
        for (let i = 0; i < map.layers.length; i++) {
            const layer = map.layers[i];
            data.layers.push(SKME.saveLayer(layer))
        }
        /** @type {Object[]} */
        data.tilesets = []
        for (let index = 0; index < map.tilesets.length; index++) {
            const tileset = map.tilesets[index];
            if (tileset.asset && tileset.asset.isTileMap) {
                throw "sad"
            }
        }
        data.tilesets[0] = {
            firstgid: 1,
            id: "castle",
        }
        return data
    },

    /**
     * @param {cell} cell 
     * @returns {number}
     */
    getCellGid(cell) {
        return cell.tileId + 1
    },


    /**
     * @param {Layer|TileLayer|ObjectGroup|ImageLayer} input_layer
     * @returns {Object}
     */
    saveLayer(input_layer) {
        let data = {}
        data.name = input_layer.name
        data.properties = input_layer.resolvedProperties()
        data.visible = input_layer.visible
        if (input_layer.isTileLayer) {
            data.type = "tilelayer"
            /** @type {TileLayer} */ //@ts-ignore
            let layer = input_layer
            data.opacity = layer.opacity
            data.encoding = "lua"
            data.parallaxx = layer.parallaxFactor.x
            data.parallaxy = layer.parallaxFactor.y
            /** @type {number[]} */
            data.data = []
            for (let y = 0; y < layer.height; y++) {
                for (let x = 0; x < layer.width; x++) {
                    let cell = layer.cellAt(x, y)
                    data.data.push(SKME.getCellGid(cell))
                }
            }
        } else if (input_layer.isObjectLayer) {
            /** @type {ObjectGroup} */ //@ts-ignore
            let layer = input_layer
            /** @type {Object[]} */
            var objects = []
            for (let index = 0; index < layer.objects.length; index++) {
                const object = layer.objects[index];
                let shapename = "rectangle"
                if (object.shape == MapObject.Rectangle) {
                    shapename = "rectangle"
                } else if (object.shape == MapObject.Polygon) {
                    shapename = "polygon"
                } else if (object.shape == MapObject.Polyline) {
                    shapename = "polyline"
                } else if (object.shape == MapObject.Point) {
                    shapename = "point"
                }
                objects.push({
                    x: object.x,
                    y: object.y,
                    width: object.width,
                    height: object.height,
                    properties: object.resolvedProperties(),
                    type: (object.name == "" ? object.className : object.name),
                    id: object.id,
                    shape: shapename
                })
            }
            if (layer.name.startsWith("objects") || layer.name.startsWith("controllers")) {
                data.type = layer.name.startsWith("controllers") ? "controllers" : "objectgroup"
                data.objects = objects
            } else {
                if (layer.name.startsWith("collision")) {
                    data.type = "collision"
                } else if (layer.name.startsWith("markers")) {
                    data.type = "markers"
                } else {
                    throw new Error("Invalid layer type: "+layer.name)
                }
                data.shapes = objects
            }
        }
        return data
    },

    /**
     * @param {string} buf 
     * @returns {Object}
     */
    luastring_to_object(buf) { },
    dumpKey(key) {
        console.log(key, typeof key)
        if (typeof(key) == 'object') {
            return '('+key+')'
        } else if (typeof (key) == "number") {
            return '['+(key+1)+']'
        } else if (typeof(key) == 'string' && key !== "" && key.match(/^\w+$/) && isNaN(Number(key.substring(0,1)))) {
            return key
        } else {
            return '['+JSON.stringify(key)+']'
        }
    },
    /**
     * @param {Object} o 
     * @param {number|undefined?} indent 
     * @returns {string}
     */
    object_to_luastring(o, indent) {
        indent = indent || 1
        if (typeof(o) == 'object') {
            let s = '{'
            let keys = Object.keys(o)
            if (isNaN(Number(keys[1]))) {
                keys.sort()
            }
            if (keys.length > 0) {
                s = s + '\n'
            }
            keys.forEach(function(_k) {
                /** @type {number|string} */
                let k = _k
                let v = o[k]
                // Since, for some reason, k will be a string. Genuine JS moment.
                if (!isNaN(Number(k))) {
                    k = Number(k)
                }
                s = s + ("    ").repeat(indent) + SKME.dumpKey(k) + ' = ' + SKME.object_to_luastring(v, indent + 1) + ',\n'
            })
            if (keys.length > 0) {
                s = s + ("    ").repeat(indent-1)
            }
            return s + '}'
        } else if (typeof(o) == "number") {
            return "" + o
        } else if (typeof(o) == "string") {
            return JSON.stringify(o)
        } else {
            return "" + o
        }
    },
}

SKME.init()