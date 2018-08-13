const fs = require('fs')
const path = require('path')
const babylon = require('babylon')
const traverse = require('babel-traverse').default
const {transformFromAst,} = require('babel-core')

let ID = 0

function createAsset(filename) {
    const content = fs.readFileSync(filename, 'utf-8')

    const ast = babylon.parse(content,
        {sourceType: 'module'}
    )

    const dependencies = []

    traverse(ast, {
        ImportDeclaration: obj => {
            const {node} = obj
            const relativePath = node.source.value
            dependencies.push({
                relative: relativePath, 
                absolute: path.join(path.dirname(filename), relativePath),
            })
        }
    })

    const {code} = transformFromAst(ast, null, {
        presets: ['env'],
    })

    return {
        id: ID++,
        filename,
        dependencies,
        code,
    }

    
}

function createGraph(entry) {
    const main = createAsset(entry)
    const queue = [main]
    
    for (const asset of queue) {
        asset.mapping = {}
        asset.dependencies.forEach(({relative, absolute,}) => {
            const child = createAsset(absolute)
            asset.mapping[relative] = child.id
            queue.push(child)
        }) 
    }
    return queue

}
const mainasset = createGraph('./example/entry.js')
console.log(mainasset)