import { parseExpression, parseProgram } from "../include/parser.js";
import { State, interpStatement, interpExpression, interpProgram } from "./interpreter.js";

function expectStateToBe(program: string, state: State) {
  expect(interpProgram(parseProgram(program))).toEqual(state);
}

const PARENT_STATE_KEY = "[[PARENT]]";

describe("interpExpression", () => {
  it("evaluates multiplication with a variable", () => {
    const s: State = { x: 10 };
    const r = interpExpression(s, parseExpression("x * 2"));

    expect(r).toEqual(20);
  });

  it("evaluates with variable in higher scope", () => {
    const s: State = { x: 10, y: 20 };
    const s2: State = {};
    s2[PARENT_STATE_KEY] = s;
    const r = interpExpression(s2, parseExpression("x + y"));
    expect(r).toEqual(30);
  });

  it("evaluates conditional with numbers", () => {
    const r = interpExpression({ x: 10, y: 20 }, parseExpression("x + 10 === y && x + y > 25"));
    expect(r).toEqual(true);
  });

  it("should throw error when dividing by 0", () => {
    expect(() => interpExpression({ x: 10 }, parseExpression("x / 0"))).toThrow();
  });

  it("throws error when doing boolean operations with invalid types", () => {
    expect(() => interpExpression({ x: 10 }, parseExpression("x && x > 10"))).toThrow();
  });

  it("throws error when doing arithmetic operations with invalid types", () => {
    expect(() => interpExpression({ x: true }, parseExpression("x + 10"))).toThrow();
  });

  it("throws error when variable not declared", () => {
    expect(() => interpExpression({}, parseExpression("x + 10"))).toThrow();
  });
});

describe("interpStatement", () => {
  // Tests for interpStatement go here.
  it("should update state with variable declaration and assignment", () => {
    const s: State = {};
    interpStatement(s, parseProgram("let x = 10;")[0]);
    interpStatement(s, parseProgram("x = x + 10;")[0]);
    expect(s).toEqual({ x: 20 });
  });
  it("should print expression", () => {
    const s: State = { x: 10 };
    interpStatement(s, parseProgram("print(x + 10);")[0]);
    interpStatement(s, parseProgram("print(x * 10);")[0]);
  });
});

describe("interpProgram", () => {
  it("handles declarations and reassignment", () => {
    // TIP: Use the grave accent to define multiline strings
    expectStateToBe(
      `      
      let x = 10;
      x = 20;
    `,
      { x: 20 }
    );
  });
  it("Variable should be declared before being used", () => {
    expect(() => interpProgram(parseProgram(`x = 5; let x = 10;`))).toThrow();
  });
  it("handles while loop", () => {
    expectStateToBe(
      `
      let x = 0;
      while (x < 10) {
        x = x + 1;
      }
      `,
      { x: 10 }
    );
  });
  it("Variable declared in inner block will shadow outer block", () => {
    expectStateToBe(
      `
      let x = 0;
      if (x < 10) {
        let x = 5;
        x = x + 1;
      }
      else {
        x = x + 5;
      }
      `,
      { x: 0 }
    );
  });
  it("Variable declared in outer block will only be shadowed after inner block declaration", () => {
    expectStateToBe(
      `
      let x = true;
      if (x) {
        x = false;
        let x = 10;
        x = x + 5;
      }
      else {}
      `,
      { x: false }
    );
  });
});
