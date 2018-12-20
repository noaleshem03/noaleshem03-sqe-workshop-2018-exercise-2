import * as esprima from 'esprima';
import * as safeeval from 'expr-eval';
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

export {parseCode};

//---------------------------PARSING---------------------------

function parsing (codeToParse){
    let arrayRows = [];
    let body = codeToParse.body;
    let countRow = 0;
    let scope = '';
    parsingRec(arrayRows, body, countRow, scope);
    return arrayRows;
}
function parsingRec (arrayRows, body, countRow, scope){
    for (let i=0; i<body.length; i++){
        countRow++;
        countRow = parseSingle(arrayRows, body[i], countRow, scope);
    }
    return countRow;
}
function parseSingle (arrayRows, item, countRow, scope){
    if (item.type === 'VariableDeclaration')
        countRow = parseVariable (item, countRow, arrayRows, scope);
    else if (item.type === 'ExpressionStatement')
        countRow = parseAssignment(item, countRow, arrayRows, scope);
    else if (item.type === 'IfStatement')
        countRow = parseIf(arrayRows, item, countRow, scope);
    else if (item.type === 'WhileStatement')
        countRow = parseWhile(arrayRows, item, countRow, scope);
    else
        countRow = parseSingleCon(arrayRows, item, countRow, scope);
    return countRow;
}

function parseSingleCon(arrayRows, item, countRow, scope){
    if (item.type === 'ReturnStatement')
        arrayRows.push(parseReturn(item, countRow, scope));
    /*else if (item.type === 'ForStatement')
        countRow = parseFor (arrayRows, item, countRow, scope);*/
    else /*if (item.type === 'FunctionDeclaration')*/
        countRow = parseFunction(item, countRow, arrayRows, scope);
    return countRow;
}

function parseBlock(arrayRows, item, countRow, scope){
    if (item.type === 'BlockStatement')
        countRow = parsingRec(arrayRows, item.body, countRow, scope) + 1;
    else
        countRow = parseSingle(arrayRows, item, countRow+1, scope);
    return countRow;
}

function parseVariable (item, lineNum, arrayRows, scope){
    for (let j=0; j<item.declarations.length; j++){
        arrayRows.push(parseVariableTemp(item.declarations[j], lineNum, scope));
        if (item.declarations[j].init !== null)
            arrayRows.push(parseAssignmentTemp(item.declarations[j], lineNum, scope));
    }
    return lineNum;
}

function parseVariableTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'variable declaration';
    let n = '';
    if (item.type === 'VariableDeclarator')
        n = parseExpression(item.id);
    else n = parseExpression(item);
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseAssignment(item, lineNum, arrayRows, scope){
    arrayRows.push(parseAssignmentTemp(item.expression, lineNum, scope));
    return lineNum;
}

function parseAssignmentTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'assignment expression';
    let n='', v='';
    if (item.type === 'VariableDeclarator'){
        n = parseExpression(item.id);
        v = parseExpression(item.init);
    }
    else if (item.type === 'AssignmentExpression'){
        n = parseExpression(item.left);
        v = parseExpression(item.right);
    }
    else{ /*if (item.type === 'UpdateExpression'){*/
        n = parseExpression(item.argument);
        v = n + item.operator;
    }
    let c = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseIf(arrayRows, item, countRow, scope){
    arrayRows.push(parseIfTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.consequent, countRow, scope);
    if (item.alternate !== null){
        if (item.alternate.type === 'IfStatement')
            countRow = parseElseIf(arrayRows, item.alternate, countRow+1, scope);
        else {
            countRow++;
            arrayRows.push(parseElse(countRow, scope));
            countRow = parseBlock(arrayRows, item.alternate, countRow, scope);
        }
    }
    return countRow;
}

function parseIfTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'if statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseElseIf(arrayRows, item, countRow, scope){
    arrayRows.push(parseElseIfTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.consequent, countRow, scope);
    if (item.alternate !== null){
        /*if (item.alternate.type === 'IfStatement')
            countRow = parseElseIf(arrayRows, item.alternate, countRow+1, scope);
        else {*/
        countRow++;
        arrayRows.push(parseElse(countRow, scope));
        countRow = parseBlock(arrayRows, item.alternate, countRow, scope);
        //}
    }
    return countRow;
}

function parseElseIfTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'else if statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseElse (lineNum, scope){
    let l = lineNum;
    let t = scope + 'else statement';
    let n = '';
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseWhile (arrayRows, item, countRow, scope){
    arrayRows.push(parseWhileTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.body, countRow, scope);
    return countRow;
}

function parseWhileTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'while statement';
    let n = '';
    let c = parseExpression(item.test);
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

/*
function parseFor (arrayRows, item, countRow, scope){
    arrayRows.push(parseForTemp(item, countRow, scope));
    countRow = parseBlock(arrayRows, item.body, countRow, scope);
    return countRow;
}*/

/*
function parseForTemp (item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'for statement';
    let n = '';
    let c = '';
    if (item.init.type === 'VariableDeclaration')
        c += item.init.declarations[0].id.name + '=' + item.init.declarations[0].init.value + '; ';
    else if (item.init.type === 'AssignmentExpression')
        c += parseExpression(item.init) + '; ';
    c += parseExpression(item.test) + '; ';
    c += item.update.argument.name + item.update.operator;
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}*/

function parseFunction(item, countRow, arrayRows, scope){
    scope = 'F ';
    arrayRows.push(parseFunctionTemp(item, countRow, scope));
    for (let i=0; i<item.params.length; i++){
        arrayRows.push(parseVariableTemp(item.params[i], countRow, scope));
    }
    countRow = parsingRec (arrayRows, item.body.body, countRow, scope) + 1;
    return countRow;
}

