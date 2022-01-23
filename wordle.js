let fs = require('fs');

// TRIE: A more storage performant structure for storing the dictionary in memory.
// Not currently using it.
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
        while (node.parent.value && !node.parent.isEnd && node.parent.childCount() === 1) {
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
    this.getWords = (node, result=[]) => {
        if (node.isEnd) result.push(node.getWord())
        for (let letter in node.children) {
            this.getWords(node.children[letter], result)
        }
        return result
    }
}
// END TRIE

const DICTIONARY_PATH = '/Users/eitan/code/Wordle/enable.txt'
const CORRECT_SPOT = 'G'
const INCORRECT_SPOT = 'Y'
const NOT_IN_WORD = 'B'
const NOT_A_STRING = 'Word must be a string. Please try again.'
const INVALID_STRING = `Word must be the same length as the puzzle and only contain letters. Please try again.`
const NOT_AN_ARRAY = 'Clues must be an array. Please try again.'
const ARRAY_WRONG_LENGTH = 'Clues array is not the same length as the puzzle. Please try again.'
const INVALID_CLUES = 'Clues must be an array of valid clues (1, 0, or -1). Please try again.'

// Shoves each line that has length n into an array and returns it.
// Loads the entire file into memory. Yes, I know this is bad.
// Will update to stream the file, and use a trie for storage.
const wordsWithLength = (length) => fs.readFileSync(DICTIONARY_PATH, 'utf-8').split(/\r?\n/).filter(line => line.length === length)

class Wordle {
    constructor(length) {
        this.initialize(length)
    }

    initialize(length) {
        // Stores unknown letters as empty strings
        this.solution = new Array(length).fill('.')
        this.validWords = wordsWithLength(length)
        // Map of letters we know are in the word. Letter -> Set(incorrect indexes)
        this.incorrectSpots = {}
        this.missingLetters = new Set()
    }

    // Getter function for words will be useful once Trie is implemented since data has to be retrieved.
    get words() { return this.validWords }

    matchesSolution(word) {
        return new RegExp(this.solution.join('')).test(word)
    }

    hasMissingLetters(word) {
        return [...word].some(letter => this.missingLetters.has(letter))
    }

    hasLettersInIncorrectSpots(word) {
        return [...word].some((letter, idx) => this.incorrectSpots[letter]?.has(idx))
    }

    isMissingKnownLetters(word) {
        const wordSet = new Set(word)
        for (let letter of Object.keys(this.incorrectSpots)) {
            if (!wordSet.has(letter)) { return false }
        }
    }

    // O(word length)
    validateGuess(guess, clues) {
        if (typeof guess !== 'string') { throw NOT_A_STRING }
        // Is the input a lower case letter, repeated n times
        if (new RegExp(`^[a-z]{${this.solution.length}}$`).test(guess) === false) { throw INVALID_STRING }
        if (!Array.isArray(clues)) { throw NOT_AN_ARRAY }
        if (clues.length !== this.solution.length) { throw ARRAY_WRONG_LENGTH }
        if (clues.some((clue) => {
            return clue !== CORRECT_SPOT
                && clue !== INCORRECT_SPOT
                && clue !== NOT_IN_WORD
        })) { throw INVALID_CLUES }
    }

    /*  Takes a word and an array that represents the clues for the word, and stores
        the relevant information in memory.
        Clues are 1 for 'correct spot', 0 for 'incorrect spot', and -1 for 'not in word.
        Example: The correct word is RATING. 'retina' is [1, -1, 1, 1, 1, 0]),
        Result: this.solution: ['r', '.', 't', 'i', 'n', '.']
                this.incorrectSpots: { a: Set(1)}
                this.missingLetters: Set('e')
    O(word length) */
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
    }

    // 1) Remove words that contain missing letters
    // 2) Remove words that do not match this.solution
    // 3) Remove words that do not contain letters that we know are in the word, but not where
    updateWords() {
        const newWords = this.words.filter((word) => {
            if (!this.matchesSolution(word)) { return false } // O(word length)
            if (this.hasMissingLetters(word)) { return false } // O(word length)
            if (this.hasLettersInIncorrectSpots(word)) { return false } // O(word length)
            if (this.isMissingKnownLetters(word)) { return false } // O(missing letter)
            return true
        })
        this.validWords = newWords
    }
}

let foo = new Wordle(12)
foo.guess('anagrammatic', ['Y','B','Y','Y','Y','Y','B','B','Y','Y','B','B'])
foo.guess('outrageously', ['Y','B','Y','Y','Y','G','Y','Y','B','B','B','B'])
foo.guess('pzzzzzzzzzzz', ['G','B','B','B','B','B','B','B','B','B','B','B'])