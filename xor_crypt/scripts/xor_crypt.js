function genRandomKey() {
    const CHARS ="ABCDEFGHIJKLMNOPQRSTUVWXTZ0123456789abcdefghiklmnopqrstuvwxyz"; 
    var s = "";
    const length = 240;
    for (let i=0; i<length; i++) {
        var num = Math.floor(Math.random() * CHARS.length);
        s += CHARS.substring(num, num+1);

    }
    document.getElementById("key").value = s;
}

function genSalt() {
    const CHARS ="ABCDEFGHIJKLMNOPQRSTUVWXTZ0123456789abcdefghiklmnopqrstuvwxyz"; 
    var s = "";
    const length = 10;
    for (let i=0; i<length; i++) {
        var num = Math.floor(Math.random() * CHARS.length);
        s += CHARS.substring(num, num+1);

    }
    var originaltext = document.getElementById("plaintext").value;
    document.getElementById("plaintext").value = s + " " + originaltext;
}


function Format(text, key, i, j) {
    let xor = text.charCodeAt(i) ^ key.charCodeAt(j); //this is an int here...
    //let xorInt  = xor; //parseInt(xor); //then this is not needed
    let xorHex = xor.toString(16); //this is what would be concat'd  to output
    if (xorHex.length == 1) {
        xorHex = "0" + xorHex;
    }
    let xorIntReverse = parseInt(xorHex, 16); //would need to run parseInt(char, 16) to convert back
    let reverse = xor ^ key.charCodeAt(j);
    console.log('Format', xorHex, xorIntReverse, text.charCodeAt(i),  reverse);
    return xor;
}

function XOR_crypt(text, key) {
    var output = "";
    for (let i = 0; i<text.length; i++) {
        let j = i;
        if (j >= key.length) {
            j = i % key.length;		
        }


        let xor = (text.charCodeAt(i) ^ key.charCodeAt(j)).toString(16) ;
        if (xor.length === 1) {
            xor = "0" + xor;
        }
        output += xor;
        //console.log(text.charAt(i), xor);

    }

    document.getElementById("ciphertext").value = output;
}


function XOR_decrypt(text, key, encrypt) {
    //ciphertext is encoded here in hex so that each character takes 2 hex chars
    var output = "";
    let j = 0;
    for (let i=0; i<text.length; i+=2) {
        if (j >= key.length) {
            j = i % key.length;		
        }


        let hex = text.slice(i, i+2);
        let c = parseInt(hex, 16);
        //console.log(hex, c);
        output += String.fromCharCode(c ^ key.charCodeAt(j)) ;

        j += 1;


    }

    document.getElementById("plaintext").value = output;
}


function notifyError(msg) {
    var elem = document.getElementById("message");
    elem.innerHTML = '<div id="error" class="notify-error">' + msg + '</div>';

    console.log(elem.innerHTML);
    //var error = document.createElement('div');
    //message.innerHTML = '<div id="error" class="notify-error">' + msg + '</div>';
    //message.appendChild(error);
}

function clearError() {
    var elem = document.getElementById("message");
    elem.innerHTML = '';
}

function clearPlaintext() {
    document.getElementById("plaintext").value = '';
}

function clearCiphertext() {
    document.getElementById("ciphertext").value = '';
}


function encryptDecrypt() {
    //check 3 fields: key, plaintext, cipher text: 
    //need key + plain or key + cipher text!
    //
    var key = document.getElementById("key").value;
    var plaintext = document.getElementById("plaintext").value;
    var ciphertext = document.getElementById("ciphertext").value;
    console.log("key:", key);
    console.log("plaintext:", plaintext);
    console.log("ciphertext:", ciphertext);

    clearError();

    if (!key) { //add warning- need key for everything!
        console.log("Need key!")
            notifyError("Need a key");
    }
    else if (!plaintext && !ciphertext) { //add warning need one or the other text for anything
        notifyError("Need either plain text -OR- cipher text");
    }
    else if (plaintext && ciphertext) { //add warning: need to remove either plaintext or ciphertext- need one or the other
        console.log("Need only 1 of plain text -OR- cipher text");
        notifyError("Need only 1 of plain text -OR- cipher text");
    }
    else if (key && plaintext) { //encrypt
        console.log("Encrypting...");
        XOR_crypt(plaintext, key);
        console.log("Done.");
    }
    else if (key && ciphertext) { //decrypt
        console.log("Decrypting...");
        XOR_decrypt(ciphertext, key);
        console.log("Done.");
    }
}

window.onload = function onLoad() {
    genRandomKey();
    //clearPlainText();
    genSalt();
    encryptDecrypt(); 
}
