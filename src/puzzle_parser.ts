
export interface PuzzleRun{
    inrack: number[];
    outrack: number[];
    cycles: number;
}

export interface Puzzle{
    name: string;
    description: string;
    runs: PuzzleRun[];
    sizeGoal: number;
    impl: string;
}

class JsonObj{
    data: any;
    private _errMessage = "";
    private setError(message: string){
        if(!this.hasError) this._errMessage = message;
    }
    get hasError(){return this._errMessage.length > 0;}
    get errMessage(){return this._errMessage;}
    constructor(data: any){
        this.data = data;
    }
    getValue(key: string){
        const val = this.data[key];
        if(val === undefined){
            this.setError(`No key '${key}' in object`);
            return undefined;
        }
        return val;
    }
    getString(key: string){
        const val = this.getValue(key);
        if(val === undefined) return "";
        else if(typeof val !== "string"){
            this.setError(`key '${key}' references a ${typeof val}, not a string`);
            return "";
        }
        return val;
    }
    getNumber(key: string){
        const val = this.getValue(key);
        if(val === undefined) return 0;
        else if(typeof val !== "number"){
            this.setError(`key '${key}' references a ${typeof val}, not a number`);
            return 0;
        }
        return val;
    }
    getArray(key: string): JsonObj[]{
        const val = this.getValue(key);
        if(val === undefined) return [];
        else if(!Array.isArray(val)){
            this.setError(`key '${key}' references a ${typeof val}, not an array`);
            return [];
        }
        return val.map(a => new JsonObj(a));
    }
}

export function puzzleParser(puzzleSrc: string): Puzzle | undefined{
    const puzzle = new JsonObj(JSON.parse(puzzleSrc));
    const name = puzzle.getString("name");
    const description = puzzle.getString("description");
    const impl = puzzle.getString("impl");
    const sizeGoal = puzzle.getNumber("size_goal");
    const runs = puzzle.getArray("runs").map((r):PuzzleRun => {
        // getting lazy
        
        const inrack = r.getArray("inbox").map(j => +j.data);
        const outrack = r.getArray("outbox").map(j => +j.data);
        const cycles = r.getNumber("cycles");
        return {inrack, outrack, cycles};
    });
    if(puzzle.hasError) {
        console.log(puzzle.errMessage);
        return;
    }
    return{name, description, runs, sizeGoal, impl};
}