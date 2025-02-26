import { Expression, Statement } from "../include/parser.js";

type RuntimeValue = number | boolean;
export type State = { [key: string]: State | RuntimeValue };

const PARENT_STATE_KEY = "[[PARENT]]";

function interpVar(state: State, exp: Expression): RuntimeValue {
  if (exp.kind === "variable" && exp.name in state) return state[exp.name] as RuntimeValue;
  if (PARENT_STATE_KEY in state) return interpVar(state[PARENT_STATE_KEY] as State, exp);
  throw Error("Variable not found");
}

function interpOpNumValue(state: State, exp: Expression): RuntimeValue {
  if (exp.kind !== "operator") throw Error("Non Operator Type Passed to interpOpNumValue");
  const lvalue = interpExpression(state, exp.left);
  const rvalue = interpExpression(state, exp.right);
  if (typeof lvalue === "number" && typeof rvalue === "number") {
    switch (exp.operator) {
      case "+":
        return lvalue + rvalue;
      case "-":
        return lvalue - rvalue;
      case "*":
        return lvalue * rvalue;
      case "/":
        if (rvalue === 0) throw Error("Division by zero is forbidden");
        return lvalue / rvalue;
      case ">":
        return lvalue > rvalue;
      case "<":
        return lvalue < rvalue;
      case "===":
        return lvalue === rvalue;
    }
  }
  throw Error("Arithmetic Operations with Invalid Types");
}

function interpOpBooValue(state: State, exp: Expression): boolean {
  if (exp.kind !== "operator") throw Error("Non Operator Type Passed to interpOpBooValue");
  const lvalue = interpExpression(state, exp.left);
  const rvalue = interpExpression(state, exp.right);
  if (typeof lvalue === "boolean" && typeof rvalue === "boolean") {
    switch (exp.operator) {
      case "&&":
        return lvalue && rvalue;
      case "||":
        return lvalue || rvalue;
    }
  }
  throw Error("Boolean Operations with Invalid Types");
}

function interpOp(state: State, exp: Expression): RuntimeValue {
  if (
    exp.kind === "operator" &&
    (exp.operator === "+" ||
      exp.operator === "-" ||
      exp.operator === "*" ||
      exp.operator === "/" ||
      exp.operator === ">" ||
      exp.operator === "<" ||
      exp.operator === "===")
  )
    return interpOpNumValue(state, exp);
  if (exp.kind === "operator" && (exp.operator === "&&" || exp.operator === "||")) return interpOpBooValue(state, exp);
  throw Error("Invalid Operator Type");
}

export function interpExpression(state: State, exp: Expression): RuntimeValue {
  switch (exp.kind) {
    case "boolean":
      return exp.value;
    case "number":
      return exp.value;
    case "variable":
      return interpVar(state, exp);
    case "operator":
      return interpOp(state, exp);
  }
}

function assign(state: State, stmt: Statement): void {
  if (stmt.kind !== "assignment") throw Error("Non assignment type passed to assign");
  if (stmt.name in state) {
    state[stmt.name] = interpExpression(state, stmt.expression);
    return;
  }
  if (PARENT_STATE_KEY in state) return assign(state[PARENT_STATE_KEY] as State, stmt);
  throw Error("Variable is not declared");
}

function whilestmt(state: State, stmt: Statement): void {
  if (stmt.kind !== "while") throw Error("Non while type passed to whilestmt");
  const s2: State = {};
  s2[PARENT_STATE_KEY] = state;
  function whileHelper(state2: State, stmt: Statement): void {
    if (stmt.kind === "while" && interpExpression(state, stmt.test)) {
      stmt.body.forEach(s => interpStatement(state2, s));
      return whileHelper(state2, stmt);
    }
  }
  return whileHelper(s2, stmt);
}

export function interpStatement(state: State, stmt: Statement): void {
  switch (stmt.kind) {
    case "let":
      if (stmt.name in state) throw Error("Variable can't be redeclared");
      state[stmt.name] = interpExpression(state, stmt.expression);
      break;
    case "assignment":
      assign(state, stmt);
      break;
    case "if":
      const s2: State = {};
      s2[PARENT_STATE_KEY] = state;
      if (typeof interpExpression(state, stmt.test) !== "boolean")
        throw Error("If test expression isn't of boolean type!");
      if (interpExpression(state, stmt.test)) {
        stmt.truePart.forEach(s => interpStatement(s2, s));
      } else {
        stmt.falsePart.forEach(s => interpStatement(s2, s));
      }
      break;
    case "while":
      if (typeof interpExpression(state, stmt.test) !== "boolean")
        throw Error("While test expression isn't of boolean type!");
      whilestmt(state, stmt);
      break;
    case "print":
      console.log(interpExpression(state, stmt.expression));
      break;
  }
}

export function interpProgram(program: Statement[]): State {
  const st: State = {};
  program.forEach(s => interpStatement(st, s));
  return st;
}
