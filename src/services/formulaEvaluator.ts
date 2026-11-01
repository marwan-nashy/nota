import { DatabaseColumn, DatabaseRow } from '../types';

/**
 * Safe, zero-eval formula evaluator for Nota Database columns
 * Supports:
 * - prop("Column Name") or prop("c-id") or Column Name
 * - Basic arithmetic: +, -, *, /, %, ^
 * - Math functions: round, floor, ceil, abs, min, max, sqrt
 * - Logical / string functions: if(condition, thenVal, elseVal), concat(...)
 */

export function evaluateFormula(
  formula: string,
  row: DatabaseRow,
  columns: DatabaseColumn[]
): string | number {
  if (!formula || !formula.trim()) return '';

  try {
    let expr = formula.trim();

    // Map column names to values
    const colNameMap: Record<string, any> = {};
    const colIdMap: Record<string, any> = {};

    for (const col of columns) {
      const val = row.cells[col.id];
      const numVal = typeof val === 'number' ? val : parseFloat(val);
      const cleanVal = !isNaN(numVal) ? numVal : val !== undefined && val !== null ? val : 0;
      colNameMap[col.name.toLowerCase()] = cleanVal;
      colIdMap[col.id.toLowerCase()] = cleanVal;
    }

    // Replace prop("...") or prop('...')
    expr = expr.replace(/prop\s*\(\s*["']([^"']+)["']\s*\)/gi, (_, colRef) => {
      const key = colRef.toLowerCase().trim();
      if (colNameMap[key] !== undefined) return JSON.stringify(colNameMap[key]);
      if (colIdMap[key] !== undefined) return JSON.stringify(colIdMap[key]);
      return '0';
    });

    // Replace raw column names if written directly e.g. "Price * Quantity"
    for (const col of columns) {
      if (col.type !== 'formula') {
        const regex = new RegExp(`\\b${escapeRegExp(col.name)}\\b`, 'gi');
        expr = expr.replace(regex, () => {
          const val = colNameMap[col.name.toLowerCase()];
          return typeof val === 'number' ? String(val) : JSON.stringify(val);
        });
      }
    }

    // Simple built-in function replacements for safe computation
    const result = computeExpression(expr);
    if (typeof result === 'number') {
      return Number.isInteger(result) ? result : Math.round(result * 100) / 100;
    }
    return result;
  } catch (err) {
    return '#ERR!';
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursive descent safe mathematical expression solver
 */
function computeExpression(expr: string): number | string {
  let pos = 0;

  function peek(): string {
    while (pos < expr.length && /\s/.test(expr[pos])) pos++;
    return expr[pos] || '';
  }

  function get(): string {
    const ch = peek();
    pos++;
    return ch;
  }

  function parsePrimary(): number | string {
    const ch = peek();

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = get();
      let str = '';
      while (pos < expr.length && expr[pos] !== quote) {
        str += expr[pos];
        pos++;
      }
      get(); // closing quote
      return str;
    }

    // Parentheses
    if (ch === '(') {
      get(); // consume '('
      const val = parseExpression();
      if (peek() === ')') get();
      return val;
    }

    // Number
    if (/[0-9.]/.test(ch) || (ch === '-' && /[0-9.]/.test(expr[pos + 1] || ''))) {
      let numStr = get();
      while (/[0-9.]/.test(peek())) {
        numStr += get();
      }
      return parseFloat(numStr);
    }

    // Function call (e.g. round, if, min, max, concat, sqrt)
    if (/[a-zA-Z]/.test(ch)) {
      let name = '';
      while (/[a-zA-Z0-9_]/.test(peek())) {
        name += get();
      }
      name = name.toLowerCase();

      if (peek() === '(') {
        get(); // '('
        const args: (number | string)[] = [];
        if (peek() !== ')') {
          while (true) {
            args.push(parseExpression());
            if (peek() === ',') {
              get();
            } else {
              break;
            }
          }
        }
        if (peek() === ')') get();

        switch (name) {
          case 'round':
            return Math.round(Number(args[0]) || 0);
          case 'floor':
            return Math.floor(Number(args[0]) || 0);
          case 'ceil':
            return Math.ceil(Number(args[0]) || 0);
          case 'abs':
            return Math.abs(Number(args[0]) || 0);
          case 'sqrt':
            return Math.sqrt(Number(args[0]) || 0);
          case 'min':
            return Math.min(...args.map((a) => Number(a) || 0));
          case 'max':
            return Math.max(...args.map((a) => Number(a) || 0));
          case 'sum':
            return args.reduce((acc: number, curr) => acc + (Number(curr) || 0), 0);
          case 'concat':
            return args.join('');
          case 'if':
            return args[0] ? args[1] : args[2];
          default:
            return Number(args[0]) || 0;
        }
      }
    }

    return 0;
  }

  function parseFactor(): number | string {
    let left = parsePrimary();
    while (peek() === '^') {
      get();
      const right = parsePrimary();
      left = Math.pow(Number(left) || 0, Number(right) || 0);
    }
    return left;
  }

  function parseTerm(): number | string {
    let left = parseFactor();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = get();
      const right = parseFactor();
      if (op === '*') left = (Number(left) || 0) * (Number(right) || 0);
      else if (op === '/') left = (Number(right) !== 0 ? (Number(left) || 0) / Number(right) : 0);
      else if (op === '%') left = (Number(left) || 0) % (Number(right) || 1);
    }
    return left;
  }

  function parseExpression(): number | string {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = get();
      const right = parseTerm();
      if (typeof left === 'string' || typeof right === 'string') {
        left = String(left) + String(right);
      } else {
        if (op === '+') left = (Number(left) || 0) + (Number(right) || 0);
        else if (op === '-') left = (Number(left) || 0) - (Number(right) || 0);
      }
    }
    return left;
  }

  return parseExpression();
}

/**
 * Compute column footer rollups (Sum, Average, Count, Min, Max)
 */
export function calculateRollup(
  column: DatabaseColumn,
  rows: DatabaseRow[]
): { label: string; value: string | number } {
  const rollup = column.rollup || 'none';
  if (rollup === 'none') return { label: '', value: '' };

  if (rollup === 'count') {
    return { label: 'Count', value: rows.length };
  }

  const values: number[] = [];
  for (const r of rows) {
    let val = r.cells[column.id];
    if (column.type === 'formula' && column.formula) {
      val = evaluateFormula(column.formula, r, [column]);
    }
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (!isNaN(num)) values.push(num);
  }

  if (values.length === 0) return { label: rollup.toUpperCase(), value: '-' };

  switch (rollup) {
    case 'sum': {
      const sum = values.reduce((acc, v) => acc + v, 0);
      return { label: 'Sum', value: Math.round(sum * 100) / 100 };
    }
    case 'avg': {
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = sum / values.length;
      return { label: 'Avg', value: Math.round(avg * 100) / 100 };
    }
    case 'min': {
      return { label: 'Min', value: Math.min(...values) };
    }
    case 'max': {
      return { label: 'Max', value: Math.max(...values) };
    }
    default:
      return { label: '', value: '' };
  }
}
