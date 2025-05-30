// const transitions = {
//     'start': ['left', 'leftdown', 'down', 'up', 'right', 'leftup', 'rightdown', 'rightup'],
//     'left': ['leftdown', 'leftup'],
//     'leftdown': ['down', 'leftup', 'left'],
//     'down': ['rightdown', 'leftdown'],
//     'up': ['rightup', 'leftup'],
//     'right': ['rightdown', 'rightup'],
//     'leftup': ['left', 'up', 'rightup'],
//     'rightdown': ['right', 'down', 'rightup'],
//     'rightup': ['right', 'up', 'rightdown']

// }

// const transitionValues = {
//     'left->leftdown': 4,
//     'left->leftup': 4,
//     'leftdown->down': 3,
//     'leftdown->leftup': 4,
//     'leftdown->left': 4,
//     'down->rightdown': 3,
//     'down->leftdown': 3,
//     'up->rightup': 1,
//     'up->leftup': 1,
//     'right->rightdown': 2,
//     'right->rightup': 2,
//     'leftup->left': 1,
//     'leftup->up': 1,
//     'leftup->rightup': 1,
//     'rightdown->right': 3,
//     'rightdown->down': 3,
//     'rightdown->rightup': 2,
//     'rightup->right': 2,
//     'rightup->up': 1,
//     'rightup->rightdown': 2
// };

// class SequenceValidator {
//     constructor() {
//         this.currentState = 'START';
//         this.sequence = [];
//         this.directionValues = [];
//     }

//     getTransitionValue(fromState, toMove) {
//         const key = `${fromState}->${toMove}`;
//         return transitionValues[key] || 0;
//     }

//     isValidNext(move) {
//         const validMoves = transitions[this.currentState] || [];
//         return validMoves.includes(move);
//     }

//     // Add a move to the sequence
//     addMove(move) {
//         if (this.isValidNext(move)) {
//             this.sequence.push(move);
//             this.currentState = move;
//             return true;
//         }
//         return false;
//     }

//     generateSequnce() {
//         var chooseStart = transitions['start'];
//         var nextState = chooseStart[Math.floor(Math.random() * chooseStart.length)]
//         this.sequence.push(nextState);
//         for (var i = 0; i < 5; i++) {
//             var lastMove = this.sequence[i];
//             var newPos = transitions[lastMove]
//             var nextState = newPos[Math.floor(Math.random() * newPos.length)]
//             this.sequence.push(nextState);
//             this.directionValues.push(this.getTransitionValue(lastMove, nextState))

//         }
//         console.log(this.directionValues)
//     }


//     // Reset the sequence
//     reset() {
//         this.currentState = 'START';
//         this.sequence = [];
//     }

//     genenerateAllRectangles(startPositionX, startPositionY) {
//         // var currentPos;
//         var allRectangle = [];
//         var testCanvas = {
//             width: 300,
//             height: 300
//         }
//         var firstRectangle = this.generateRectangle(startPositionX, startPositionY, testCanvas);
//         console.log(firstRectangle);
//         for (var i = 0; i < 1; i++) {
//             console.log(this.sequence[i])
//         }

//     }

//     gettingNewStaringPoint(rectangle, direction) {
//         // if direction =
//     }

//     generateRectangle(x1,
//         y1,
//         canvas,
//         minSize = 2,
//         maxSize = 60) {
//         //const rectangles = [];

//         //first rectange
//         const width = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
//         const height = Math.floor(Math.random() * (maxSize - minSize)) + minSize;


//         const x2 = Math.min(x1 + width, canvas.width);
//         const y2 = Math.min(y1 + height, canvas.height);

//         var Rectangle = [x1, y1, x2, y2,];
//         return Rectangle;


//     }

//     // Get current sequence
//     getSequence() {
//         return [...this.sequence];
//     }


// }


// var newstuff = new SequenceValidator();
// newstuff.generateSequnce()
// console.log(newstuff.getSequence())
// newstuff.genenerateAllRectangles(0, 0)


const transitions = {
    'start': ['left', 'leftdown', 'down', 'up', 'right', 'leftup', 'rightdown', 'rightup'],
    'left': ['leftdown', 'leftup'],
    'leftdown': ['down', 'leftup', 'left'],
    'down': ['rightdown', 'leftdown'],
    'up': ['rightup', 'leftup'],
    'right': ['rightdown', 'rightup'],
    'leftup': ['left', 'up', 'rightup'],
    'rightdown': ['right', 'down', 'rightup'],
    'rightup': ['right', 'up', 'rightdown']
};

const transitionValues = {
    'left->leftdown': 4,
    'left->leftup': 4,
    'leftdown->down': 3,
    'leftdown->leftup': 4,
    'leftdown->left': 4,
    'down->rightdown': 3,
    'down->leftdown': 3,
    'up->rightup': 1,
    'up->leftup': 1,
    'right->rightdown': 2,
    'right->rightup': 2,
    'leftup->left': 1,
    'leftup->up': 1,
    'leftup->rightup': 1,
    'rightdown->right': 3,
    'rightdown->down': 3,
    'rightdown->rightup': 2,
    'rightup->right': 2,
    'rightup->up': 1,
    'rightup->rightdown': 2
};

class SequenceValidator {
    constructor() {
        this.currentState = 'start';
        this.sequence = [];
        this.directionValues = [];
    }

