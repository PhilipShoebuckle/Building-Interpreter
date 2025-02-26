{{

function extractOptional(optional, index) {
  return optional ? optional[index] : undefined;
}

function extractList(list, index) {
  return list.map(e => e[index]);
}

function buildNumber(text) {
  return { kind: "number", value: parseFloat(text) };
}

function buildList(head, tail, index) {
  return [head].concat(extractList(tail, index));
}

function buildBinaryExpression(head, tail) {
  return tail.reduce((result, element) => {
    return {
      kind: "operator",
      operator: element[1],
      left: result,
      right: element[3]
    };
  }, head);
}

function optionalList(value) {
  return value ?? [];
}

}}

Start
  = __ program:Program __ { 
      return program;
    }

Program
  = statements:Statements? {
    return optionalList(statements);
  }

Statements
  = head:Statement tail:(__ Statement)* {
      return buildList(head, tail, 1);
    }

// Characters
SourceCharacter
  = .

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"

// White Space

__
  = (WhiteSpace / LineTerminatorSequence)*

EOS
  = __ ";"

// Tokens

ElseToken       = "else"       !IdentifierPart
InfinityToken   = "Infinity"   !IdentifierPart 
FalseToken      = "false"      !IdentifierPart
FunctionToken   = "function"   !IdentifierPart
IfToken         = "if"         !IdentifierPart
LetToken        = "let"        !IdentifierPart
PrintToken      = "print"      !IdentifierPart
ReturnToken     = "return"     !IdentifierPart
TrueToken       = "true"       !IdentifierPart
WhileToken      = "while"      !IdentifierPart

// Identifier

Identifier
  = !ReservedWord name:IdentifierName { return name; }

IdentifierName "identifier"
  = head:IdentifierStart tail:IdentifierPart* {
      return head + tail.join("")
    }

IdentifierStart
  = ASCIILetter
  / "$"
  / "_"

IdentifierPart
  = IdentifierStart
  / ASCIIDigit

ASCIILetter
  = [a-z]i

ASCIIDigit
  = [0-9]

ReservedWord
  = Keyword
  / BooleanLiteral

Keyword
  = ElseToken
  / InfinityToken
  / FunctionToken
  / IfToken
  / LetToken
  / PrintToken
  / ReturnToken
  / WhileToken

// Literals

Literal
  = BooleanLiteral
  / NumericLiteral

BooleanLiteral
  = TrueToken {
      return { kind: "boolean", value: true  };
    }
  / FalseToken {
      return { kind: "boolean", value: false };
    }

NumericLiteral "number"
  = literal:DecimalLiteral !(IdentifierStart / DecimalDigit) {
      return literal;
    }
  / [+-]? InfinityToken {
      return buildNumber(text());
    }

DecimalLiteral
  = DecimalIntegerLiteral "." DecimalDigit+ {
      return buildNumber(text());
    }
  / DecimalIntegerLiteral {
      return buildNumber(text());
    }
  / SignedInteger {
      return buildNumber(text());
    }

DecimalIntegerLiteral
  = "0"
  / NonZeroDigit DecimalDigit*

DecimalDigit
  = [0-9]

NonZeroDigit
  = [1-9]

SignedInteger
  = [+-]? DecimalDigit+

// Expressions

FunctionExpression
  = FunctionToken __ "(" __ params:(ParameterList __)? ")" __ body:Block {
      return { kind: "function", parameters: optionalList(extractOptional(params, 0)), body };
    }

ParameterList
  = head:Identifier tail:(__ "," __ Identifier)* {
      return buildList(head, tail, 3);
    }

AtomicExpression
  = name:Identifier {
      return { kind: "variable", name };
    }
  / Literal
  / "(" __ expression:Expression __ ")" { return expression; }
  / FunctionExpression

CallExpression
  = callee:Identifier __ args:Arguments {
      return { kind: "call", callee, arguments: args };
    }

Arguments
  = "(" __ args:(ArgumentList __)? ")" {
      return optionalList(extractOptional(args, 0));
    }

ArgumentList
  = head:LogicalORExpression tail:(__ "," __ LogicalORExpression)* {
      return buildList(head, tail, 3);
    }

LeftHandSideExpression
  = CallExpression
  / AtomicExpression

MultiplicativeExpression
  = head:LeftHandSideExpression tail:(__ MultiplicativeOperator __ LeftHandSideExpression)* {
      return buildBinaryExpression(head, tail);
    }

MultiplicativeOperator
  = "*"
  / "/"

AdditiveExpression
  = head:MultiplicativeExpression tail:(__ AdditiveOperator __ MultiplicativeExpression)* {
      return buildBinaryExpression(head, tail);
    }

AdditiveOperator
  = "+"
  / "-"

RelationalExpression
  = head:AdditiveExpression tail:(__ RelationalOperator __ AdditiveExpression)* {
      return buildBinaryExpression(head, tail);
    }

RelationalOperator
  = "<"
  / ">"

EqualityExpression
  = head:RelationalExpression tail:(__ EqualityOperator __ RelationalExpression)* {
      return buildBinaryExpression(head, tail);
    }

EqualityOperator
  = "==="

LogicalANDExpression
  = head:EqualityExpression tail:(__ LogicalANDOperator __ EqualityExpression)* {
      return buildBinaryExpression(head, tail);
    }

LogicalANDOperator
  = "&&"

LogicalORExpression
  = head:LogicalANDExpression tail:(__ LogicalOROperator __ LogicalANDExpression)* {
      return buildBinaryExpression(head, tail);
    }

LogicalOROperator
  = "||"

Expression
  = LogicalORExpression 

// Statements

Statement
  = LetStatement
  / AssignmentStatement
  / IfStatement
  / WhileStatement
  / ReturnStatement
  / PrintStatement
  / ExpressionStatement

Block
  = "{" __ body:(Statements __)? "}" {
      return optionalList(extractOptional(body, 0));
    }

LetStatement
  = LetToken __ name:Identifier __ "=" !"=" __ expression:Expression EOS {
      return { kind: "let", name, expression };
    }

AssignmentStatement
  = name:Identifier __ "=" !"=" __ expression:Expression EOS {
      return { kind: "assignment", name, expression };
    }

ExpressionStatement
  = expression:Expression EOS {
      return { kind: "expression", expression };
    }

IfStatement
  = IfToken __ "(" __ test:Expression __ ")" __ truePart:Block __ ElseToken __ falsePart:Block {
      return { kind: "if", test, truePart, falsePart };
    }

PrintStatement
  = PrintToken __ "(" __ expression:Expression __ ")" EOS {
    return { kind: "print", expression };
  }

WhileStatement
  = WhileToken __ "(" __ test:Expression __ ")" __ body:Block {
      return { kind: "while", test: test, body: body };
    }

ReturnStatement
  = ReturnToken __ expression:Expression EOS {
      return { kind: "return", expression };
    }
