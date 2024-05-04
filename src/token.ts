export type TokenType = 'op' | 'label' | 'number' | 'register';

export interface Token{
    type: TokenType;
    literal: string;
    pos: number;
}