    getTransitionValue(fromState, toMove) {
        const key = `${fromState}->${toMove}`;
        return transitionValues[key] || 0;
    }

    isValidNext(move) {
        const validMoves = transitions[this.currentState] || [];
        return validMoves.includes(move);
    }

    addMove(move) {
        if (this.isValidNext(move)) {
            this.sequence.push(move);
            this.currentState = move;
            return true;
        }
        return false;
    }

    generateSequence() {
        // Reset first
        this.sequence = [];
        this.directionValues = [];
        this.currentState = 'start';

        var chooseStart = transitions['start'];
        var nextState = chooseStart[Math.floor(Math.random() * chooseStart.length)];
        this.sequence.push(nextState);
        this.currentState = nextState;

        for (var i = 0; i < 5; i++) {
            var lastMove = this.sequence[i];
            var newPos = transitions[lastMove];

            if (!newPos || newPos.length === 0) {
                console.log('No valid moves available, stopping');
                break;
            }

            var nextState = newPos[Math.floor(Math.random() * newPos.length)];
            this.sequence.push(nextState);
            this.directionValues.push(this.getTransitionValue(lastMove, nextState));
            this.currentState = nextState;
        }
        console.log('Direction values:', this.directionValues);
    }

    reset() {
        this.currentState = 'start';
        this.sequence = [];
        this.directionValues = [];
    }

    generateAllRectangles(startPositionX, startPositionY) {
        var allRectangles = [];
        var testCanvas = {
            width: 800,
            height: 600
        };

        // Generate first rectangle
        var currentRectangle = this.generateRectangle(startPositionX, startPositionY, testCanvas);
        allRectangles.push({
            rectangle: currentRectangle,
            move: this.sequence[0] || 'start',
            direction: null
        });

        console.log('First rectangle:', currentRectangle);
        console.log('Sequence:', this.sequence);
        console.log('Direction values:', this.directionValues);

        // Generate subsequent rectangles based on direction values
        for (var i = 0; i < this.directionValues.length && i < this.sequence.length - 1; i++) {
            var direction = this.directionValues[i];
            var newStartPoint = this.getNewStartingPoint(currentRectangle, direction);

            console.log(`Step ${i + 1}: Move ${this.sequence[i]} -> ${this.sequence[i + 1]}, Direction: ${direction}`);
            console.log('New starting point:', newStartPoint);

            currentRectangle = this.generateRectangle(
                newStartPoint.x,
                newStartPoint.y,
                testCanvas
            );

            allRectangles.push({
                rectangle: currentRectangle,
                move: this.sequence[i + 1],
                direction: direction
            });

            console.log('New rectangle:', currentRectangle);
        }

        return allRectangles;
    }

    getNewStartingPoint(rectangle, direction) {
        // Rectangle format: [x1, y1, x2, y2]
        var x1 = rectangle[0];
        var y1 = rectangle[1];
        var x2 = rectangle[2];
        var y2 = rectangle[3];

        var width = x2 - x1;
        var height = y2 - y1;

        // Add some spacing between rectangles
        var spacing = 5;

        switch (direction) {
            case 1: // up
                return {
                    x: x1, // same x position
                    y: y1 - height - spacing // move up by rectangle height + spacing
                };
            case 2: // right
                return {
                    x: x2 + spacing, // move right by rectangle width + spacing
                    y: y1 // same y position
                };
            case 3: // down
                return {
                    x: x1, // same x position
                    y: y2 + spacing // move down by rectangle height + spacing
                };
            case 4: // left
                return {
                    x: x1 - width - spacing, // move left by rectangle width + spacing
                    y: y1 // same y position
                };
            default:
                console.warn('Unknown direction:', direction);
                return { x: x1, y: y1 }; // fallback to same position
        }
    }

    generateRectangle(x1, y1, canvas, minSize = 20, maxSize = 80) {
        const width = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        const height = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

        // Ensure rectangle stays within canvas bounds
        const x2 = Math.min(x1 + width, canvas.width);
        const y2 = Math.min(y1 + height, canvas.height);

        // Ensure we don't go negative
        const finalX1 = Math.max(0, x1);
        const finalY1 = Math.max(0, y1);

        return [finalX1, finalY1, x2, y2];
    }

    getSequence() {
        return [...this.sequence];
    }

    getDirectionValues() {
        return [...this.directionValues];
    }
}

// Usage example
var rectangleGenerator = new SequenceValidator();
rectangleGenerator.generateSequence();
console.log('Generated sequence:', rectangleGenerator.getSequence());

var allRectangles = rectangleGenerator.generateAllRectangles(100, 100);

console.log('\n=== ALL RECTANGLES ===');
allRectangles.forEach((item, index) => {
    console.log(`Rectangle ${index}:`, item.rectangle);
    console.log(`  Move: ${item.move}`);
    console.log(`  Direction: ${item.direction || 'start'}`);
    console.log('');
});

// Helper function to visualize the path
function visualizePath(rectangles) {
    console.log('\n=== PATH VISUALIZATION ===');
    rectangles.forEach((item, index) => {
        const rect = item.rectangle;
        const directionName = {
            1: 'UP',
            2: 'RIGHT',
            3: 'DOWN',
            4: 'LEFT'
        };

        console.log(`${index}: [${rect[0]},${rect[1]} to ${rect[2]},${rect[3]}] via ${directionName[item.direction] || 'START'}`);
    });
}

visualizePath(allRectangles);