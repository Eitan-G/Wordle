const TrieNode = function(value) {
    this.value = value
    this.children = {}
    this.parent = null
    this.isEnd = false
    this.getWord = () => {
        let result = []
        let node = this
        while(node !== null) {
            result.push(node.value)
            node = node.parent
        }
        return result.reverse().join('')
    }
    this.destroy = () => {
        let node = this
        while (node.parent.value && !node.parent.isEnd && Object.keys(node.parent.children).length === 1) {
            node = node.parent
        }
        delete node.parent.children[node.value]
    }
}

const Trie = function() {
    this.root = new TrieNode(null)
    this.insert = (word) => {
        let node = this.root
        for (let letter of word) {
            if (node.children[letter] === undefined) {
                node.children[letter] = new TrieNode(letter)
                node.children[letter].parent = node
            }
            node = node.children[letter]
        }
        node.isEnd = true
    }
	this.insertMany = (words) => {
		words.forEach(word => this.insert(word))
	}
    this.getWords = (node=this.root, result=[]) => {
        if (node.isEnd) result.push(node.getWord())
        for (let letter in node.children) {
            this.getWords(node.children[letter], result)
        }
        return result
    }

    this.removeWords = (cbs, node = this.root, depth = -1, word=[]) => {
        depth++
        for (let child of Object.values(node.children)) {
            if (cbs.some(cb => cb(child, depth)) === true) {
                child.destroy()
                continue
            }
            this.removeWords(cbs, child, depth)
            word.pop()
        }
    }
}

module.exports = Trie