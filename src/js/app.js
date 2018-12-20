import $ from 'jquery';
import {parseCode, parsing, paintCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        $('p').empty();
        let codeToParse = $('#codePlaceholder').val();
        let inputVectorString = $('#inputVectorPlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let parsedArray = parsing(parsedCode);
        let paintedCode = paintCode (inputVectorString, parsedArray);
        for (let i=0; i<paintedCode.length; i++){
            let marked = paint (paintedCode, i);
            $('p').append(marked + '\n');
        }
        $('#tableBody').empty();
        for (let i = 0; i < parsedArray.length; i++) {
            let item = parsedArray[i];
            let row = `<tr><td>${item.line}</td><td>${item.type}</td>
                        <td>${item.name}</td><td>${item.condition}</td><td>${item.value}</td></tr>`;
            $('#tableBody').append(row);
        }
    });});

function paint (paintedCode, i){
    let marked = paintedCode[i];
    if (paintedCode[i].includes('G')){
        let slicedLine = paintedCode[i].slice(1, paintedCode[i].length);
        marked = '<mark style="background-color: green "> ' + slicedLine + '</mark>';
    }
    else if (paintedCode[i].includes('R')){
        let slicedLine = paintedCode[i].slice(1, paintedCode[i].length);
        marked = '<mark style="background-color: red "> ' + slicedLine + '</mark>';
    }
    return marked;
}
