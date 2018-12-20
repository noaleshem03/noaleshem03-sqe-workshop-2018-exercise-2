import assert from 'assert';
import {paintCode, parseCode} from '../src/js/code-analyzer';
import {parsing, stringifyParsedTableInArray, parsingInputVector, symbolicSubstitution, subParsedArray, createEnv, evalCode} from '../src/js/code-analyzer';
import * as safeeval from 'expr-eval';
describe('The javascript parser', () => {
    it('1. variable declaration', () => {
        assert.deepEqual(
            parsing (parseCode('let a, b;')),
            [{'line': 1, 'type': 'variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'variable declaration', 'name': 'b', 'condition': '', 'value': ''}]
        );
    });

    it('2. variable declaration and assignment', () => {
        assert.deepEqual(
            parsing (parseCode('let a = 1, b = 2;')),
            [{'line': 1, 'type': 'variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 1},
                {'line': 1, 'type': 'variable declaration', 'name': 'b', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'assignment expression', 'name': 'b', 'condition': '', 'value': 2}]
        );
    });

    it('3. variable assignment with binary expression', () => {
        assert.deepEqual(
            parsing (parseCode('a = b + 1;')),
            [{'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'b + 1'}]
        );
    });


    it('4. variable assignment with update expression', () => {
        assert.deepEqual(
            parsing (parseCode('a++;')),
            [{'line': 1, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'a++'}]
        );
    });


    it('5. function declaration without return', () => {
        assert.deepEqual(
            parsing (parseCode('function foo (x, y){\n' +
                'a = y;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'y', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F assignment expression', 'name': 'a', 'condition': '', 'value': 'y'}]
        );
    });

    it('6. function declaration with return', () => {
        assert.deepEqual(
            parsing (parseCode('function goo (a, b){\n' +
                'let c = 0;\n' +
                'if (a > 0)\n' +
                'c--;\n' +
                'return c;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'goo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'a', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'b', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F variable declaration', 'name': 'c', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F assignment expression', 'name': 'c', 'condition': '', 'value': '0'},
                {'line': 3, 'type': 'F if statement', 'name': '', 'condition': 'a > 0', 'value': ''},
                {'line': 4, 'type': 'F assignment expression', 'name': 'c', 'condition': '', 'value': 'c--'},
                {'line': 5, 'type': 'F return statement', 'name': '', 'condition': '', 'value': 'c'}]
        );
    });

    it('7. function declaration with return', () => {
        assert.deepEqual(
            parsing (parseCode('function f(){\n' +
                'return;\n' +
                '}')),
            [{'line': 1, 'type': 'F function declaration', 'name': 'f', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F return statement', 'name': '', 'condition': '', 'value': ''}]
        );
    });

    it('8. if and else if statement', () => {
        assert.deepEqual(
            parsing (parseCode('if (a>0)\n' +
                'a++;\n' +
                'else if (b>0)\n' +
                'b++;')),
            [{'line': 1, 'type': 'if statement', 'name': '', 'condition': 'a > 0', 'value': ''},
                {'line': 2, 'type': 'assignment expression', 'name': 'a', 'condition': '', 'value': 'a++'},
                {'line': 3, 'type': 'else if statement', 'name': '', 'condition': 'b > 0', 'value': ''},
                {'line': 4, 'type': 'assignment expression', 'name': 'b', 'condition': '', 'value': 'b++'}]
        );
    });

    it('9. input vector', () => {
        assert.deepEqual(
            parsingInputVector ('(x=1, y=2, z=3)'),
            [{'name': 'x', 'value': '1'}, {'name': 'y', 'value': '2'},{'name': 'z', 'value': '3'}]
        );
    });

    it('10. input vector1', () => {
        assert.deepEqual(
            parsingInputVector ('(x=1)'),
            [{'name': 'x', 'value': '1'}]
        );
    });

    it('11. substitution', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x + 1;\n' +
            '   return a;\n' +
            '}'));
        let inputVector = parsingInputVector ('(x=1)');
        assert.deepEqual(
            symbolicSubstitution(parsedArray, inputVector),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F return statement', 'name': '', 'condition': '', 'value': 'x + 1'}]
        );
    });

    it('12. subParsedArray multi globals', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   return a;\n' +
            '}'));
        assert.deepEqual(
            subParsedArray(parsedArray),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'y', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'z', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F return statement', 'name': '', 'condition': '', 'value': 'x + 1'}]
        );
    });

    it('13. subParsedArray multi locals', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x + 1;\n' +
            '   let b = a * 2;\n' +
            '   return b;\n' +
            '}'));
        assert.deepEqual(
            subParsedArray(parsedArray),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '(x + 1) * 2'}]
        );
    });

    it('14. substitution with if and else', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x + 1;\n' +
            '   if (a > 10){\n' +
            '      return 3;\n' +
            '   }\n' +
            '   else{\n' +
            '      return 6;\n' +
            '   }\n' + '}'));
        let inputVector = parsingInputVector ('(x=1)');
        assert.deepEqual(
            symbolicSubstitution(parsedArray, inputVector),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F if statement', 'name': '', 'condition': 'x + 1 > 10', 'value': ''},
                {'line': 3, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '3'},
                {'line': 5, 'type': 'F else statement', 'name': '', 'condition': '', 'value': ''},
                {'line': 6, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '6'}]
        );
    });

    it('15. substitution with if and else if', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x + 1;\n' +
            '   if (a > 10){\n' +
            '      return 3;\n' +
            '   }\n' +
            '   else if(a > 0){\n' +
            '      return 6;\n' +
            '   }\n' + '}'));
        let inputVector = parsingInputVector ('(x=1)');
        assert.deepEqual(
            symbolicSubstitution(parsedArray, inputVector),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F if statement', 'name': '', 'condition': 'x + 1 > 10', 'value': ''},
                {'line': 3, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '3'},
                {'line': 5, 'type': 'F else if statement', 'name': '', 'condition': 'x + 1 > 0', 'value': ''},
                {'line': 6, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '6'}]
        );
    });

    it('16. substitution with while', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            '   let a = x + y;\n' +
            '   while (a > 2){\n' +
            '      x = 6;\n' +
            '      a = a - 1;\n' +
            '   }\n' +
            '   return x;\n' +
            '}'));
        let inputVector = parsingInputVector ('(x=1, y=2)');
        assert.deepEqual(
            symbolicSubstitution(parsedArray, inputVector),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'y', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F while statement', 'name': '', 'condition': 'x + y > 2', 'value': ''},
                {'line': 3, 'type': 'F assignment expression', 'name': 'x', 'condition': '', 'value': '6'},
                {'line': 4, 'type': 'F return statement', 'name': '', 'condition': '', 'value': 'x'}]
        );
    });

    it('17. stringifyParsedTableInArray with string', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x;\n' +
            '   return a;\n' +
            '}'));
        let inputVector = parsingInputVector('(x="aaa")');
        let Parser = safeeval.Parser;
        let parser = new Parser();
        let newArray = symbolicSubstitution(parsedArray, inputVector);
        let env = createEnv(inputVector);
        let paintLines = evalCode (newArray, parser, env);
        assert.deepEqual(
            stringifyParsedTableInArray(newArray, paintLines),
            ['function foo (x) {', 'return x;', '}']
        );
    });

    it('18. stringifyParsedTableInArray with array', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            '   let a = x[0];\n' +
            '   return a;\n' +
            '}'));
        let inputVector = parsingInputVector('(x=[23, 34])');
        let Parser = safeeval.Parser;
        let parser = new Parser();
        let newArray = symbolicSubstitution(parsedArray, inputVector);
        let env = createEnv(inputVector);
        let paintLines = evalCode (newArray, parser, env);
        assert.deepEqual(
            stringifyParsedTableInArray(newArray, paintLines),
            ['function foo (x) {', 'return x[0];', '}']
        );
    });

    it('19. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' + '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' + '    }\n' + '}\n'));
        assert.deepEqual(
            paintCode ('(x=1, y=2, z=3)', parsedArray),
            ['function foo (x, y, z) {', 'Rif (x + 1 + y < z) {', 'return x + y + z + 0 + 5;',
                '}', 'Gelse if ((x + 1 + y) < z * 2) {', 'return x + y + z + 0 + x + 5;',
                '}', 'else {', 'return x + y + z + 0 + z + 5;', '}', '}']
        );
    });

    it('20. substitution with if and else if', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            'let a = x + 1;\n' +
            'if (a > 10){\n' +
            'return 3;\n' + '}\n' + 'else if(a > 0){\n' +
            'return 6;\n' + '}\n' + 'else{\n' +
            'return 9;\n' + '}\n' + '}\n'));
        let inputVector = parsingInputVector ('(x=1)');
        assert.deepEqual(
            symbolicSubstitution(parsedArray, inputVector),
            [{'line': 1, 'type': 'F function declaration', 'name': 'foo', 'condition': '', 'value': ''},
                {'line': 1, 'type': 'F variable declaration', 'name': 'x', 'condition': '', 'value': ''},
                {'line': 2, 'type': 'F if statement', 'name': '', 'condition': 'x + 1 > 10', 'value': ''},
                {'line': 3, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '3'},
                {'line': 5, 'type': 'F else if statement', 'name': '', 'condition': 'x + 1 > 0', 'value': ''},
                {'line': 6, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '6'},
                {'line': 8, 'type': 'F else statement', 'name': '', 'condition': '', 'value': ''},
                {'line': 9, 'type': 'F return statement', 'name': '', 'condition': '', 'value': '9'}]
        );
    });

    it('21. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'let a = [x, y];\n' +
            'return a;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', 'return [x, y];', '}']
        );
    });

    it('22. paintCode', () => {
        let parsedArray = parsing (parseCode('let d;\n' +
            'let b = 8;\n' +
            'function foo(x, y){\n' +
            'let a = [x, y];\n' +
            'return a;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['let d', 'let b = 8;', 'function foo (x, y) {', 'return [x, y];', '}']
        );
    });

    it('23. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'let a;\n' +
            'let b;\n' +
            'a = x;\n' +
            'return a;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', 'return x;', '}']
        );
    });

    it('24. paintCode', () => {
        let parsedArray = parsing (parseCode('let a;'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['let a;']
        );
    });

    it('25. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'let a;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', '}']
        );
    });

    it('26. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'x = y;\n' +
            'return x;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', 'x = y;', 'return x;', '}']
        );
    });

    it('26. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'while(x > 0){\n' +
            'x = 6;\n' +
            '}\n' +
            'return x;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', 'while (x > 0) {', 'x = 6;', '}', 'return x;', '}']
        );
    });

    it('27. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x, y){\n' +
            'if(x > 0){\n' +
            'return 6;\n' +
            '}\n' +
            'return 0;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1, y=2)', parsedArray),
            ['function foo (x, y) {', 'Gif (x > 0) {', 'return 6;', '}', 'return 0;', '}']
        );
    });

    it('28. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            'let a = x;\n' +
            'if (a > 3){\n' +
            'x = 1;\n' +
            '}\n' +
            'else{\n' +
            'x = 2;\n' +
            '}\n' +
            'return x;\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1)', parsedArray),
            ['function foo (x) {', 'Rif (x > 3) {', 'x = 1;', '}', 'else {', 'x = 2;', '}', 'return x;', '}']
        );
    });

    it('29. paintCode', () => {
        let parsedArray = parsing (parseCode('function foo(x){\n' +
            'if (x > 10){\n' +
            'x = 10;\n' +
            '}\n' +
            '}'));
        assert.deepEqual(
            paintCode ('(x=1)', parsedArray),
            ['function foo (x) {', 'Rif (x > 10) {', 'x = 10;', '}', '}']
        );
    });
});

