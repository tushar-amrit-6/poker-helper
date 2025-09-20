// Poker game logic and calculations

class PokerLogic {
    constructor() {
        this.suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.suitSymbols = {
            spades: '♠',
            hearts: '♥',
            diamonds: '♦',
            clubs: '♣'
        };

        this.handRankings = {
            'Royal Flush': 10,
            'Straight Flush': 9,
            'Four of a Kind': 8,
            'Full House': 7,
            'Flush': 6,
            'Straight': 5,
            'Three of a Kind': 4,
            'Two Pair': 3,
            'Pair': 2,
            'High Card': 1
        };
    }

    // Convert rank to numerical value for comparisons
    getRankValue(rank) {
        if (rank === 'A') return 14;
        if (rank === 'K') return 13;
        if (rank === 'Q') return 12;
        if (rank === 'J') return 11;
        return parseInt(rank);
    }

    // Create a card object
    createCard(rank, suit) {
        return {
            rank: rank,
            suit: suit,
            value: this.getRankValue(rank),
            display: rank + this.suitSymbols[suit],
            color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
        };
    }

    // Evaluate the best 5-card hand from available cards
    evaluateHand(cards) {
        if (cards.length < 5) {
            return this.evaluateDrawingHand(cards);
        }

        const allCombinations = this.getAllCombinations(cards, 5);
        let bestHand = null;
        let bestRank = 0;

        for (const combination of allCombinations) {
            const handRank = this.getHandRank(combination);
            if (handRank.rank > bestRank) {
                bestRank = handRank.rank;
                bestHand = {
                    cards: combination,
                    name: handRank.name,
                    rank: handRank.rank,
                    kickers: handRank.kickers
                };
            }
        }

        return bestHand;
    }

    // Handle drawing hands (less than 5 cards)
    evaluateDrawingHand(cards) {
        if (cards.length === 0) {
            return { name: 'No cards selected', rank: 0, draws: [] };
        }

        const draws = this.identifyDraws(cards);
        const currentHand = this.getBestCurrentHand(cards);

        return {
            ...currentHand,
            draws: draws,
            isDrawing: draws.length > 0
        };
    }

    // Identify potential draws
    identifyDraws(cards) {
        const draws = [];

        // Check for flush draws
        const flushDraw = this.checkFlushDraw(cards);
        if (flushDraw) draws.push(flushDraw);

        // Check for straight draws
        const straightDraw = this.checkStraightDraw(cards);
        if (straightDraw) draws.push(straightDraw);

        return draws;
    }

