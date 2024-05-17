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
    let decomp = false;
    const inrack: number[] = [];
    let outrack: number[] | undefined;
    while(cli.hasArgs){
        const arg = cli.pop();
        if(arg === "-d" || arg === "--decompile") decomp = true;
        else if(arg === "--in"){
            if(!cli.hasArgs){
                console.log("in command must be followed by a csv of numbers");
                return;
            }
            const vals = cli.pop().split(",").filter(s => s.trim().length > 0).map(s => +s);
            for (const val of vals) {
                if(typeof val !== "number") {console.log("Invalid number in input"); return;}
                inrack.push(val);
            }
        }
        else if(arg === "--out"){
            if(!cli.hasArgs){
                console.log("out command must be followed by a csv of numbers");
                return;
            }
            const vals = cli.pop().split(",").filter(s => s.trim().length > 0).map(s => +s);
            outrack = [];
            for (const val of vals) {
                if(typeof val !== "number") {console.log("Invalid number in input"); return;}
                outrack.push(val);
            }
        }
    }
    const error = new Error(src);
    const tokens = parse(src, error);
    if(error.hasError) {console.log(error.message); return;}

    const code = compile(tokens, error);
    if(error.hasError) {console.log(error.message); return;}

    if(decomp) decompile(new Uint8Array(code));
    const interpreter = new Interpreter();
    interpreter.init(code, inrack, error, outrack);
    interpreter.run();
    if(error.hasError) {console.log(error.message); interpreter.dmp(); return;}
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