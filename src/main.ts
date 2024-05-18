import { Cli } from "./cli";
import { parse } from './parser';
import { compile } from './compiler';
import { decompile } from './decompiler';
import { Interpreter } from './interpreter';
import { Error } from './error';
import { puzzleParser } from "./puzzle_parser";

function run(cli: Cli){
    const src = cli.popFile();
    if(cli.hasError){
        console.log(cli.errMessage);
        return;
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

function validate(cli: Cli){
    const src = cli.popFile();
    if(cli.hasError){
        console.log(cli.errMessage);
        return;
    }
    const puzzleSrc = cli.popFile();
    if(cli.hasError){
        console.log(cli.errMessage);
        return;
    }
    const error = new Error(src);
    const tokens = parse(src, error);
    if(error.hasError) {console.log(error.message); return;}

    const code = compile(tokens, error);
    if(error.hasError) {console.log(error.message); return;}
    const interpreter = new Interpreter();
    const puzzle = puzzleParser(puzzleSrc);
    if(!puzzle) throw 'oops';
    let testsPassed = true;
    const numTests = puzzle.runs.length;
    let testIdx = 1;
    for (const run of puzzle.runs) {
        interpreter.init(code, run.inrack, error, run.outrack);
        interpreter.run();
        if(error.hasError){
            console.log(`Test [${testIdx}/${numTests}] failed with following:`);
            console.log(error.message);
            testsPassed = false;
            error.clear();
        }
        else{
            console.log(`Test [${testIdx}/${numTests}] passed!`);
        }
        console.log("");
        testIdx++;
    }
    if(testsPassed) console.log("All tests passing!");
    else console.log("Some tests failed");
    
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
            validate(cli);
            break;
        default:
            console.log(`Invalid command '${verb}'!`);
            break;
    }
}

main();