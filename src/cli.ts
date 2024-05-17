import * as fs from 'fs';

export class Cli{
    args: string[];
    private _errMessage = "";
    get hasError(){return this._errMessage.length > 0;}
    get errMessage(){return this._errMessage;}
    constructor(){
        this.args = process.argv;
        this.args.reverse();
        this.args.pop();
        this.args.pop();
    }
    pop(){
        const res = this.args.pop();
        if(res !== undefined) return res;
        this._errMessage = "Attempt to pop from empty cli stack!";
        return "";
    }
    popFile(){
        const fname = this.pop();
        if(this.hasError) {
            return "";
        }
        try{
            const src = fs.readFileSync(fname, {encoding: 'utf-8'});
            return src;
        }
        catch{
            this._errMessage = `Unable to read file at ${fname}`;
            return "";
        }
    }
    get hasArgs(){
        return this.args.length > 0;
    }
}