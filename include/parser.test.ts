import { BinaryOperator, Expression, Statement, parseExpression, parseProgram } from "./parser.js";

const _let = (name: string, expression: Expression): Statement => ({ kind: "let", name, expression });
const _number = (value: number): Expression => ({ kind: "number", value });
const _boolean = (value: boolean): Expression => ({ kind: "boolean", value });
const _operator = (operator: BinaryOperator, left: Expression, right: Expression): Expression => ({
  kind: "operator",
  operator,
  left,
  right,
});
const _variable = (name: string): Expression => ({ kind: "variable", name });
const _function = (parameters: string[], body: Statement[]): Expression => ({ kind: "function", parameters, body });
const _call = (callee: string, args: Expression[]): Expression => ({ kind: "call", callee, arguments: args });

const _assignment = (name: string, expression: Expression): Statement => ({ kind: "assignment", name, expression });
const _expression = (expression: Expression): Statement => ({ kind: "expression", expression });
const _if = (test: Expression, truePart: Statement[], falsePart: Statement[]): Statement => ({
  kind: "if",
  test,
  truePart,
  falsePart,
});
const _while = (test: Expression, body: Statement[]): Statement => ({
  kind: "while",
  test,
  body,
});
const _print = (expression: Expression): Statement => ({
  kind: "print",
  expression,
});
const _return = (expression: Expression): Statement => ({
  kind: "return",
  expression,
});

test("empty string is empty array", () => {
  expect(parseProgram("")).toEqual([]);
});

test("white space is empty array", () => {
  expect(parseProgram("    ")).toEqual([]);
});

test("rejects keywords for variable names", () => {
  expect(() => parseProgram("let let = x;")).toThrow();
});

test("rejects keyword with assignment", () => {
  expect(() => parseProgram("let = x;")).toThrow();
});

test("rejects keyword as parameter", () => {
  expect(() => parseProgram("function(let) { };")).toThrow();
});

test("trivial let", () => {
  const r = parseProgram("let x = 23;");

  expect(r).toEqual([_let("x", _number(23))]);
});

test("trivial let true", () => {
  const r = parseProgram("let x = true;");

  expect(r).toEqual([_let("x", _boolean(true))]);
});

test("numbers", () => {
  const _num = (x: number) => _expression(_number(x));

  expect(
    parseProgram(`
      1.1;
      Infinity;
      -Infinity;
      -0;
      -2;
      +2;
      0.111;
  `)
  ).toEqual([_num(1.1), _num(Infinity), _num(-Infinity), _num(-0), _num(-2), _num(+2), _num(0.111)]);
});

test("trivial if", () => {
  const r = parseProgram("let x = 10; if (x) { x = 2; } else { x = 4; }");

  expect(r).toEqual([
    _let("x", _number(10)),
    _if(_variable("x"), [_assignment("x", _number(2))], [_assignment("x", _number(4))]),
  ]);
});

test("trivial while", () => {
  const r = parseProgram("let x = 1; while(x) { }");

  expect(r).toEqual([_let("x", _number(1)), _while(_variable("x"), [])]);
});

test("trivial assignment", () => {
  const r = parseProgram("let x = 1; x = x + 1;");

  expect(r).toEqual([_let("x", _number(1)), _assignment("x", _operator("+", _variable("x"), _number(1)))]);
});

test("trivial print", () => {
  const r = parseProgram("print(1 + 2);");

  expect(r).toEqual([_print(_operator("+", _number(1), _number(2)))]);
});

test("arithmetic precedence", () => {
  const r = parseProgram("let x = 1 + 2 * 3;");

  expect(r).toEqual([_let("x", _operator("+", _number(1), _operator("*", _number(2), _number(3))))]);
});

test("logical precedence", () => {
  const r = parseProgram("let x = true || false && true;");

  expect(r).toEqual([_let("x", _operator("||", _boolean(true), _operator("&&", _boolean(false), _boolean(true))))]);
});

