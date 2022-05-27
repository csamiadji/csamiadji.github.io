var hideTable ;
var revealTable ;
var repeats ;
var DELIMITER = ",";
var isUTF8 = false;

function saveText(id, name) {
    let text = document.getElementById(id).value;	

    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([text], {type: 'text/plain'}));
    a.download = name;
    a.click();


}


function loadDefaultMaskingText() {
    //let maskingText = document.getElementById(kalavala").innerHTML;
    //let maskingText = document.getElementById("kalavala_file");
    //maskingTextElem.innerHTML = maskingText;

    let maskingTextElem = document.getElementById("maskingText");
    //maskingTextElem.innerHTML = elem.contentDocument.body.childNodes[0].innerHTML;
    maskingTextElem.innerHTML = kalavala_text;
    console.log("loadDefaultMaskingText");
}

function myStringSplit(text, delim) {
    //this function exists bc String.split works differently in firefox and chrome
    text = text.normalize();
    delim = delim.normalize();
    delimCharCode = delim.charCodeAt(0);

    let result = []
        let prevIdx = 0;
    for (let i=0; i<text.length; i++) {
        if (text.charCodeAt(i) == delimCharCode) {
            let token = text.slice(prevIdx, i);
            if (token.length > 0) {
                result.push(token);
            }
            prevIdx = i + 1; //skip over delim char!
        }
    }

    return result;
}


function readFile(fileInput) {
    clearError();

    if(fileInput.files[0] == undefined) {
        notifyError("No file provided.");
        return ;
    }
    // Example of what information you can read
    // var filename = fileInput.files[0].name;
    // var filesize = fileInput.files[0].size;
    var reader = new FileReader();
    reader.onload = function(ev) {
        var content = ev.target.result; // content is a string

        console.log("readFile() ev.target.id:", fileInput.id, fileInput.id);
        if (fileInput.id == "maskingTextFile") {

            console.log("Setting maskingTextFile value");
            document.getElementById("maskingText").value = content;
            buildTables();
        }
        else if (fileInput.id == "hiddenTextFile") {
            console.log("Setting hiddenOutputText value");
            document.getElementById("hiddenOutputText").value = content;
        }
        console.log("Successfully read file");
    };
    reader.onerror = function(err) {
        console.error("Failed to read file", err);
        notifyError("Failed to read file");
    }

    reader.readAsText(fileInput.files[0]);
}

function setDelimiter() {

    DELIMITER = document.getElementById("delimiter").value;
    console.log("Delimiter changed:", DELIMITER);

    buildTables();
}

function buildTables() {

    clearError();

    let rawText = document.getElementById("maskingText").value;
    hideTable = {}; // {byte: [words | sentences]}
revealTable = {}; // {word | sentence : byte}
repeats = {}; // {word | sentence : true}

DELIMITER = document.getElementById("delimiter").value;
console.log("Building Tables...");
console.log("Delimiter:", DELIMITER);


let phrases = myStringSplit(rawText, DELIMITER);


console.log('N Phrases:', phrases.length);
let MAX_CHAR = 256; //UTF-8- 
if (phrases.length < 256) {
    isUTF8 = false;
    notifyError("Warning: not enough tokens available for even UTF-8");
    console.log("Not enough chars for UTF-8!");

} else if (phrases.length >= Math.pow(2, 16)) { //utf-16
    MAX_CHAR = Math.pow(2, 16);  //UTF-16 is possible, make sure any cut+paste ops are stored into utf-16 buffers!
    isUTF8 = false;
    console.log("Enough chars for UTF-16");
}  else {
    console.log("Using UTF-8");
    isUTF8 = true;
}

let i = 0; 
for (let j=0; j<phrases.length; j++) {
    let token = phrases[j];


    //poetry (',' delimited) looks better w/ each phrase on sep lines
    //otherw remove newlines and extra spaces
    if (DELIMITER != ",") {
        token = token.replace(/[\r\n]+/gm, " ");
        //token = token.trim();
    } else {
        token = token.replace(/[\r\n]+/gm, "\n");
    }

    if (token.length > 255 || token.length == 0) {
        continue;
    }

    if (!hideTable[i]) {
        hideTable[i] = [];
    }

    if (repeats[token]) {
        continue;
    }	
    else {
        repeats[token] = true;
    }
    hideTable[i].push( token );

    revealTable[ token ] = i;
    i = (i + 1) % MAX_CHAR;

}

console.log( hideTable );
console.log( '*************' );
console.log( revealTable );

}



function hideText() {
    if (!hideTable) {

        buildTables();
    }

    console.log("Hiding text...");
    console.log("Delimiter:", DELIMITER);
    let plainText = document.getElementById("plainText").value;
    let hiddenTextElem = document.getElementById("hiddenOutputText");

    let out = "";

    plaintText = plainText.normalize();

    console.log( "Plain Text Length:", plainText.length )

        for (let i=0; i<plainText.length; i++) {
            let code = plainText.charCodeAt(i);

            if (!hideTable[code]) {
                console.log('missing', code, hideTable[code]);
                continue;
            }
            let k = Math.floor(Math.random() * (hideTable[code].length)) ;

            //console.log(code, k, hideTable[code][k]);
            out += hideTable[code][k] + DELIMITER; //delim
        }

    hiddenTextElem.value = out;
    console.log("Hidden Text: ", out);
    console.log("Done Hiding");
}

function revealHiddenText() {
    if (!revealTable) {
        buildTables();
    }

    console.log("Un-Hiding text...");
    console.log("Delimiter:", DELIMITER);
    let plainTextElem = document.getElementById("plainText");
    let hiddenText = document.getElementById("hiddenOutputText").value;

    let out = "";

    let hiddenTextItems = myStringSplit(hiddenText, DELIMITER);

    console.log( "Hidden Text Number of Phrases:", hiddenTextItems.length )
        for (let i=0; i<hiddenTextItems.length; i++) {
            let phrase = hiddenTextItems[i];
            if (!phrase) {
                console.log("Missing phrase:", phrase);
                continue;
            }

            if (!revealTable[phrase]) {
                console.log("Missing phrase revealTable entry:", phrase);
                continue;
            }
            let code = revealTable[phrase];

            //console.log(phrase, code, revealTable[phrase]);
            let s = String.fromCharCode(code); //.toString(16);
            //out += (s.length == 2) ? s : "0" + s;
            out += s;
        }

    plainTextElem.value = out;
    console.log("Plain Text: ", out);
    console.log("Done Un-Hiding");
}



function notifyError(msg) {
    var elem = document.getElementById("message");
    elem.innerHTML = '<div id="error" class="notify-error">' + msg + '</div>';

    console.log(elem.innerHTML);
}

function clearError() {
    var elem = document.getElementById("message");
    elem.innerHTML = '';
}

function clearplainText() {
    document.getElementById("plainText").value = '';

}

function clearMaskingText() {
    document.getElementById("maskingText").value = '';

    document.getElementById("maskingTextFile").value = '';

    hideTable = {};
    revealTable = {};
    repeats = {};
}

function clearHiddenOutputText() {
    document.getElementById("hiddenOutputText").value = '';
    document.getElementById("hiddenTextFile").value = '';
}


window.onload = loadDefaultMaskingText();
