# Liquor

Liquor is a templating engine for node. It's very lightweight. It's essentially
embedded javascript with some shorthand significant whitespace notation
available. This is to discourage use of raw code and make templates look nicer.

## Usage

Backticks are used for evaluation, while `#{}` is used for interpolation.

``` html
?:data
  <table>
    <tr>
      @:col
        <td>#{this}</td>
    </tr>
    @:data
      <tr>
        <td>#{this.color}</td>
        <td>#{this.animal}</td>
      </tr>
  </table>

!:data
  <div>
    ?:error
      <p>Sorry, there was a problem: #{error}.</p>
      <p>Please, try again!</p>
    !:error
      <p>Sorry, no error message.</p>
  </div>
```

Is essentially shorthand for:

``` html
`if (typeof data !== 'undefined' && data) {`
  <table>
    <tr>
      `each(col, function() {`
        <td>#{this}</td>
      `})`
    </tr>
    `each(data, function() {`
      <tr>
        <td>#{this.color}</td>
        <td>#{this.animal}</td>
      </tr>
    `})`
  </table>
`} else {`
  <div>
    `if (typeof error !== 'undefined' && error) {`
      <p>Sorry, there was a problem: #{error}.</p>
      <p>Please, try again!</p>
    `} else {`
      <p>Sorry, no error message.</p>
    `}`
  </div>
`}`
```

``` html
`/* liquor also exposes an "each" helper function */`
`/* it is the same one used internally for @ statements */`
`if (messages)
  each(messages, function(message, key) {`
    <p>#{key}: #{message.content}</p>
  `})`
```

If you're worried about the notorious "undefined" problem with variables
expressed in raw evaluation of JS, you can access them as properties on a
variable called `$`, which exists within the context of a template, and holds
all of the locals and helpers:

e.g.

``` html
`if ($.messages) {` <p>#{JSON.stringify(messages)}</p> `}`
```

## License
(c) Copyright 2011-2012, Christopher Jeffrey. See LICENSE for more info.
