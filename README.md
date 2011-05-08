# Liquor - a templating engine minus the code

A word of warning: Liquor's idea of a template is that it is separate from 
the code. Liquor follows the philosophy that if you're executing 
raw code within your templates, you might be doing something wrong. This 
is specifically for people who think massive amounts of logic do not belong 
in templates. Liquor doesn't allow for any raw evaluation of code. It tries 
to stay as declarative as possible, while remaining convenient. This is my 
personal templating engine, things may change depending on how I use it.

Liquor is also for nerds who care about their markup to a slightly absurd degree:
it will maintain whitespace, clean up empty lines, etc. This is all to make 
sure your "style" of markup is preserved.

* * *

This engine has 3 capabilities: __variable interpolation__, __conditionals__, 
and __collection traversal__. Liquor tries to have a very concise notation for 
expressing these statements.

## Variable Interpolation

A variable is represented with an ampersand (`&`) followed by a 
colon (`:`), followed by the variable name and a semicolon (`;`). Similar to an 
HTML entity or character refernce, only with a colon.

    &:data;

Variable names can make use of any character except whitespace characters, 
semicolon, and hash/pound (`#`). 

Collection variables can access their members with a hash (`#`).

    &:obj#key;

However, you can also access an object's members the regular JS way:

    &:obj.key;

## Conditionals

A conditional statement is denoted by curly braces, `{` and `}`.

The contents of a conditional will __only__ be included in the output if every 
variable contained within the top level of the containing conditional has a 
truthy value. However, truthy and falsey values differ from those of JS:
  - Falsey values include `false`, `null`, (and `undefined`, `NaN`).
  - This means the empty string (`''`) and zero (`0`) are both truthy.

Variables that are booleans (and nulls or any other non-displayable value) will 
not be displayed in any way in the output, however they are taken into account 
when determining the conditional's outcome.

    var hello = '<div>{<p>&:hello;</p>}</div>';
  
    liquor.compile(hello)({ hello: 'hello world' });

Outputs:

    <div><p>hello world!</p></div>

A variable can be forced into a boolean context with a bang `!`. If this is 
done, the position of the variable within the conditional does not make any 
difference.

    <div>{!!&:num;<p>hello world!</p>}</div>
    
    liquor.compile(hello)({ num: 250 });

Outputs:

    <div><p>hello world!</p></div>

Whereas using a single exclamation point to check whether the variable is 
false would yield (in this case):

    <div></div>

## Collection Traversal

To traverse through a collection, the contents of the desired output must be 
contained in a wrapper, as demonstrated below. Within the statement,
the context (`this`) refers to the value/subject of the current iteration. 

Note: Liquor will try to duplicate the surrounding whitespace to make things 
look pretty when producing the output of a collection traversal.

    <table>
      <tr><td>&col[0];</td><td>&col[1];</td></tr>
      :data[<tr>
        <td>&:this#color;</td>
        <td>&:this#animal;</td>
      </tr>];
    </table>
    
    liquor.compile(table)({
      col: ['color', 'animal'],
      data: [
        { color: 'brown', animal: 'bear' },
        { color: 'black', animal: 'cat' },
        { color: 'white', animal: 'horse' }
      ]
    });

The above will output:

    <table>
      <tr><td>color</td><td>animal</td></tr>
      <tr>
        <td>brown</td>
        <td>bear</td>
      </tr>
      <tr>
        <td>black</td>
        <td>cat</td>
      </tr>
      <tr>
        <td>white</td>
        <td>horse</td>
      </tr>
    </table>
