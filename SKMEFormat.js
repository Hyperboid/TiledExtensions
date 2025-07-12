// @ts-check

var lon = {
    /**
     * @param {string[]} chars 
     * @returns {[Object|Array, string[]]|void}
     */
    evaltable(chars) {
        let object = {}
        let array = []
        let use_array = true

        while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
            chars.shift()
        }
        if (chars[0] == "}") {
            chars.shift()
            return [{}, chars]
        }
        while (chars[0]) {
            while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
                chars.shift()
            }
            let key
            if (chars[0] == "[") {
                chars.shift()
                let [newkey, newchars] = lon.evalsubstr(chars)
                chars = newchars || chars
                key = newkey || key
                chars.shift()
            } else {
                key = ""
                while (chars[0].match(/^\w+$/)) {
                    key = key + chars.shift()
                }
            }
            while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
                chars.shift()
            }
            if (chars.shift() !== "=") {
                throw new Error("Key " + key + ", Expected \"=\" before " + chars.join(""));
            }
            let [value, newchars] = lon.evalsubstr(chars)
            chars = newchars || chars
            object[key] = value
            array[key - 1] = value
            if (typeof key != "number" ) {
                use_array = false
            }
            while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
                chars.shift()
            }
            if (chars[0] == ",") {
                chars.shift()
                // throw new Error("Expected \",\" before " + chars.join(""));
            }
            
            while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
                chars.shift()
            }

            if (chars[0] == "}") {
                break
            }
        }
        chars.shift()
        return [use_array ? array : object, chars]
    },
    /**
     * @param {string[]} chars 
     * @returns {[any, string[]]}
     */
    evalsubstr(chars) {
        while (chars[0] && (chars[0] === " " || chars[0] === "\n")) {
            chars.shift()
        }
        let firstchar = chars.shift()
        let value
        if (!firstchar) {
            console.error("im confus");
        } else if (firstchar === "{") {
            [value, chars] = lon.evaltable([...chars])
        } else if (firstchar === "t") {
            chars.shift()
            chars.shift()
            chars.shift()
            value = true
        } else if (firstchar === "f") {
            chars.shift()
            chars.shift()
            chars.shift()
            chars.shift()
            value = false
        } else if (!isNaN(Number(firstchar)) || firstchar == "-") {
            let numstr = firstchar
            while (chars[0] && !isNaN(Number(chars[0]))) {
                if (chars[0] === "\\") {
                    chars.shift()
                }
                numstr = numstr + chars.shift()
            }
            value = Number(numstr)
        } else if (firstchar === "\"") {
            value = ""
            while (chars[0] && chars[0] !== "\"") {
                if (chars[0] === "\\") {
                    chars.shift()
                }
                value = value + chars.shift()
            }
            chars.shift()
        }
        return [value, chars]
    },
    deserialize(str) {
        return this.evalsubstr(str.split(""))[0]
    },
}

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
            read: SKME.read,
        })
    },
    /**
     * @param {TileMap} map 
     * @param {string} fileName 
     * @returns {string | undefined}
     */
    write(map, fileName) {
        let file = new TextFile(fileName, TextFile.WriteOnly)
        // @ts-ignore because it doesn't see it as optional
        file.write("return " + SKME.object_to_luastring(SKME.saveMap(map)))
        file.commit()
        return
    },

    /**
     * @returns {TileMap}
     * @param {string} fileName 
     */
    read(fileName) {
        let file = new TextFile(fileName)
        let map = SKME.loadMap(lon.deserialize(file.readAll().substring(7)))
        file.close()
        return map
    },

    loadMap(data) {
        let map = new TileMap()
        map.tileHeight = 40
        map.tileWidth = 40
        map.width = data.width
        map.height = data.height
        return map
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

    dumpKey(key) {
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
tiled.log("\n\n\n\n".repeat(10))

tiled.log("res: " + JSON.stringify(lon.deserialize(`{
    ["some_key"] = 1,
    dictionary = {
        wowie = "zowie",
    }
    somearray = {
        [1] = 1,
        [2] = 2,
    },
    empty = {},
    morestuff = true,
    evilnumber = -4,
}`)))