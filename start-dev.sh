#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/adamsigel/memory-game
exec node node_modules/.bin/next dev --webpack
