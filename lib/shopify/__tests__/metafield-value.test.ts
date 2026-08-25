import { describe, it, expect } from 'vitest'
import { formatMetafieldValue } from '../metafield-value'

describe('formatMetafieldValue — scalar text fields', () => {
  it('returns a single_line_text_field value unchanged', () => {
    expect(formatMetafieldValue('Nitrile')).toBe('Nitrile')
  })

  it('trims surrounding whitespace', () => {
    expect(formatMetafieldValue('  3.5 mil  ')).toBe('3.5 mil')
  })

  it('preserves internal punctuation and units', () => {
    expect(formatMetafieldValue('10mL')).toBe('10mL')
    expect(formatMetafieldValue('25G x 1"')).toBe('25G x 1"')
  })
})

describe('formatMetafieldValue — nothing to show', () => {
  // A spec row must never appear with an empty or meaningless cell.
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace only', '   '],
    ['tab/newline only', '\t\n '],
  ])('returns null for %s', (_label, input) => {
    expect(formatMetafieldValue(input)).toBeNull()
  })

  it('returns null for an empty JSON array rather than rendering []', () => {
    expect(formatMetafieldValue('[]')).toBeNull()
  })

  it('returns null for an array whose entries are all blank', () => {
    expect(formatMetafieldValue('["", "   "]')).toBeNull()
  })

  it('never returns an empty string, which would render as a blank row', () => {
    for (const input of ['', '  ', '[]', '[""]', null, undefined]) {
      const out = formatMetafieldValue(input)
      expect(out === null || out.length > 0).toBe(true)
    }
  })
})

describe('formatMetafieldValue — list.single_line_text_field', () => {
  // These five keys are list-typed on this store: custom.type,
  // custom.other_features, custom.tests_for, custom.detectable_drugs,
  // custom.adulterants. Rendering .value raw would print JSON to the customer.
  it('joins a multi-entry list with ", " instead of printing JSON', () => {
    expect(formatMetafieldValue('["Microalbumin","Creatinine"]')).toBe('Microalbumin, Creatinine')
  })

  it('unwraps a single-entry list to a bare value', () => {
    expect(formatMetafieldValue('["Exam"]')).toBe('Exam')
    expect(formatMetafieldValue('["Luer-Lock"]')).toBe('Luer-Lock')
  })

  it('never leaks brackets or quotes into the output', () => {
    const out = formatMetafieldValue('["Amphetamine (AMP)","Barbiturate (BAR)","Cocaine (COC)"]')
    expect(out).toBe('Amphetamine (AMP), Barbiturate (BAR), Cocaine (COC)')
    expect(out).not.toMatch(/[[\]"]/)
  })

  it('preserves the merchant-chosen order', () => {
    expect(formatMetafieldValue('["Zinc","Alpha","Middle"]')).toBe('Zinc, Alpha, Middle')
  })

  it('drops blank entries so a stray empty row cannot produce a trailing separator', () => {
    expect(formatMetafieldValue('["Nitrile","","Powder-Free"]')).toBe('Nitrile, Powder-Free')
    expect(formatMetafieldValue('["Nitrile",""]')).toBe('Nitrile')
  })

  it('trims entries individually', () => {
    expect(formatMetafieldValue('["  Sterile  ","Latex-Free"]')).toBe('Sterile, Latex-Free')
  })
})

describe('formatMetafieldValue — malformed input degrades rather than throwing', () => {
  it('falls back to the raw text when a bracketed value is not valid JSON', () => {
    // Real merchant copy, not a list: must survive rather than be discarded.
    expect(formatMetafieldValue('[see package insert]')).toBe('[see package insert]')
  })

  it('falls back to the raw text for valid JSON that is not an array', () => {
    expect(formatMetafieldValue('{"a":1}')).toBe('{"a":1}')
  })

  it('does not attempt to parse ordinary text that contains a bracket', () => {
    expect(formatMetafieldValue('Size 7 [medium]')).toBe('Size 7 [medium]')
  })

  it('stringifies non-string array entries rather than dropping them', () => {
    expect(formatMetafieldValue('[3,5,7]')).toBe('3, 5, 7')
  })
})
