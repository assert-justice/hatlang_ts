
export class Cli{
    args: string[];
    hasError = false;
    constructor(){
        this.args = process.argv;
        this.args.reverse();
        this.args.pop();
        this.args.pop();
    }
    pop(){
        const res = this.args.pop();
        if(res !== undefined) return res;
        this.hasError = true;
        return "";
    }
    get hasArgs(){
        return this.args.length > 0;
    }
}