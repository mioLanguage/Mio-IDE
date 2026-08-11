import { StreamLanguage, type StreamParser } from '@codemirror/language'

const declarations = /^(?:var|const|static|operator|struct|enum|union|class|namespace|public|private|protected|virtual|override|template|typename)\b/
const control = /^(?:if|else|elif|while|for|break|continue|goto|return|this)\b/
const directives = /^(?:import|extern|macro)\b/
const types = /^(?:i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|usize|isize|f32|f64|bool|char|void)\b/

const mioParser: StreamParser<null> = {
  startState: () => null,
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.peek() === '#') { stream.skipToEnd(); return 'comment' }
    if (stream.match(/^@(if|elif|else|end)\b/)) return 'keyword'
    if (stream.match(directives) || stream.match(declarations) || stream.match(control)) return 'keyword'
    if (stream.match(types)) return 'typeName'
    if (stream.match(/^(?:true|false)\b/)) return 'bool'
    if (stream.match(/^0[xX][0-9a-fA-F]+\b/) || stream.match(/^\d+\.\d+\b/) || stream.match(/^\d+\b/)) return 'number'
    if (stream.peek() === '"' || stream.peek() === "'") {
      const quote = stream.next()
      let escaped = false
      while (!stream.eol()) {
        const char = stream.next()
        if (char === quote && !escaped) break
        escaped = char === '\\' && !escaped
        if (char !== '\\') escaped = false
      }
      return 'string'
    }
    if (stream.match(/^(?:\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|==|!=|<=|>=|&&|\|\||::|->|\.\.\.|[+\-*\/%<>&|^~!=.])/)) return 'operator'
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) return 'variableName'
    stream.next()
    return null
  },
  languageData: {
    commentTokens: { line: '#' },
    closeBrackets: { brackets: ['(', '[', '{', "'", '"'] }
  }
}

export const mioLanguage = StreamLanguage.define(mioParser)
