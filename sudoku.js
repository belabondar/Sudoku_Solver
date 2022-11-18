let container = document.getElementById('container');
let cells = [];
let relevant = [];
let active
let running = false;
let trueReset = false;
let options = [];

for (let i = 0; i < 81; i++){
    let input = document.createElement('input');
    input.type = 'text';
    let col = getColumn(i);
    let row = getRow(i);
    if (!(Math.floor(col / 3) === 1 && Math.floor(row / 3) === 1) && (Math.floor(col / 3) === 1 || Math.floor(row / 3) === 1)) {
        input.classList.add("light");
    }
    input.onfocus = function() {
        setRelevant(i);
    };
    input.oninput = function() {
        cells[i].value=cells[i].value.replace(/[^0-9]/g,'');
        cells[i].value = cells[i].value.slice(-1);
        if (cells[i].value.length !== 0) {
            cells[i].classList.add("blocked")
            cells[i].id = "blocked";
            if (isValid(i)) {
                cells[i].classList.remove("wrong");
            } else {
                cells[i].classList.add("wrong");
            }
        } else {
            cells[i].id = "";
            cells[i].classList.remove("wrong");
            cells[i].classList.remove("blocked");
        }

    }
    container.appendChild(input);
    cells.push(input);
}

function setActive(item) {
    if (typeof active !== "undefined") {
        active.classList.remove("active");
    }
    active = item;
    active.classList.add("active");
}

function isValid(index, num = -1) {
    num = num === -1 ? Number(cells[index].value) : num;
    for (const index of relevant) {
        const cell = cells[index];
        if (Number(cell.value) === num) {
            return false;
        }
    }
    return true;
}

function setRelevant(index) {
    removeHighlight();
    relevant = getRelevant(index);
    highlightRelevant();
    setActive(cells[index]);
}

function getRow(index) {
    return Math.floor(index / 9);
}

function getColumn(index) {
    return index % 9;
}

function getIndex(row, column) {
    return row * 9 + column;
}

function getBlock(index) {
    let row = getRow(index);
    let col = getColumn(index);
    row = row - (row % 3);
    col = col - (col % 3);

    let block = [];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (getIndex((row + r), (col + c)) !== index) {
                block.push(getIndex((row + r), (col + c)));
            }
        }
    }

    return block;
}

function getRelevant(index) {
    let relevant = getBlock(index);
    let col = getColumn(index);
    let row = getRow(index);

    for (let i = 0; i < 9; i++) {
        if (getIndex(i, col) !== index) {
            relevant.push(getIndex(i, col));
        }
        if (getIndex(row, i) !== index) {
            relevant.push(getIndex(row, i));
        }
    }

    return relevant;
}

function highlightRelevant() {
    for (const index of relevant) {
        cells[index].classList.add("highlight")
    }
}

function removeHighlight() {
    if (relevant.length !== 0) {
        for (const index of relevant) {
            cells[index].classList.remove("highlight");
            cells[index].classList.remove("active");
        }
    }
}

function isEmpty(index) {
    return cells[index].value.length === 0;
}

async function solve() {
    let startTime = performance.now();
    let showProgress = document.getElementById("progress");
    let directionInt = 1;
    if (!running) {
        running = true;
        fillOptions();

        useOptions();

        // Bruteforce to finish up
        let i = 0;
        while (i < cells.length && running) {
            if (cells[i].id !== "blocked") {
                setRelevant(i);
                setActive(cells[i]);

                if (!findNextNum(i, isEmpty(i) ? 1 : Number(cells[i].value) + 1)) {
                    directionInt = -1;
                } else {
                    directionInt = 1;
                }

                if(showProgress.checked) {
                    await new Promise(r => setTimeout(r, 0.1));
                }
            }
            i += directionInt;
        }
        cells[cells.length-1].classList.remove("active");
        removeHighlight();
        resetGameStates();
        running = false;
        let endTime = performance.now();
        console.log(`Call to doSomething took ${endTime - startTime} milliseconds`)
    }
}



function resetGameStates() {
    relevant = [];
    running = false;
    trueReset = false;
    options = [];
}

function findNextNum(index, start = 1) {
    for (let i = start; i < 10; i++) {
        cells[index].value = i;
        if (isValid(index)) {
            return true;
        }
    }
    cells[index].value = "";
    return false;
}

function reset() {
    running = false;
    for (let i = 0; i < cells.length; i++) {
        if(cells[i].id !== "blocked" || trueReset) {
            cells[i].value = "";
            cells[i].classList.remove("active");
            cells[i].classList.remove("blocked");
            cells[i].id = "";
        }
    }
    trueReset = !trueReset;
    removeHighlight();
}


function fillOptions() {
    for (let i = 0; i < cells.length; i++) {
        setRelevant(i);
        let cell = cells[i];
        if(cell.id === "blocked") {
            options.push([]);
        } else {
            options.push(getAllValidNums(i));
        }
    }
}

function getAllValidNums(index) {
    let result = [];
    for (let i = 0; i < 10; i++) {
        if (isValid(index, i)) {
            result.push(i);
        }
    }
    return result;
}

function useOptions() {
    let changedOptions = true;
    while (changedOptions) {
        changedOptions = false;
        for (let i = 0; i < options.length; i++) {
            if (options[i].length === 1) {
                console.log("Only one option:", options[i][0])
                setFromOption(i, options[i][0])
                changedOptions = true;
            } else if (options[i].length !== 0) {
                if(appearsInRelevantOptions(i)) {
                    console.log("Only option in:")
                    changedOptions = true;
                }
            }
        }

    }
}

function appearsInRelevantOptions(index) {
    for (const num of options[index]) {
        //Check if item fits in block
        let optionBlock = getBlock(index);
        let canPlaceInBlock = true;
        for (const i of optionBlock) {
            if(options[i].includes(num)) {
                canPlaceInBlock = false;
                break;
            }
        }

        //Check if item fits in Col
        let canPlaceInCol = true;
        let col = getColumn(index);
        for (let i = 0; i < 9; i++) {
            if (getIndex(i, col) !== index) {
                if(options[getIndex(i, col)].includes(num)) {
                    canPlaceInCol = false;
                    break;
                }
            }
        }

        //Check if item fits in Row
        let row = getRow(index);
        let canPlaceInRow = true;
        for (let i = 0; i < 9; i++) {
            if (getIndex(row, i) !== index) {
                if(options[getIndex(row, i)].includes(num)) {
                    canPlaceInRow = false;
                    break;
                }
            }
        }

        if (canPlaceInRow) {
            console.log("row")
        } else if (canPlaceInCol) {
            console.log("col")
        } else if (canPlaceInBlock) {
            console.log("block")
        }

        if(canPlaceInRow || canPlaceInCol || canPlaceInBlock) {
            setFromOption(index, num);
            return true
        }
    }
    return false;
}

function setFromOption(index, value) {
    cells[index].value = value;
    cells[index].id = "blocked";
    cells[index].classList.add("options");
    cells[index].classList.add("blocked");
    options[index] = [];
    let optionRelevant = getRelevant(index);
    for (const i of optionRelevant) {
        removeFromOptions(i, value);
    }
}

function removeFromOptions(index, value) {
    const i = options[index].indexOf(value);
    if (i > -1) { // only splice array when item is found
        options[index].splice(i, 1); // 2nd parameter means remove one item only
    }
}