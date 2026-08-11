import { describe, expect, it } from 'vitest'
describe('Mio IDE', () => { it('recognizes a Mio entry point', () => { expect('def void main() {}').toContain('def void main') }) })
