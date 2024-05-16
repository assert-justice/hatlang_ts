import * as fs from 'fs';
import { Cli } from "./cli";
import { parse } from './parser';
import { compile } from './compiler';
import { decompile } from './decompiler';
import { Interpreter } from './interpreter';

function run(cli: Cli){
    const fname = cli.pop();
    if(cli.hasError) {
        console.log("Missing positional argument, filename");
        return
    }
    let src = "";
    try{
        src = fs.readFileSync(fname, {encoding: 'utf-8'});
    }
    catch{
        console.log(`Unable to read file at ${fname}`);
        return;
    }
    const tokens = parse(src);
    if(!Array.isArray(tokens)){
        console.log(tokens.message);
        return;
    }
    // console.log(tokens);
    
    const [code, error] = compile(tokens, src);
    if(error.hasError){
        console.log(error.message);
        return;
    }
    decompile(new Uint8Array(code));
    const interpreter = new Interpreter();
    interpreter.error.sourceMap = error.sourceMap;
    interpreter.init(code, [5, 10]);
    interpreter.run();
    console.log(interpreter.outbox);
    
}

function main(){
    const cli = new Cli();
    const verb = cli.pop();
    if(cli.hasError){
        console.log("Not enough arguments!");
        return
    }
    switch (verb) {
        case "run":
            run(cli);
            break;
        case "build":
            console.log("Not yet implemented");
            break;
        case "validate":
            console.log("Not yet implemented");
            break;
        default:
            console.log(`Invalid command '${verb}'!`);
            break;
    }
}

main();