test("comparison", () => {
  const r = parseProgram("let x = 1 > 2;");

  expect(r).toEqual([_let("x", _operator(">", _number(1), _number(2)))]);
});

test("subtraction binding", () => {
  const r = parseProgram("let x = 1 - 2 - 3;");

  expect(r).toEqual([_let("x", _operator("-", _operator("-", _number(1), _number(2)), _number(3)))]);
});

test("leading space in program", () => {
  const r = parseProgram("  let x = 1;");

  expect(r).toEqual([_let("x", _number(1))]);
});

test("leading white space in expression", () => {
  const r = parseExpression(" 1 + 2");

  expect(r).toEqual(_operator("+", _number(1), _number(2)));
});

test("left associative multiply", () => {
  const r = parseProgram("let x = 1 + 2 * 3;");

  expect(r).toEqual([_let("x", _operator("+", _number(1), _operator("*", _number(2), _number(3))))]);
});

test("left associative divide", () => {
  const r = parseProgram("let x = 1 + 2 / 3;");

  expect(r).toEqual([_let("x", _operator("+", _number(1), _operator("/", _number(2), _number(3))))]);
});

test("left associative plus minus", () => {
  const r = parseProgram("let x = 1 - 2 + 3;");

  expect(r).toEqual([_let("x", _operator("+", _operator("-", _number(1), _number(2)), _number(3)))]);
});

test("left associative complicated", () => {
  const r = parseProgram("let x = 2 === 3 || 2 - 1 * 2 > 2;");

  expect(r).toEqual([
    _let(
      "x",
      _operator(
        "||",
        _operator("===", _number(2), _number(3)),
        _operator(">", _operator("-", _number(2), _operator("*", _number(1), _number(2))), _number(2))
      )
    ),
  ]);
});

test("function expression and return statement", () => {
  const r = parseProgram("let f = function(a, b) { return a + b; };");

  expect(r).toEqual([_let("f", _function(["a", "b"], [_return(_operator("+", _variable("a"), _variable("b")))]))]);
});

test("function expression with closure", () => {
  const r = parseProgram("let f = function(a, b) { return function() { return a + b; }; };");

  expect(r).toEqual([
    _let(
      "f",
      _function(["a", "b"], [_return(_function([], [_return(_operator("+", _variable("a"), _variable("b")))]))])
    ),
  ]);
});

test("function call", () => {
  const r = parseProgram("let f = function (a, b) { return a + b; }; f(1, 2);");

  expect(r).toEqual([
    _let("f", _function(["a", "b"], [_return(_operator("+", _variable("a"), _variable("b")))])),
    _expression(_call("f", [_number(1), _number(2)])),
  ]);
});

test("rejects invalid", () => {
  const invalid = [
    ";",
    ";;",
    "(",
    "-",
    ")",
    "if",
    "while",
    "print(",
    "'",
    "$",
    "Infinity",
    "1",
    "let f = function {};",
    "if () { } else {}",
    "f(1, 2, );",
    "f(, );",
    "f());",
    "f(~);",
    "0.",
    "0.00+",
    ".00",
    "0 *;",
    "0 < ;",
    "0 > ;",
    "true || ;",
    "true && ;",
    "1 === ;",
    "1 - ;",
    "1 + ;",
  ];
  for (const i of invalid) expect(() => parseProgram(i)).toThrow();
});

test("nested function call", () => {
  expect(parseProgram("f(g(h(1), 1));")).toEqual([
    _expression(_call("f", [_call("g", [_call("h", [_number(1)]), _number(1)])])),
  ]);
});

test("nested function/if", () => {
  expect(
    parseProgram(`
    let f = function () {
      if (true) {
        return 1;
      } else {

      }
    };
  `)
  ).toEqual([_let("f", _function([], [_if(_boolean(true), [_return(_number(1))], [])]))]);
});
