// Main application controller

class PokerApp {
    constructor() {
        this.poker = new PokerLogic();
        this.selectedCards = {
            hole1: null,
            hole2: null,
            flop: null,
            turn: null,
            river: null
        };
        this.currentPosition = null;

        this.initializeUI();
        this.bindEvents();
        this.populateCardSelector();
    }

    initializeUI() {
        // Get DOM elements
        this.cardSlots = document.querySelectorAll('.card-slot');
        this.cardSelector = document.getElementById('card-selector');
        this.closeSelector = document.getElementById('close-selector');
        this.currentHandDisplay = document.getElementById('current-hand');
        this.handExplanationDisplay = document.getElementById('hand-explanation');
        this.outsDisplay = document.getElementById('outs-count');
        this.outsCardsDisplay = document.getElementById('outs-cards');
        this.probabilityDisplay = document.getElementById('win-probability');
        this.roughOddsDisplay = document.getElementById('rough-odds');
        this.oddsExplanationDisplay = document.getElementById('odds-explanation');
        this.decisionAdviceDisplay = document.getElementById('decision-advice');
        this.threatsDisplay = document.getElementById('threats-display');
        this.clearAllBtn = document.getElementById('clear-all');
        this.resetGameBtn = document.getElementById('reset-game');
    }

    bindEvents() {
        // Card slot clicks
        this.cardSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                this.currentPosition = slot.dataset.position;
                this.showCardSelector();
            });
        });

        // Close selector
        this.closeSelector.addEventListener('click', () => {
            this.hideCardSelector();
        });

        // Close on background click
        this.cardSelector.addEventListener('click', (e) => {
            if (e.target === this.cardSelector) {
                this.hideCardSelector();
            }
        });

        // Control buttons
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAllCards();
        });

        this.resetGameBtn.addEventListener('click', () => {
            this.resetGame();
        });
    }

    populateCardSelector() {
        this.poker.suits.forEach(suit => {
            const suitContainer = document.querySelector(`.cards[data-suit="${suit}"]`);
            if (suitContainer) {
                suitContainer.innerHTML = '';

                this.poker.ranks.forEach(rank => {
                    const cardButton = document.createElement('div');
                    cardButton.className = `card-option ${suit}`;
                    cardButton.dataset.rank = rank;
                    cardButton.dataset.suit = suit;
                    cardButton.textContent = rank + this.poker.suitSymbols[suit];

                    cardButton.addEventListener('click', () => {
                        this.selectCard(rank, suit);
                    });

                    suitContainer.appendChild(cardButton);
                });
            }
        });
    }

    showCardSelector() {
        this.updateCardOptions();
        this.cardSelector.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideCardSelector() {
        this.cardSelector.style.display = 'none';
        document.body.style.overflow = '';
        this.currentPosition = null;
    }

    updateCardOptions() {
        const usedCards = new Set();

        // Mark used cards
        Object.values(this.selectedCards).forEach(card => {
            if (card) {
                usedCards.add(`${card.rank}${card.suit}`);
            }
        });

        // Update card options
        const cardOptions = document.querySelectorAll('.card-option');
        cardOptions.forEach(option => {
            const cardId = `${option.dataset.rank}${option.dataset.suit}`;
            if (usedCards.has(cardId)) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
    }

    selectCard(rank, suit) {
        const cardId = `${rank}${suit}`;
        const usedCards = Object.values(this.selectedCards)
            .filter(card => card !== null)
            .map(card => `${card.rank}${card.suit}`);

        if (usedCards.includes(cardId)) {
            return; // Card already used
        }

        const card = this.poker.createCard(rank, suit);
        this.selectedCards[this.currentPosition] = card;

        this.updateCardSlotDisplay(this.currentPosition, card);
        this.hideCardSelector();
        this.updateAnalysis();
    }

    updateCardSlotDisplay(position, card) {
        const slot = document.querySelector(`[data-position="${position}"]`);
        if (slot && card) {
            slot.innerHTML = `<div class="card-display ${card.color}">${card.display}</div>`;
            slot.classList.add('selected');
        } else if (slot) {
            // Clear the slot
            const isHole = position.includes('hole');
            const isFlop = position.includes('flop');
            const isTurn = position === 'turn';
            const isRiver = position === 'river';

            let placeholder = 'Select Card';
            if (isFlop) placeholder = 'Flop';
            else if (isTurn) placeholder = 'Turn';
            else if (isRiver) placeholder = 'River';

            slot.innerHTML = `<span class="placeholder">${placeholder}</span>`;
            slot.classList.remove('selected');
        }
    }

    updateAnalysis() {
        const holeCards = [this.selectedCards.hole1, this.selectedCards.hole2].filter(Boolean);
        const communityCards = [
            this.selectedCards.flop,
            this.selectedCards.turn,
            this.selectedCards.river
        ].filter(Boolean);

        // Update hand display
        if (holeCards.length === 0) {
            this.currentHandDisplay.textContent = 'Select your hole cards to begin';
            this.handExplanationDisplay.textContent = '';
        } else {
            const allCards = [...holeCards, ...communityCards];
            const handResult = this.poker.evaluateHand(allCards);

            let handText = handResult.name || 'Unknown hand';

            if (handResult.isDrawing && handResult.draws.length > 0) {
                const drawTexts = handResult.draws.map(draw => draw.description);
                handText += ` + ${drawTexts.join(', ')}`;
            }

            this.currentHandDisplay.textContent = handText;
            this.handExplanationDisplay.textContent = this.getHandExplanation(handResult);
        }

        // Update outs and probability
        if (holeCards.length === 2 && communityCards.length > 0) {
            const outsInfo = this.poker.calculateOuts(holeCards, communityCards);
            this.outsDisplay.textContent = outsInfo.outs.toString();

            // Display specific out cards
            this.displayOutCards(outsInfo);

            const probInfo = this.poker.calculateWinProbability(holeCards, communityCards);
            this.probabilityDisplay.textContent = probInfo.probability > 0 ?
                `${probInfo.probability.toFixed(1)}%` : '-';

            // Add rough odds for beginners
            const roughOdds = this.calculateRoughOdds(holeCards, communityCards);
            this.roughOddsDisplay.textContent = roughOdds.display;
            this.oddsExplanationDisplay.textContent = roughOdds.explanation;

        } else {
            this.outsDisplay.textContent = '-';
            this.outsCardsDisplay.innerHTML = '';
            this.probabilityDisplay.textContent = '-';
            this.roughOddsDisplay.textContent = '-';
            this.oddsExplanationDisplay.textContent = '';
        }

        // Update decision advice
        this.decisionAdviceDisplay.textContent = this.getDecisionAdvice(holeCards, communityCards);

        // Update threats analysis
        if (communityCards.length >= 3) {
            const threatsInfo = this.poker.analyzePotentialThreats(communityCards);
            this.threatsDisplay.textContent = threatsInfo.description;

            // Color code the threats
            if (threatsInfo.threats.length > 0) {
                this.threatsDisplay.style.background = 'rgba(255, 0, 0, 0.15)';
                this.threatsDisplay.style.borderColor = 'rgba(255, 0, 0, 0.4)';
            } else {
                this.threatsDisplay.style.background = 'rgba(0, 255, 0, 0.1)';
                this.threatsDisplay.style.borderColor = 'rgba(0, 255, 0, 0.3)';
            }
        } else {
            this.threatsDisplay.textContent = 'Select community cards to see potential opponent hands';
            this.threatsDisplay.style.background = 'rgba(255, 0, 0, 0.1)';
            this.threatsDisplay.style.borderColor = 'rgba(255, 0, 0, 0.3)';
        }
    }

    clearAllCards() {
        Object.keys(this.selectedCards).forEach(position => {
            this.selectedCards[position] = null;
            this.updateCardSlotDisplay(position, null);
        });
        this.updateAnalysis();
    }

    resetGame() {
        this.clearAllCards();
        // Additional reset logic can be added here
    }

    // Utility method to get selected cards as array
    getSelectedCards() {
        return Object.values(this.selectedCards).filter(Boolean);
    }

    // Utility method to get hole cards
    getHoleCards() {
        return [this.selectedCards.hole1, this.selectedCards.hole2].filter(Boolean);
    }

    // Utility method to get community cards
    getCommunityCards() {
        return [
            this.selectedCards.flop,
            this.selectedCards.turn,
            this.selectedCards.river
        ].filter(Boolean);
    }

    // Get beginner-friendly explanation of current hand
    getHandExplanation(handResult) {
        if (!handResult || !handResult.name) return '';

        const explanations = {
            'High Card': 'You only have your highest card. This is the weakest hand - consider folding unless you can bluff.',
            'Pair': 'You have two cards of the same rank. A decent hand, especially with high pairs (Jacks or better).',
            'Two Pair': 'You have two different pairs. This is a good hand that beats most opponents.',
            'Three of a Kind': 'You have three cards of the same rank. Very strong hand - usually worth betting!',
            'Straight': 'You have 5 cards in sequence. Strong hand that beats most others.',
            'Flush': 'You have 5 cards of the same suit. Very strong hand - bet confidently!',
            'Full House': 'Three of a kind + a pair. Extremely strong - almost unbeatable!',
            'Four of a Kind': 'Four cards of the same rank. Monster hand - bet aggressively!',
            'Straight Flush': '5 cards in sequence, same suit. Nearly unbeatable hand!',
            'Royal Flush': 'The holy grail! 10-J-Q-K-A same suit. Absolute best hand possible!'
        };

        const baseName = handResult.name.split(' (')[0]; // Remove specific details like "Pair (Aces)"
        return explanations[baseName] || 'Keep playing to improve your hand.';
    }

    // Calculate rough odds for beginners
    calculateRoughOdds(holeCards, communityCards) {
        const allCards = [...holeCards, ...communityCards];
        const handResult = this.poker.evaluateHand(allCards);

        // Simple probability categories for beginners
        if (handResult.rank >= 7) { // Full House or better
            return {
                display: 'EXCELLENT',
                explanation: 'You have a monster hand! Bet aggressively - you will win most of the time.'
            };
        } else if (handResult.rank >= 5) { // Straight or Flush
            return {
                display: 'VERY GOOD',
                explanation: 'Strong hand! You should bet confidently. Few hands can beat you.'
            };
        } else if (handResult.rank >= 3) { // Two Pair or Three of a Kind
            return {
                display: 'GOOD',
                explanation: 'Solid hand worth playing. Consider betting, but be careful of very aggressive opponents.'
            };
        } else if (handResult.rank === 2) { // Pair
            const pairCards = allCards.filter(card =>
                allCards.filter(c => c.rank === card.rank).length === 2
            );
            if (pairCards.length > 0 && pairCards[0].value >= 11) { // Jacks or better
                return {
                    display: 'DECENT',
                    explanation: 'High pair! Worth playing carefully. Good chance to win against most opponents.'
                };
            } else {
                return {
                    display: 'WEAK',
                    explanation: 'Low pair. Play cautiously - many hands can beat you. Consider folding to big bets.'
                };
            }
        } else { // High card
            const highCard = allCards.reduce((highest, card) =>
                card.value > highest.value ? card : highest
            );
            if (highCard.value >= 12) { // King or Ace high
                return {
                    display: 'VERY WEAK',
                    explanation: 'Only high card, but it\'s good. Might win if opponents also have weak hands.'
                };
            } else {
                return {
                    display: 'FOLD',
                    explanation: 'Very weak hand. Consider folding unless you can bluff or improve on later cards.'
                };
            }
        }
    }

    // Get decision advice for beginners
    getDecisionAdvice(holeCards, communityCards) {
        if (holeCards.length === 0) {
            return 'Select cards to get personalized advice';
        }

        if (holeCards.length === 2 && communityCards.length === 0) {
            // Pre-flop advice
            const [card1, card2] = holeCards;

            // Check for pocket pair
            if (card1.rank === card2.rank) {
                if (card1.value >= 10) {
                    return '🔥 POCKET PAIR (10s or better)! This is premium - bet strongly!';
                } else {
                    return '👍 Pocket pair! Play it, but be careful with small pairs against multiple opponents.';
                }
            }

            // Check for high cards
            if (card1.value >= 12 || card2.value >= 12) {
                if (card1.suit === card2.suit) {
                    return '✨ High cards + same suit! Good starting hand - play it!';
                } else {
                    return '👌 High cards! Decent starting hand, especially if connected (like K-Q).';
                }
            }

            // Check for suited cards
            if (card1.suit === card2.suit) {
                return '🌈 SUITED cards! Potential for flush - worth playing carefully.';
            }

            // Check for connected cards
            const gap = Math.abs(card1.value - card2.value);
            if (gap <= 4 && (card1.value >= 6 || card2.value >= 6)) {
                return '🔗 Connected cards! Potential for straight - playable hand.';
            }

            return '⚠️ Weak starting hand. Consider folding unless you can see the flop cheaply.';
        }

        // Post-flop advice
        const allCards = [...holeCards, ...communityCards];
        const handResult = this.poker.evaluateHand(allCards);
        const outsInfo = this.poker.calculateOuts(holeCards, communityCards);

        if (handResult.rank >= 5) {
            return '🚀 STRONG HAND! Bet for value - most opponents will pay you off!';
        } else if (handResult.rank >= 2) {
            return '💪 Decent hand! Consider betting, but watch for aggressive opponents.';
        } else if (outsInfo.outs >= 8) {
            return '🎯 Good draw! You have many ways to improve - consider calling reasonable bets.';
        } else if (outsInfo.outs >= 4) {
            return '🤔 Weak draw. Only call small bets - fold to big bets unless pot odds are good.';
        } else {
            return '❌ Weak hand, no draw. Consider folding to any significant bet.';
        }
    }

    // Display specific out cards visually
    displayOutCards(outsInfo) {
        console.log('displayOutCards called with:', outsInfo); // Debug

        if (!outsInfo.outCards || outsInfo.outCards.length === 0) {
            this.outsCardsDisplay.innerHTML = '<div style="color: #888;">No improving cards available</div>';
            return;
        }

        let html = '<div style="margin-bottom: 5px; color: #90ee90;">Cards that improve your hand:</div>';

        // Simple display first - just show all out cards
        html += '<div style="margin: 8px 0;">';
        outsInfo.outCards.forEach(card => {
            const colorClass = card.color === 'red' ? ' red' : '';
            html += `<span class="out-card${colorClass}">${card.display}</span>`;
        });
        html += '</div>';

        // Also group by type for detailed view
        const grouped = this.groupOutsByType(outsInfo.outCards);
        console.log('Grouped outs:', grouped); // Debug

        for (const [type, cards] of Object.entries(grouped)) {
            html += `<div style="margin: 8px 0; font-size: 11px;"><em>${type} (${cards.length}):</em><br>`;
            cards.slice(0, 10).forEach(card => { // Limit to first 10 to avoid clutter
                const colorClass = card.color === 'red' ? ' red' : '';
                html += `<span class="out-card${colorClass}" style="font-size: 10px;">${card.display}</span>`;
            });
            if (cards.length > 10) {
                html += `<span style="color: #888;">... +${cards.length - 10} more</span>`;
            }
            html += '</div>';
        }

        this.outsCardsDisplay.innerHTML = html;
    }

    // Group out cards by the type of hand they would make
    groupOutsByType(outCards) {
        const holeCards = this.getHoleCards();
        const communityCards = this.getCommunityCards();
        const currentCards = [...holeCards, ...communityCards];

        const groups = {};

        outCards.forEach(outCard => {
            const testCards = [...currentCards, outCard];
            const handResult = this.poker.evaluateHand(testCards);
            const handType = handResult.name.split(' (')[0]; // Remove specifics

            if (!groups[handType]) {
                groups[handType] = [];
            }
            groups[handType].push(outCard);
        });

        return groups;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pokerApp = new PokerApp();
});

// Prevent zooming on double-tap for mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Disable pull-to-refresh on mobile
document.body.addEventListener('touchstart', e => {
    if (e.touches.length === 1 && e.touches[0].clientY <= 50) {
        e.preventDefault();
    }
});

document.body.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && e.touches[0].clientY <= 50) {
        e.preventDefault();
    }
});