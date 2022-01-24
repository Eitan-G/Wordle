const fs = require('fs');
const Trie = require('../trie.js')

Trie.removeWords = (cbs, node = this.root, depth = -1, word=[]) => {
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

const DICTIONARY_PATH = '/Users/eitan/code/Wordle/dictionary.txt'
const CORRECT_SPOT = 'G'
const INCORRECT_SPOT = 'Y'
const NOT_IN_WORD = 'B'
const NOT_A_STRING = 'Word must be a string. Please try again.'
const INVALID_STRING = `Word must be the same length as the puzzle and only contain letters. Please try again.`
const NOT_AN_ARRAY = 'Clues must be an array. Please try again.'
const ARRAY_WRONG_LENGTH = 'Clues array is not the same length as the puzzle. Please try again.'
const INVALID_CLUES = 'Clues must be an array of valid clues (1, 0, or -1). Please try again.'

// Loads the entire file into memory. Yes, I know this is bad.
// Will update to stream the file.
const wordsWithLength = (length) => {
    const file = fs.readFileSync(DICTIONARY_PATH, 'utf-8')
    const trie = new Trie()
    let word = ''
    for (let char of file) {
        if (char === '\r') { continue }
        if (char === '\n') {
            word.length === length && trie.insert(word)
            word = ''
        } else {
            word += char
        }
    }
    // Adds the last word of the dictionary since it has no following whitespace
    trie.insert(word)
    return trie
}

class WordleHelper {
    constructor(length) {
        this.initialize(length)
    }

    initialize(length) {
        this.solution = new Array(length).fill('')
        this.trie = wordsWithLength(length)
        // Map of letters we know are in the word. Letter -> Set(incorrect indexes)
        this.incorrectSpots = {}
        this.missingLetters = new Set()
    }

    get words() { return this.trie.getWords() }
    get wordsByUniques() {
        return this.words.sort((a, b) => new Set(a).size > new Set(b).size ? -1 : 1)
    }

    doesNotMatchSolution(node, idx) {
        return this.solution[idx] !== '' && this.solution[idx] !== node.value
    }

    isNotInSolution(node) {
        return this.missingLetters.has(node.value) || false
    }

    isInIncorrectSpot(node, idx) {
        return this.incorrectSpots[node.value]?.has(idx) || false
    }

    isMissingKnownLetters(node) {
        if (!node.isEnd) { return false }
        const wordSet = new Set(node.getWord())
        for (let letter of Object.keys(this.incorrectSpots)) {
            if (!wordSet.has(letter)) { return true }
        }
        return false
    }

    validateGuess(guess, clues) {
        if (typeof guess !== 'string') { throw NOT_A_STRING }
        if (new RegExp(`^[a-z]{${this.solution.length}}$`).test(guess) === false) { throw INVALID_STRING }
        if (!Array.isArray(clues)) { throw NOT_AN_ARRAY }
        if (clues.length !== this.solution.length) { throw ARRAY_WRONG_LENGTH }
        if (clues.some((clue) => {
            return clue !== CORRECT_SPOT
                && clue !== INCORRECT_SPOT
                && clue !== NOT_IN_WORD
        })) { throw INVALID_CLUES }
    }

    guess(word, clues) {
        this.validateGuess(word, clues)
        clues.forEach((clue, idx) => {
            const letter = word[idx]
            switch(clue) {
                case CORRECT_SPOT:
                    this.solution[idx] = letter
                    break
                case INCORRECT_SPOT:
                    this.incorrectSpots[letter] ||= new Set()
                    this.incorrectSpots[letter].add(idx)
                    break
                case NOT_IN_WORD:
                    this.missingLetters.add(letter)
                    break
            }
        })
        this.updateWords()
        console.log(this.words)
    }

    // 1) Remove words that do not match solution's known spots
    // 2) Remove words that contain letters that are not in solution
    // 3) Remove words that have letters in the wrong spot
    // 4) Remove words that do not contain letters that we know are somewhere in the word
    updateWords() {
        this.trie.removeWords([
            this.doesNotMatchSolution.bind(this),
            this.isNotInSolution.bind(this),
            this.isInIncorrectSpot.bind(this),
            this.isMissingKnownLetters.bind(this),
        ])
    }
}

module.exports = WordleHelper