function parseFunctionTemp(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'function declaration';
    let n = parseExpression(item.id);
    let c = '';
    let v = '';
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseReturn(item, lineNum, scope){
    let l = lineNum;
    let t = scope + 'return statement';
    let n = '';
    let c = '';
    let v = parseExpression(item.argument);
    return {line: l, type: t, name: n, condition: c, value: v};
}

function parseExpression(item){
    let v;
    if (item === null)
        v = '';
    else if (item.type === 'Literal')
        v = item.raw;
    else if (item.type === 'Identifier')
        v = item.name;
    /*else if (item.type === 'UnaryExpression')
        v = item.operator + parseExpression(item.argument);*/
    else
        v = parseExpressionCon(item);
    return v;
}

function parseExpressionCon(item){
    let v;
    if (item.type === 'BinaryExpression' || item.type === 'AssignmentExpression')
        v = parseExpression(item.left) + ' ' + item.operator + ' ' + parseExpression(item.right);
    else if (item.type === 'MemberExpression')
        v = parseExpression(item.object) + '[' + parseExpression(item.property) + ']';
    /*else if (item.type === 'CallExpression')
        v = parseCallExpression(item);*/
    else /*if (item.type === 'ArrayExpression')*/
        v = parseArrayExpression (item);
    return v;
}

function parseArrayExpression (item){
    let v = '[';
    let elements = item.elements;
    for (let i=0; i<elements.length; i++){
        if (i === elements.length-1)
            v = v + parseExpression(elements[i]);
        else
            v = v + parseExpression(elements[i]) + ', ';
    }
    v = v + ']';
    return v;
}

/*
function parseCallExpression (item){
    let v;
    v = item.callee.name + ' (';
    let param = item.arguments;
    for (let i=0; i<param.length; i++){
        if (i === param.length-1) v = v + parseExpression(param[i]);
        else v = v + parseExpression(param[i]) + ', ';
    }
    v = v + ')';
    return v;
}*/

export {parsing};

//-------------------------SYMBOLIC SUBSTITUTION--------------------------
function parsingInputVector (inputVector){
    inputVector = inputVector.slice(1, inputVector.length-1);
    let parsedVector = parseCode(inputVector);
    let vector = [];
    if (parsedVector.body[0].expression.type === 'AssignmentExpression'){
        let expr = parsedVector.body[0].expression;
        vector.push({name: expr.left.name, value: expr.right.raw});
    }
    else{
        let expressions = parsedVector.body[0].expression.expressions;
        for (let i=0; i<expressions.length; i++){
            let item = expressions[i];
            let n = item.left.name;
            let v = item.right.raw;
            vector.push({name: n, value: v});
        }
    }
    return vector;
}
export {parsingInputVector};

function symbolicSubstitution(parsedArray, inputVector) {
    addGlobals(parsedArray, inputVector);
    subParsedArray(parsedArray);
    return parsedArray;
}
export {symbolicSubstitution};

function subParsedArray(parsedArray) {
    const locals = addLocals(parsedArray);
    let localsTemp = copyArray (locals);
    for (let i=0; i<parsedArray.length; i++){
        let item = parsedArray[i];
        if (i > 0){
            let def = item.line - parsedArray[i-1].line;
            if (def > 1)
                localsTemp = copyArray(locals);
        }
        subParsedArrayCon(parsedArray, item, localsTemp, i);
    }
    removeLines(parsedArray);
    return parsedArray;
}
export {subParsedArray};

function copyArray (locals){
    let localsTemp = [];
    for (let i=0; i<locals.length; i++)
        localsTemp.push({name: locals[i].name, value: locals[i].value});
    return localsTemp;
}

function subParsedArrayCon(parsedArray, item, localsTemp, i){
    if (item.type === 'F assignment expression')
        subAssignment(item, localsTemp, parsedArray, i);
    else if (item.type === 'F if statement')
        subCondition(item, localsTemp, parsedArray, i);
    else if (item.type === 'F else if statement')
        subCondition(item, localsTemp, parsedArray, i);
    else
        subParsedArrayCon1(parsedArray, item, localsTemp, i);
}

function subParsedArrayCon1(parsedArray, item, localsTemp, i){
    if (item.type === 'F while statement')
        subCondition(item, localsTemp, parsedArray, i);
    else if (item.type === 'F return statement')
        subValue (item, localsTemp, parsedArray, i);
}

function addGlobals(parsedArray, inputVector){
    for (let i=0; i<parsedArray.length; i++){
        let item = parsedArray[i];
        if (item.type.charAt(0) !== 'F' && item.type === 'variable declaration'){
            i = addGlobalsCon(parsedArray, inputVector, i);
        }
    }
}

function addGlobalsCon(parsedArray, inputVector, i){
    let item = parsedArray[i];
    if (i+1 < parsedArray.length){
        let ass = parsedArray[i+1];
        if (item.name === ass.name && ass.type === 'assignment expression' && ass.type.charAt(0) !== 'F') {
            inputVector.push({name: ass.name, value: ass.value});
            i++;
        }
        else
            inputVector.push({name: item.name, value: ''});
    }
    else
        inputVector.push({name: item.name, value: ''});
    return i;
}

function addLocals(parsedArray){
    let locals = [];
    let funcLine = findFuncLine (parsedArray);
    for (let i=0; i<parsedArray.length; i++){
        let item = parsedArray[i];
        if (item.type === 'F variable declaration' && item.line !== funcLine){
            let temp = i;
            i = addLocalsCon(parsedArray, locals, i);
            markAsLocal (parsedArray, temp);
        }
    }
    return locals;
}

function addLocalsCon(parsedArray, locals, i){
    let item = parsedArray[i];
    if (i+1 < parsedArray.length){
        let ass = parsedArray[i+1];
        if (item.name === ass.name && ass.type === 'F assignment expression') {
            locals.push({name: ass.name, value: ass.value});
            i++;
            //markAsLocal (parsedArray, i);
        }
        else
            locals.push({name: item.name, value: ''});
    }
    else
        locals.push({name: item.name, value: ''});
    return i;
}

function subAssignment (item, localsTemp, parsedArray, i){
    subValue (item, localsTemp, parsedArray, i);
    item = parsedArray[i];
    let pos = isLocal(item.name, localsTemp);
    if (pos >= 0){
        localsTemp[pos] = {name: item.name, value: item.value};
        markAsLocal (parsedArray, i);
    }
}

function subCondition (item, localsTemp, parsedArray, i){
    let c;
    if (item.condition.includes('*') || item.condition.includes('/'))
        c = replaceLocals(item.condition, localsTemp, true);
    else
        c = replaceLocals(item.condition, localsTemp, false);
    parsedArray[i] = {line: item.line, type: item.type, name: item.name, condition: c, value: item.value};
}

function subValue (item, localsTemp, parsedArray, i){
    let v;
    if (item.value.includes('*') || item.value.includes('/'))
        v = replaceLocals(item.value, localsTemp, true);
    else
        v = replaceLocals(item.value, localsTemp, false);
    parsedArray[i] = {line: item.line, type: item.type, name: item.name, condition: item.condition, value: v};
}

function isLocal(name, localsTemp){
    for (let i=0; i<localsTemp.length; i++){
        if (localsTemp[i].name === name)
            return i;
    }
    return -1;
}

function markAsLocal (parsedArray, i){
    let l = parsedArray[i].line;
    let n = parsedArray[i].name;
    let c = parsedArray[i].condition;
    let v = parsedArray[i].value;
    parsedArray[i] = {line: l, type: 'REMOVE', name: n, condition: c, value: v};
}

function replaceLocals(toReplace, localsTemp, wrap){
    if (!containsLocal(toReplace, localsTemp))
        return toReplace;
    for (let i=0; i<localsTemp.length; i++){
        let v;
        if (wrap)
            v = '(' + localsTemp[i].value + ')';
        else
            v = localsTemp[i].value;
        toReplace = toReplace.replace(localsTemp[i].name, v);
    }
    return replaceLocals(toReplace, localsTemp);
}

function containsLocal (toReplace, localsTemp){
    for (let i=0; i<localsTemp.length; i++){
        if (toReplace.includes(localsTemp[i].name))
            return true;
    }
    return false;
}

function findFuncLine (parsedArray){
    for (let i=0; i<parsedArray.length; i++) {
        let item = parsedArray[i];
        if (item.type === 'F function declaration')
            return item.line;
    }
    return 0;
}

function removeLines(parsedArray){
    let nextLine = 1, flag = 0;
    for (let i=0; i<parsedArray.length; i++){
        let item = parsedArray[i];
        if (item.type === 'REMOVE'){
            flag = 1;
            parsedArray.splice(i, 1);
            i--;
        }
        else
            nextLine = removeLinesCon(item, nextLine, parsedArray, flag, i);
    }
}

function removeLinesCon(item, nextLine, parsedArray, flag, i){
    let newLine;
    if (flag === 0) newLine = item.line;
    else newLine = nextLine;
    parsedArray[i] = {line: newLine, type: item.type, name: item.name, condition: item.condition, value: item.value};
    if (i+1 < parsedArray.length){
        let def = parsedArray[i+1].line - item.line;
        if (def > 1)
            nextLine += def;
        else
            nextLine = parsedArray[i].line + 1;
    }
    return nextLine;
}

//-------------------------------STRINGIFY--------------------------------

function stringifyParsedTableInArray(parsedArray, paintLines){
    let result = [], lineNum = 1, i = 0, countBrackets = 0;
    while (i<parsedArray.length){
        let item = parsedArray[i];
        lineNum = numberLine (lineNum, item.line, result);
        if (item.type === 'F function declaration'){
            i += stringifyFunction(parsedArray, lineNum, i, result);
            countBrackets++;
        }
        else if (item.type === 'F variable declaration' || item.type === 'variable declaration')
            i += stringifyVariable(parsedArray, lineNum, i, result);
        else
            countBrackets = stringifyParsedTableInArrayCon(parsedArray, result, item, lineNum, i, countBrackets, paintLines);
        i++;
    }
    checkBrackets(result, countBrackets);
    return result;
}
export {stringifyParsedTableInArray};

function stringifyParsedTableInArrayCon(parsedArray, result, item, lineNum, i, countBrackets, paintLines){
    if (item.type === 'F assignment expression')
        stringifyAssignment(parsedArray, lineNum, i, result);
    else if (item.type === 'F if statement'){
        stringifyIf(parsedArray, lineNum, i, result, paintLines);
        countBrackets++;
    }
    else if (item.type === 'F else if statement'){
        stringifyElseIf(parsedArray, lineNum, i, result, paintLines);
        countBrackets++;
    }
    else
        countBrackets = stringifyParsedTableInArrayCon1(parsedArray, result, item, lineNum, i, countBrackets);
    return countBrackets;
}

function stringifyParsedTableInArrayCon1(parsedArray, result, item, lineNum, i, countBrackets){
    if (item.type === 'F else statement'){
        stringifyElse(parsedArray, lineNum, i, result);
        countBrackets++;
    }
    else if (item.type === 'F while statement'){
        stringifyWhile(parsedArray, lineNum, i, result);
        countBrackets++;
    }
    else /*if (item.type === 'F return statement')*/
        stringifyReturn(parsedArray, lineNum, i, result);
    return countBrackets;
}

function stringifyFunction(parsedArray, lineNum, i, result){
    let line = '';
    let func = parsedArray[i];
    let countVar = 0;
    line += 'function ' + func.name + ' (';
    for (let j=i+1; j<parsedArray.length; j++){
        let item = parsedArray[j];
        if (item.type === 'F variable declaration' && lineNum === item.line) {
            line += item.name + ', ';
            countVar++;
        }
        else
            break;
    }

    line = line.slice(0, line.length-2);
    line += ') {';
    result.push(line);
    return countVar;
}

function stringifyVariable(parsedArray, lineNum, i, result){
    let line = '';
    let variable = parsedArray[i];
    let isAss = 0;
    line += 'let ' + variable.name;
    if (i+1 < parsedArray.length) {
        let ass = parsedArray[i+1];
        if ((ass.type === 'F assignment expression' || ass.type === 'assignment expression') && lineNum === ass.line) {
            line += ' = ' + ass.value + ';';
            isAss++;
        }
    }
    else
        line += ';';
    result.push(line);
    return isAss;
}

function stringifyAssignment(parsedArray, lineNum, i, result){
    let line = '';
    let ass = parsedArray[i];
    line += ass.name + ' = ' + ass.value + ';';
    result.push(line);
    return 0;
}

function stringifyIf(parsedArray, lineNum, i, result, paintLines){
    let line = '';
    let ifLine = parsedArray[i];
    line += isInPaintLines(paintLines, ifLine.line);
    line += 'if (' + ifLine.condition + ') {';
    result.push(line);
    return 0;
}

function stringifyElseIf(parsedArray, lineNum, i, result, paintLines){
    let line = '';
    let ifLine = parsedArray[i];
    line += isInPaintLines(paintLines, ifLine.line);
    line += 'else if (' + ifLine.condition + ') {';
    result.push(line);
    return 0;
}

function stringifyElse(parsedArray, lineNum, i, result){
    let line = '';
    line += 'else {';
    result.push(line);
    return 0;
}

function stringifyWhile(parsedArray, lineNum, i, result){
    let line = '';
    let whileLine = parsedArray[i];
    line += 'while (' + whileLine.condition + ') {';
    result.push(line);
    return 0;
}

function stringifyReturn(parsedArray, lineNum, i, result){
    let line = '';
    let ret = parsedArray[i];
    line += 'return ' + ret.value + ';';
    result.push(line);
    return 0;
}

function numberLine (lineNum, item_line, result){
    if (lineNum < item_line){
        let def = item_line - lineNum;
        if (def > 1)
            result.push('}');
        lineNum = item_line;
    }
    return lineNum;
}

function checkBrackets (result, countBrackets){
    let count = 0;
    for (let i=0; i<result.length; i++){
        if (result[i] === '}')
            count++;
    }
    let def = countBrackets - count;
    for (let j=0; j<def; j++)
        result.push('}');
}

//-------------------------------PAINTING--------------------------------

function paintCode (inputVectorString, parsedArray){
    let inputVector = parsingInputVector(inputVectorString);
    let Parser = safeeval.Parser;
    let parser = new Parser();
    let newArray = symbolicSubstitution(parsedArray, inputVector);
    let env = createEnv(inputVector);
    let paintLines = evalCode (newArray, parser, env);
    let subCode = stringifyParsedTableInArray(newArray, paintLines);
    return subCode;
}

function createEnv(inputVector){
    let env = {};
    for (let i=0; i<inputVector.length; i++){
        env[inputVector[i].name] = inputVector[i].value;
    }
    return env;
}
export {createEnv};

function evalCode (parsedArray, parser, env) {
    let paintLines = [];
    for (let i = 0; i < parsedArray.length; i++) {
        let item = parsedArray[i];
        if (item.type === 'F assignment expression'){
            let expr = parser.parse(item.value);
            env[item.name] = expr.evaluate(env);
        }
        else
            evalCodeCon (item, env, parser, paintLines);
    }
    return paintLines;
}
export {evalCode};

function evalCodeCon (item, env, parser, paintLines) {
    if (item.type === 'F if statement' || item.type === 'F else if statement' || item.type === 'F while statement') {
        let expr = parser.parse(item.condition);
        let result = expr.evaluate(env);
        if (result === true)
            paintLines.push({line: item.line, color: 'green'});
        else
            paintLines.push({line: item.line, color: 'red'});
    }
}

function isInPaintLines(paintLines, lineNum){
    let result = '';
    for (let i=0; i<paintLines.length; i++){
        if (paintLines[i].line === lineNum){
            if (paintLines[i].color === 'green')
                result += 'G';
            else /*if (paintLines[i].color === 'red')*/
                result += 'R';
        }
    }
    return result;
}

export {paintCode};