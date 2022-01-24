# Wordle
Command line tool to help solver the Wordle game: https://www.powerlanguage.co.uk/wordle/

Steps to use. Using node:

#1 Import the WordleHelper

`const WordleHelper = require('wordle/wordle.js')`

#2 Initialize the WordleHelper by passing its length

`const word = new WordleHelper(6)`

#3 Use the `guess` method to input your clues. Pass the guess as the first argument, and an array of clues as the second.
Clues are G for letters in the correct spot, Y forletters in the incorrect spot, and B for letters that aren't in the solution.
Assume the word is LAUGH

`word.guess('llama', ['G','Y','Y','B','Y'])

This will update the internal dictionary to only include words that meet the criteria, and will log the list of words to the console.

Run `word.initialize(n)` to reset the puzzle with length `n`.
