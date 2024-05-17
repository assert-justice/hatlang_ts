import * as fs from 'fs';
import { Cli } from "./cli";
import { parse } from './parser';
import { compile } from './compiler';
import { decompile } from './decompiler';
import { Interpreter } from './interpreter';
import { Error } from './error';

function run(cli: Cli){
    const fname = cli.pop();
    if(cli.hasError) {
        throw "Missing positional argument, filename";
    }
    let src = "";
    try{
        src = fs.readFileSync(fname, {encoding: 'utf-8'});
    }
    catch{
        throw `Unable to read file at ${fname}`;
    }
    const error = new Error(src);
    const tokens = parse(src, error);
    if(error.hasError) {console.log(error.message); return;}

    const code = compile(tokens, error);
    if(error.hasError) {console.log(error.message); return;}

    decompile(new Uint8Array(code));
    const interpreter = new Interpreter();
    interpreter.init(code, [5,10], error);
    interpreter.run();
    if(error.hasError) {console.log(error.message); return;}
    console.log(interpreter.outbox);
    
    // if(!Array.isArray(tokens)){
    //     console.log(tokens.message);
    //     return;
    // }
    
    // const [code, error] = compile(tokens, src);
    // if(error.hasError){
    //     console.log(error.message);
    //     return;
    // }
    // decompile(new Uint8Array(code));
    // const interpreter = new Interpreter();
    // interpreter.error.sourceMap = error.sourceMap;
    // interpreter.init(code, [5, 10]);
    // interpreter.run();
    // console.log(interpreter.outbox);
    
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