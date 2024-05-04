const fs = require("fs");

function main(){
    const text = fs.readFileSync("./lang_def.txt", {encoding: 'utf-8'});
    const lines = text.split('\n').map(s => s.trim());
    const res = [];
    for (const line of lines) {
        const temp = line.split('|').map(s => s.trim());
        if(temp.length < 8) continue;
        temp.shift();
        const name = temp[0];
        const code = parseInt(temp[1], 16);
        const pops = +temp[2];
        const pushes = +temp[3];
        const arg = temp[4];
        res.push({name, code, pops, pushes, arg});
    }
    fs.writeFileSync("./src/lang_def.json", JSON.stringify(res));
}

main();