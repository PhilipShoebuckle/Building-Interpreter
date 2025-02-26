import assert from "assert";

import { parse } from "./peggyParser.js";

export type BinaryOperator = "+" | "-" | "*" | "/" | "&&" | "||" | ">" | "<" | "===";

export type Expression =
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "operator"; operator: BinaryOperator; left: Expression; right: Expression }

export type Statement =
  | { kind: "let"; name: string; expression: Expression }
  | { kind: "assignment"; name: string; expression: Expression }
  | { kind: "if"; test: Expression; truePart: Statement[]; falsePart: Statement[] }
  | { kind: "while"; test: Expression; body: Statement[] }
  | { kind: "print"; expression: Expression }
  | { kind: "expression"; expression: Expression }
  | { kind: "return"; expression: Expression };


export function parseExpression(expression: string): Expression {
  const result = parse(`${expression};`) as Statement[];
  assert(result.length === 1, "Parse result had more than one statement. Only provide expressions.");
  const expressionAST = result[0];
  assert(
    expressionAST.kind === "expression",
    "Parse result was not an expression statement. Only provide expression constructs."
  );

  return expressionAST.expression;
}

export function parseProgram(program: string): Statement[] {
  return parse(program) as Statement[];
}