    // Check for flush draw
    checkFlushDraw(cards) {
        const suitCounts = {};
        cards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count === 4) {
                return {
                    type: 'Flush Draw',
                    suit: suit,
                    cardsNeeded: 1,
                    description: `4 ${this.suitSymbols[suit]} - Need 1 more for flush`
                };
            }
        }
        return null;
    }

    // Check for straight draw
    checkStraightDraw(cards) {
        const values = cards.map(card => card.value).sort((a, b) => a - b);
        const uniqueValues = [...new Set(values)];

        // Check for open-ended straight draw
        for (let i = 0; i < uniqueValues.length - 3; i++) {
            const sequence = uniqueValues.slice(i, i + 4);
            if (this.isConsecutive(sequence)) {
                const low = sequence[0] - 1;
                const high = sequence[3] + 1;
                let outsDescription = '';

                if (low >= 2 && high <= 14) {
                    outsDescription = `Open-ended straight draw (need ${this.getCardName(low)} or ${this.getCardName(high)})`;
                } else if (low >= 2) {
                    outsDescription = `Gutshot straight draw (need ${this.getCardName(low)})`;
                } else if (high <= 14) {
                    outsDescription = `Gutshot straight draw (need ${this.getCardName(high)})`;
                }

                if (outsDescription) {
                    return {
                        type: 'Straight Draw',
                        sequence: sequence,
                        cardsNeeded: 1,
                        description: outsDescription
                    };
                }
            }
        }

        // Check for gutshot
        const gutshot = this.checkGutshotDraw(uniqueValues);
        if (gutshot) return gutshot;

        return null;
    }

    // Check for gutshot straight draw
    checkGutshotDraw(values) {
        for (let i = 0; i < values.length - 2; i++) {
            for (let j = i + 1; j < values.length - 1; j++) {
                for (let k = j + 1; k < values.length; k++) {
                    const three = [values[i], values[j], values[k]];

                    // Check if we can make a straight by filling one gap
                    for (let missing = three[0] + 1; missing < three[2]; missing++) {
                        if (!three.includes(missing)) {
                            const potential = [...three, missing].sort((a, b) => a - b);
                            if (this.wouldMakeStraight(potential)) {
                                return {
                                    type: 'Gutshot Draw',
                                    missing: missing,
                                    cardsNeeded: 1,
                                    description: `Gutshot straight draw (need ${this.getCardName(missing)})`
                                };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    // Get card name from value
    getCardName(value) {
        if (value === 14) return 'A';
        if (value === 13) return 'K';
        if (value === 12) return 'Q';
        if (value === 11) return 'J';
        return value.toString();
    }

    // Check if values would make a straight
    wouldMakeStraight(values) {
        const sorted = values.sort((a, b) => a - b);
        return this.isConsecutive(sorted) && sorted.length >= 4;
    }

    // Check if values are consecutive
    isConsecutive(values) {
        for (let i = 1; i < values.length; i++) {
            if (values[i] - values[i-1] !== 1) return false;
        }
        return true;
    }

    // Get best current hand from available cards
    getBestCurrentHand(cards) {
        if (cards.length < 2) {
            return {
                name: cards.length === 1 ? `${cards[0].display} high` : 'No cards',
                rank: 0
            };
        }

        const rankCounts = {};
        cards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const ranks = Object.keys(rankCounts);

        if (counts[0] === 4) {
            return { name: `Four of a Kind (${ranks[0]}s)`, rank: 8 };
        } else if (counts[0] === 3 && counts[1] === 2) {
            return { name: `Full House`, rank: 7 };
        } else if (counts[0] === 3) {
            return { name: `Three of a Kind (${ranks[0]}s)`, rank: 4 };
        } else if (counts[0] === 2 && counts[1] === 2) {
            return { name: `Two Pair`, rank: 3 };
        } else if (counts[0] === 2) {
            const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2);
            return { name: `Pair of ${pairRank}s`, rank: 2 };
        }

        const highCard = cards.reduce((highest, card) =>
            card.value > highest.value ? card : highest
        );
        return { name: `${highCard.display} high`, rank: 1 };
    }

    // Get all combinations of k elements from array
    getAllCombinations(arr, k) {
        if (k === 1) return arr.map(el => [el]);
        if (k === arr.length) return [arr];

        const combinations = [];
        for (let i = 0; i <= arr.length - k; i++) {
            const head = arr[i];
            const tailCombinations = this.getAllCombinations(arr.slice(i + 1), k - 1);
            tailCombinations.forEach(combination => {
                combinations.push([head, ...combination]);
            });
        }
        return combinations;
    }

    // Determine hand rank for 5 cards
    getHandRank(cards) {
        const suits = cards.map(card => card.suit);
        const values = cards.map(card => card.value).sort((a, b) => a - b);

        const isFlush = suits.every(suit => suit === suits[0]);
        const isStraight = this.isStraight(values);

        const rankCounts = {};
        cards.forEach(card => {
            rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
        });

        const counts = Object.values(rankCounts).sort((a, b) => b - a);
        const sortedRanks = Object.keys(rankCounts).map(Number).sort((a, b) => {
            if (rankCounts[b] !== rankCounts[a]) {
                return rankCounts[b] - rankCounts[a];
            }
            return b - a;
        });

        // Check for royal flush
        if (isFlush && isStraight && values[0] === 10) {
            return { name: 'Royal Flush', rank: 10, kickers: [] };
        }

        // Check for straight flush
        if (isFlush && isStraight) {
            return { name: 'Straight Flush', rank: 9, kickers: [values[4]] };
        }

        // Check for four of a kind
        if (counts[0] === 4) {
            return {
                name: 'Four of a Kind',
                rank: 8,
                kickers: [sortedRanks[0], sortedRanks[1]]
            };
        }

        // Check for full house
        if (counts[0] === 3 && counts[1] === 2) {
            return {
                name: 'Full House',
                rank: 7,
                kickers: [sortedRanks[0], sortedRanks[1]]
            };
        }

        // Check for flush
        if (isFlush) {
            return { name: 'Flush', rank: 6, kickers: values.reverse() };
        }

        // Check for straight
        if (isStraight) {
            return { name: 'Straight', rank: 5, kickers: [values[4]] };
        }

        // Check for three of a kind
        if (counts[0] === 3) {
            return {
                name: 'Three of a Kind',
                rank: 4,
                kickers: [sortedRanks[0], sortedRanks[1], sortedRanks[2]]
            };
        }

        // Check for two pair
        if (counts[0] === 2 && counts[1] === 2) {
            return {
                name: 'Two Pair',
                rank: 3,
                kickers: [sortedRanks[0], sortedRanks[1], sortedRanks[2]]
            };
        }

        // Check for pair
        if (counts[0] === 2) {
            return {
                name: 'Pair',
                rank: 2,
                kickers: sortedRanks
            };
        }

        // High card
        return { name: 'High Card', rank: 1, kickers: values.reverse() };
    }

    // Check if 5 cards make a straight
    isStraight(values) {
        // Handle A-2-3-4-5 (wheel)
        if (values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14) {
            return true;
        }

        // Check regular straight
        for (let i = 1; i < values.length; i++) {
            if (values[i] - values[i-1] !== 1) {
                return false;
            }
        }
        return true;
    }

    // Calculate outs (cards that improve the hand)
    calculateOuts(holeCards, communityCards) {
        if (holeCards.length !== 2 || communityCards.length === 0) {
            return { outs: 0, outCards: [], description: 'Need hole cards and community cards' };
        }

        const allCards = [...holeCards, ...communityCards];
        const usedCards = new Set(allCards.map(card => `${card.rank}${card.suit}`));

        let outs = 0;
        const outCards = [];

        // Get current hand strength
        const currentHand = this.evaluateHand(allCards);

        // Generate all possible remaining cards
        for (const suit of this.suits) {
            for (const rank of this.ranks) {
                const cardId = `${rank}${suit}`;
                if (!usedCards.has(cardId)) {
                    const testCard = this.createCard(rank, suit);
                    const testCards = [...allCards, testCard];
                    const improvedHand = this.evaluateHand(testCards);

                    // Check if this card improves the hand
                    const isImprovement = this.isHandImprovement(currentHand, improvedHand);

                    if (isImprovement) {
                        outs++;
                        outCards.push(testCard);
                    }
                }
            }
        }

        return {
            outs: outs,
            outCards: outCards,
            description: outs > 0 ? `${outs} cards improve your hand` : 'No improving cards'
        };
    }

    // Check if new hand is better than current hand
    isHandImprovement(currentHand, newHand) {
        // If rank is higher, it's definitely better
        if (newHand.rank > currentHand.rank) {
            return true;
        }

        // If same rank, check kickers (for more detailed comparison)
        if (newHand.rank === currentHand.rank && newHand.rank > 1) {
            // For pairs, two pair, etc., we might have improved within the same category
            if (newHand.kickers && currentHand.kickers) {
                for (let i = 0; i < Math.min(newHand.kickers.length, currentHand.kickers.length); i++) {
                    if (newHand.kickers[i] > currentHand.kickers[i]) {
                        return true;
                    }
                    if (newHand.kickers[i] < currentHand.kickers[i]) {
                        break;
                    }
                }
            }
        }

        return false;
    }

    // Calculate win probability
    calculateWinProbability(holeCards, communityCards) {
        if (holeCards.length !== 2) {
            return { probability: 0, description: 'Need exactly 2 hole cards' };
        }

        const remainingCards = 52 - holeCards.length - communityCards.length;
        const outsInfo = this.calculateOuts(holeCards, communityCards);

        if (communityCards.length === 3) { // After flop
            const probability = ((outsInfo.outs * 4) - (outsInfo.outs - 8)) / 100;
            return {
                probability: Math.min(probability * 100, 100),
                description: `~${Math.round(probability * 100)}% chance to improve`
            };
        } else if (communityCards.length === 4) { // After turn
            const probability = (outsInfo.outs * 2) / remainingCards;
            return {
                probability: Math.round(probability * 100),
                description: `${Math.round(probability * 100)}% chance on river`
            };
        }

        return { probability: 0, description: 'Not enough community cards' };
    }

    // Analyze potential opponent hands
    analyzePotentialThreats(communityCards) {
        if (communityCards.length < 3) {
            return { threats: [], description: 'Need at least the flop to analyze threats' };
        }

        const threats = [];

        // Check for flush possibilities
        const suitCounts = {};
        communityCards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });

        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count >= 3) {
                threats.push(`Possible Flush (${this.suitSymbols[suit]})`);
            }
        }

        // Check for straight possibilities
        const values = communityCards.map(card => card.value).sort((a, b) => a - b);
        if (this.hasStraightPossibility(values)) {
            threats.push('Possible Straight');
        }

        // Check for pair/trips possibilities
        const rankCounts = {};
        communityCards.forEach(card => {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        });

        const maxPairs = Math.max(...Object.values(rankCounts));
        if (maxPairs >= 2) {
            threats.push('Possible Full House or Quads');
        } else if (communityCards.length >= 3) {
            threats.push('Possible Two Pair or Trips');
        }

        return {
            threats: threats,
            description: threats.length > 0 ?
                `CAUTION: ${threats.join(', ')}` :
                'No major threats visible'
        };
    }

    // Check if board has straight possibilities
    hasStraightPossibility(values) {
        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

        // Check for any 3+ card sequences
        for (let i = 0; i < uniqueValues.length - 2; i++) {
            if (uniqueValues[i+1] - uniqueValues[i] === 1 &&
                uniqueValues[i+2] - uniqueValues[i+1] === 1) {
                return true;
            }
        }

        // Check for wheel possibility (A-2-3-4-5)
        if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3)) {
            return true;
        }

        return false;
    }
}