const makeTool = (id, title, description, run, keywords, options = {}) => ({
  categoryId: options.categoryId || 'utilities',
  id,
  title,
  desc: description,
  tag: options.tag || 'ADVANCED',
  path: `/tools/${id}`,
  inputLabel: options.inputLabel || 'Values',
  placeholder: options.placeholder || 'Enter values separated by commas.',
  inputMode: 'text',
  fields: options.fields || [],
  requiresInput: options.requiresInput !== false,
  run,
  assistantMatch: options.assistantMatch,
  keywords: keywords || ''
});

const numbers = (input, count, label = 'Enter') => {
  const values = input.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  if (values.length < count || values.some(value => !Number.isFinite(value))) {
    throw new Error(`${label} ${count} finite number${count === 1 ? '' : 's'}, separated by commas.`);
  }
  return values;
};

const positive = (value, label) => {
  if (!(value > 0) || !Number.isFinite(value)) throw new Error(`${label} must be greater than zero.`);
  return value;
};

const formatNumber = value => {
  if (!Number.isFinite(value)) throw new Error('This calculation is outside the finite numeric range.');
  return Number(value.toPrecision(12)).toString();
};

const parseExpression = expression => {
  if (expression.length > 256) throw new Error('Expressions are limited to 256 characters.');
  const tokens = expression.match(/\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|([a-z]+)|(.))/gi) || [];
  const values = tokens.map(token => token.trim()).filter(Boolean);
  let position = 0;
  const peek = () => values[position];
  const take = () => values[position++];
  const constants = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
  const functions = {
    abs: Math.abs, sqrt: Math.sqrt, cbrt: Math.cbrt, sin: Math.sin, cos: Math.cos,
    tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp,
    ln: Math.log, log: Math.log10, log2: Math.log2, floor: Math.floor,
    ceil: Math.ceil, round: Math.round, trunc: Math.trunc
  };
  const parsePrimary = () => {
    const token = take();
    if (token === '(') {
      const result = parseSum();
      if (take() !== ')') throw new Error('Missing closing parenthesis.');
      return result;
    }
    if (/^(?:\d|\.)/.test(token || '')) return Number(token);
    if (/^[a-z]+$/i.test(token || '')) {
      const name = token.toLowerCase();
      if (peek() === '(') {
        take();
        const args = [parseSum()];
        while (peek() === ',') {
          take();
          args.push(parseSum());
        }
        if (take() !== ')') throw new Error(`Missing closing parenthesis after ${name}().`);
        if (name === 'min' || name === 'max') return Math[name](...args);
        if (name === 'pow' && args.length === 2) return Math.pow(...args);
        if (name === 'atan2' && args.length === 2) return Math.atan2(...args);
        if (name === 'hypot') return Math.hypot(...args);
        if (args.length !== 1 || !functions[name]) throw new Error(`Unknown function or argument count: ${name}().`);
        return functions[name](args[0]);
      }
      if (Object.hasOwn(constants, name)) return constants[name];
      throw new Error(`Unknown constant: ${name}. Use pi, e, or tau.`);
    }
    throw new Error(`Unexpected token: ${token || 'end of expression'}.`);
  };
  const parsePower = () => {
    let value = parsePrimary();
    if (peek() === '^') {
      take();
      value **= parseUnary();
    }
    return value;
  };
  const parseUnary = () => {
    if (peek() === '+') {
      take();
      return parseUnary();
    }
    if (peek() === '-') {
      take();
      return -parseUnary();
    }
    let value = parsePower();
    while (peek() === '!') {
      take();
      if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error('Factorial requires a whole number from 0 to 170.');
      for (let factor = value - 1; factor > 1; factor -= 1) value *= factor;
    }
    return value;
  };
  const parseProduct = () => {
    let value = parseUnary();
    while (peek() === '*' || peek() === '/') {
      const operator = take();
      const right = parseUnary();
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  };
  const parseSum = () => {
    let value = parseProduct();
    while (peek() === '+' || peek() === '-') {
      const operator = take();
      const right = parseProduct();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };
  if (!values.length) throw new Error('Enter a mathematical expression.');
  const result = parseSum();
  if (position !== values.length) throw new Error(`Unexpected token: ${values[position]}.`);
  if (!Number.isFinite(result)) throw new Error('The result is undefined or outside the finite numeric range.');
  return result;
};

const gcd = (left, right) => {
  let a = Math.abs(Math.trunc(left));
  let b = Math.abs(Math.trunc(right));
  while (b) [a, b] = [b, a % b];
  return a;
};

const mathTools = [
  makeTool('scientific-expression-calculator', 'Scientific Expression Calculator', 'Safely evaluate arithmetic, powers, factorials, constants, and common scientific functions without executing code.', input => formatNumber(parseExpression(input)), 'math calculate evaluate arithmetic scientific expression formula factorial powers sqrt sin cos logarithm pi', { assistantMatch: /\b(?:calculate|evaluate|solve)\s+(?=[+\-(\d.])|\bwhat is\s+(?=[+\-(\d.])|\bsquare root of\b/i, placeholder: 'Examples: sqrt(81) + 2^3, sin(pi/2), 5!' }),
  makeTool('quadratic-equation-solver', 'Quadratic Equation Solver', 'Solve ax² + bx + c = 0 and report real or complex roots and the discriminant.', input => {
    const [a, b, c] = numbers(input, 3);
    if (a === 0) throw new Error('The coefficient a cannot be zero.');
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) return `Discriminant: ${formatNumber(discriminant)}\nx₁: ${formatNumber((-b + Math.sqrt(discriminant)) / (2 * a))}\nx₂: ${formatNumber((-b - Math.sqrt(discriminant)) / (2 * a))}`;
    const real = -b / (2 * a);
    const imaginary = Math.sqrt(-discriminant) / Math.abs(2 * a);
    return `Discriminant: ${formatNumber(discriminant)}\nx₁: ${formatNumber(real)} + ${formatNumber(imaginary)}i\nx₂: ${formatNumber(real)} - ${formatNumber(imaginary)}i`;
  }, 'quadratic equation polynomial roots discriminant'),
  makeTool('factorial-calculator', 'Factorial Calculator', 'Calculate n! for whole numbers from 0 through 170.', input => {
    const [value] = numbers(input, 1);
    if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error('Enter a whole number from 0 to 170.');
    let result = 1;
    for (let factor = 2; factor <= value; factor += 1) result *= factor;
    return String(result);
  }, 'factorial n! permutations combinatorics'),
  makeTool('prime-factorization-calculator', 'Prime Factorization Calculator', 'Find the prime factorization of a positive whole number up to 9 quadrillion.', input => {
    const [value] = numbers(input, 1);
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('Enter a positive safe whole number.');
    let remaining = value;
    const factors = [];
    for (let divisor = 2; divisor * divisor <= remaining; divisor += divisor === 2 ? 1 : 2) {
      let exponent = 0;
      while (remaining % divisor === 0) {
        remaining /= divisor;
        exponent += 1;
      }
      if (exponent) factors.push(exponent === 1 ? `${divisor}` : `${divisor}^${exponent}`);
    }
    if (remaining > 1) factors.push(String(remaining));
    return `${value} = ${factors.join(' × ')}`;
  }, 'prime factorization factors divisors integer'),
  makeTool('gcd-lcm-calculator', 'GCD & LCM Calculator', 'Calculate the greatest common divisor and least common multiple of two whole numbers.', input => {
    const [a, b] = numbers(input, 2);
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || (!a && !b)) throw new Error('Enter two safe whole numbers, not both zero.');
    const divisor = gcd(a, b);
    return `GCD: ${divisor}\nLCM: ${formatNumber(Math.abs(a / divisor * b))}`;
  }, 'greatest common divisor least common multiple gcd lcm'),
  makeTool('statistics-summary-calculator', 'Statistics Summary Calculator', 'Calculate count, sum, mean, median, range, and population/sample standard deviation.', input => {
    const values = numbers(input, 1, 'Enter');
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return `Count: ${values.length}\nSum: ${formatNumber(values.reduce((sum, value) => sum + value, 0))}\nMean: ${formatNumber(mean)}\nMedian: ${formatNumber(median)}\nMin: ${sorted[0]}\nMax: ${sorted.at(-1)}\nRange: ${formatNumber(sorted.at(-1) - sorted[0])}\nPopulation standard deviation: ${formatNumber(Math.sqrt(variance))}\nSample standard deviation: ${values.length > 1 ? formatNumber(Math.sqrt(variance * values.length / (values.length - 1))) : 'Requires at least two values'}`;
  }, 'mean median mode statistics standard deviation variance average data'),
  makeTool('permutations-combinations-calculator', 'Permutations & Combinations Calculator', 'Calculate ordered permutations nPr and unordered combinations nCr for valid whole numbers up to 170.', input => {
    const [n, r] = numbers(input, 2);
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 170) throw new Error('Use whole numbers with 0 ≤ r ≤ n ≤ 170.');
    let combination = 1;
    for (let index = 1; index <= r; index += 1) combination = combination * (n - index + 1) / index;
    let permutation = 1;
    for (let index = 0; index < r; index += 1) permutation *= n - index;
    return `nPr: ${formatNumber(permutation)}\nnCr: ${formatNumber(combination)}`;
  }, 'permutation combination nPr nCr binomial'),
  makeTool('percentage-change-calculator', 'Percentage Change Calculator', 'Calculate absolute and percent change between an original and a new value.', input => {
    const [original, next] = numbers(input, 2);
    if (original === 0) throw new Error('The original value cannot be zero for percentage change.');
    return `Change: ${formatNumber(next - original)}\nPercentage change: ${formatNumber((next - original) / Math.abs(original) * 100)}%`;
  }, 'percentage percent increase decrease change growth'),
  makeTool('compound-interest-calculator', 'Compound Interest Calculator', 'Calculate compound growth, interest earned, and final balance with regular contributions.', (input, options) => {
    const [principal, annualRate, years] = numbers(input, 3);
    if (principal < 0 || years < 0 || annualRate <= -100) throw new Error('Use a non-negative principal and duration, and an annual rate greater than -100%.');
    const periods = Number(options.periods);
    const contributions = Number(options.contribution) || 0;
    if (!Number.isInteger(periods) || periods < 1 || periods > 365) throw new Error('Compounding periods must be a whole number from 1 to 365 per year.');
    if (contributions < 0) throw new Error('Regular contribution cannot be negative.');
    const rate = annualRate / 100 / periods;
    const count = years * periods;
    const growth = (1 + rate) ** count;
    const balance = principal * growth + (rate ? contributions * (growth - 1) / rate : contributions * count);
    return `Final balance: ${formatNumber(balance)}\nInterest earned: ${formatNumber(balance - principal - contributions * count)}\nTotal contributions: ${formatNumber(contributions * count)}`;
  }, 'compound interest investment savings returns APY', { fields: [{ name: 'periods', label: 'Compounds per year', type: 'number', defaultValue: '12' }, { name: 'contribution', label: 'Contribution per period (optional)', type: 'number', defaultValue: '0' }] }),
  makeTool('loan-payment-calculator', 'Loan Payment Calculator', 'Estimate fixed monthly payment, total repayment, and interest for an amortizing loan.', input => {
    const [principal, annualRate, years] = numbers(input, 3);
    if (principal <= 0 || annualRate < 0 || years <= 0 || years > 100) throw new Error('Principal and duration must be positive; rate cannot be negative; duration is limited to 100 years.');
    const months = years * 12;
    const monthlyRate = annualRate / 1200;
    const payment = monthlyRate ? principal * monthlyRate / (1 - (1 + monthlyRate) ** -months) : principal / months;
    return `Monthly payment: ${formatNumber(payment)}\nTotal repayment: ${formatNumber(payment * months)}\nTotal interest: ${formatNumber(payment * months - principal)}\nPayments: ${months}`;
  }, 'loan mortgage monthly payment amortization interest'),
  makeTool('simple-interest-calculator', 'Simple Interest Calculator', 'Calculate simple interest and the final balance from principal, annual rate, and years.', input => {
    const [principal, rate, years] = numbers(input, 3);
    if (principal < 0 || rate < 0 || years < 0) throw new Error('Values cannot be negative.');
    const interest = principal * rate / 100 * years;
    return `Simple interest: ${formatNumber(interest)}\nFinal balance: ${formatNumber(principal + interest)}`;
  }, 'simple interest principal rate time'),
  makeTool('bill-split-calculator', 'Bill Split & Tip Calculator', 'Split a bill evenly and calculate tip and per-person total.', input => {
    const [bill, tipPercent, people] = numbers(input, 3);
    if (bill < 0 || tipPercent < 0 || !Number.isInteger(people) || people < 1) throw new Error('Use a non-negative bill and tip, and a positive whole number of people.');
    const tip = bill * tipPercent / 100;
    return `Tip: ${formatNumber(tip)}\nTotal: ${formatNumber(bill + tip)}\nPer person: ${formatNumber((bill + tip) / people)}`;
  }, 'split bill tip gratuity per person restaurant'),
  makeTool('discount-price-calculator', 'Discount Price Calculator', 'Calculate a sale price, savings, and final price after stacked discounts.', (input, options) => {
    const [price, discount] = numbers(input, 2);
    const secondDiscount = Number(options.secondDiscount) || 0;
    if (price < 0 || discount < 0 || discount > 100 || secondDiscount < 0 || secondDiscount > 100) throw new Error('Price must be non-negative and discounts must be from 0 to 100%.');
    const finalPrice = price * (1 - discount / 100) * (1 - secondDiscount / 100);
    return `Final price: ${formatNumber(finalPrice)}\nYou save: ${formatNumber(price - finalPrice)}\nEffective discount: ${formatNumber((1 - finalPrice / (price || 1)) * 100)}%`;
  }, 'sale discount savings markdown price', { fields: [{ name: 'secondDiscount', label: 'Additional discount (%)', type: 'number', defaultValue: '0' }] }),
  makeTool('sales-tax-calculator', 'Sales Tax Calculator', 'Calculate tax amount and total from a price and tax percentage.', input => {
    const [price, taxRate] = numbers(input, 2);
    if (price < 0 || taxRate < 0) throw new Error('Price and tax rate cannot be negative.');
    return `Tax: ${formatNumber(price * taxRate / 100)}\nTotal: ${formatNumber(price * (1 + taxRate / 100))}`;
  }, 'sales tax VAT GST price total'),
  makeTool('break-even-calculator', 'Break-Even Calculator', 'Find break-even unit sales and revenue from fixed cost, selling price, and variable cost.', input => {
    const [fixedCosts, price, variableCost] = numbers(input, 3);
    if (fixedCosts < 0 || price <= variableCost || variableCost < 0) throw new Error('Fixed costs must be non-negative and selling price must exceed non-negative variable cost.');
    const units = fixedCosts / (price - variableCost);
    return `Break-even units: ${formatNumber(units)} (round up to ${Math.ceil(units)})\nBreak-even revenue: ${formatNumber(Math.ceil(units) * price)}\nContribution margin per unit: ${formatNumber(price - variableCost)}`;
  }, 'business break even units revenue fixed variable costs'),
  makeTool('arithmetic-sequence-calculator', 'Arithmetic Sequence Calculator', 'Find the nth term and sum of an arithmetic sequence from its first term, difference, and term count.', input => {
    const [first, difference, count] = numbers(input, 3);
    if (!Number.isInteger(count) || count < 1 || count > 1000000000) throw new Error('Term count must be a whole number from 1 to 1,000,000,000.');
    const last = first + (count - 1) * difference;
    return `Nth term: ${formatNumber(last)}\nSum of first ${count} terms: ${formatNumber(count * (first + last) / 2)}`;
  }, 'arithmetic sequence nth term sum progression'),
  makeTool('geometric-sequence-calculator', 'Geometric Sequence Calculator', 'Find the nth term and finite geometric-series sum.', input => {
    const [first, ratio, count] = numbers(input, 3);
    if (!Number.isInteger(count) || count < 1 || count > 100000) throw new Error('Term count must be a whole number from 1 to 100,000.');
    const last = first * ratio ** (count - 1);
    const sum = ratio === 1 ? first * count : first * (ratio ** count - 1) / (ratio - 1);
    return `Nth term: ${formatNumber(last)}\nFinite sum: ${formatNumber(sum)}`;
  }, 'geometric sequence nth term finite sum series'),
  makeTool('matrix-calculator', '2×2 Matrix Calculator', 'Add, subtract, or multiply two 2×2 matrices and calculate the first matrix determinant.', (input, options) => {
    const values = numbers(input, 8);
    const [a, b, c, d, e, f, g, h] = values;
    const result = options.operation === 'add' ? [a + e, b + f, c + g, d + h]
      : options.operation === 'subtract' ? [a - e, b - f, c - g, d - h]
        : [a * e + b * g, a * f + b * h, c * e + d * g, c * f + d * h];
    return `Result:\n${formatNumber(result[0])}, ${formatNumber(result[1])}\n${formatNumber(result[2])}, ${formatNumber(result[3])}\nFirst matrix determinant: ${formatNumber(a * d - b * c)}`;
  }, 'matrix multiplication addition subtraction determinant linear algebra', { fields: [{ name: 'operation', label: 'Operation', type: 'select', defaultValue: 'multiply', options: [['multiply', 'Multiply'], ['add', 'Add'], ['subtract', 'Subtract']] }] })
];

const geometryTools = [
  makeTool('circle-geometry-calculator', 'Circle Geometry Calculator', 'Calculate a circle’s circumference and area from its radius.', input => {
    const [radius] = numbers(input, 1);
    positive(radius, 'Radius');
    return `Diameter: ${formatNumber(2 * radius)}\nCircumference: ${formatNumber(2 * Math.PI * radius)}\nArea: ${formatNumber(Math.PI * radius ** 2)}`;
  }, 'geometry circle radius diameter circumference area'),
  makeTool('triangle-geometry-calculator', 'Triangle Geometry Calculator', 'Calculate triangle area, perimeter, and the third side using Heron’s formula.', input => {
    const [a, b, c] = numbers(input, 3);
    positive(a, 'Sides'); positive(b, 'Sides'); positive(c, 'Sides');
    if (a + b <= c || a + c <= b || b + c <= a) throw new Error('These side lengths do not form a triangle.');
    const semiperimeter = (a + b + c) / 2;
    return `Perimeter: ${formatNumber(2 * semiperimeter)}\nArea: ${formatNumber(Math.sqrt(semiperimeter * (semiperimeter - a) * (semiperimeter - b) * (semiperimeter - c)))}\nSemiperimeter: ${formatNumber(semiperimeter)}`;
  }, 'triangle sides area perimeter Heron'),
  makeTool('rectangle-geometry-calculator', 'Rectangle Geometry Calculator', 'Calculate area, perimeter, diagonal, and aspect ratio from width and height.', input => {
    const [width, height] = numbers(input, 2);
    positive(width, 'Width'); positive(height, 'Height');
    const divisor = gcd(Math.round(width * 1000000), Math.round(height * 1000000));
    return `Area: ${formatNumber(width * height)}\nPerimeter: ${formatNumber(2 * (width + height))}\nDiagonal: ${formatNumber(Math.hypot(width, height))}\nAspect ratio: ${Math.round(width * 1000000) / divisor}:${Math.round(height * 1000000) / divisor}`;
  }, 'rectangle dimensions area perimeter diagonal aspect ratio'),
  makeTool('trapezoid-area-calculator', 'Trapezoid Area Calculator', 'Calculate trapezoid area and midsegment from two parallel sides and height.', input => {
    const [base1, base2, height] = numbers(input, 3);
    positive(base1, 'Bases'); positive(base2, 'Bases'); positive(height, 'Height');
    return `Area: ${formatNumber((base1 + base2) * height / 2)}\nMidsegment: ${formatNumber((base1 + base2) / 2)}`;
  }, 'trapezoid area bases height midsegment'),
  makeTool('parallelogram-area-calculator', 'Parallelogram Area Calculator', 'Calculate parallelogram area from base and perpendicular height.', input => {
    const [base, height] = numbers(input, 2);
    positive(base, 'Base'); positive(height, 'Height');
    return `Area: ${formatNumber(base * height)}\nBase × height: ${formatNumber(base)} × ${formatNumber(height)}`;
  }, 'parallelogram area base height'),
  makeTool('polygon-area-calculator', 'Regular Polygon Calculator', 'Calculate a regular polygon’s interior angle, perimeter, and area from side count and side length.', input => {
    const [sides, length] = numbers(input, 2);
    if (!Number.isInteger(sides) || sides < 3 || sides > 100000) throw new Error('Enter a whole number of sides from 3 to 100,000.');
    positive(length, 'Side length');
    return `Perimeter: ${formatNumber(sides * length)}\nInterior angle: ${formatNumber((sides - 2) * 180 / sides)}°\nArea: ${formatNumber(sides * length ** 2 / (4 * Math.tan(Math.PI / sides)))}\nApothem: ${formatNumber(length / (2 * Math.tan(Math.PI / sides)))}`;
  }, 'regular polygon sides perimeter area apothem interior angle'),
  makeTool('sphere-volume-calculator', 'Sphere Calculator', 'Calculate sphere volume, surface area, and diameter from a radius.', input => {
    const [radius] = numbers(input, 1);
    positive(radius, 'Radius');
    return `Diameter: ${formatNumber(2 * radius)}\nSurface area: ${formatNumber(4 * Math.PI * radius ** 2)}\nVolume: ${formatNumber(4 * Math.PI * radius ** 3 / 3)}`;
  }, 'sphere volume surface area radius'),
  makeTool('cylinder-volume-calculator', 'Cylinder Calculator', 'Calculate cylinder volume and total surface area from radius and height.', input => {
    const [radius, height] = numbers(input, 2);
    positive(radius, 'Radius'); positive(height, 'Height');
    return `Volume: ${formatNumber(Math.PI * radius ** 2 * height)}\nTotal surface area: ${formatNumber(2 * Math.PI * radius * (radius + height))}\nLateral area: ${formatNumber(2 * Math.PI * radius * height)}`;
  }, 'cylinder volume surface area radius height'),
  makeTool('cone-volume-calculator', 'Cone Calculator', 'Calculate right circular cone volume, slant height, and surface area.', input => {
    const [radius, height] = numbers(input, 2);
    positive(radius, 'Radius'); positive(height, 'Height');
    const slant = Math.hypot(radius, height);
    return `Volume: ${formatNumber(Math.PI * radius ** 2 * height / 3)}\nSlant height: ${formatNumber(slant)}\nTotal surface area: ${formatNumber(Math.PI * radius * (radius + slant))}`;
  }, 'cone volume slant height surface area'),
  makeTool('cube-volume-calculator', 'Cube Calculator', 'Calculate cube volume, surface area, and face/body diagonals from its edge length.', input => {
    const [edge] = numbers(input, 1);
    positive(edge, 'Edge length');
    return `Volume: ${formatNumber(edge ** 3)}\nSurface area: ${formatNumber(6 * edge ** 2)}\nFace diagonal: ${formatNumber(edge * Math.SQRT2)}\nBody diagonal: ${formatNumber(edge * Math.sqrt(3))}`;
  }, 'cube volume edge surface area diagonal'),
  makeTool('rectangular-prism-calculator', 'Rectangular Prism Calculator', 'Calculate rectangular prism volume, surface area, and space diagonal.', input => {
    const [length, width, height] = numbers(input, 3);
    positive(length, 'Dimensions'); positive(width, 'Dimensions'); positive(height, 'Dimensions');
    return `Volume: ${formatNumber(length * width * height)}\nSurface area: ${formatNumber(2 * (length * width + width * height + length * height))}\nSpace diagonal: ${formatNumber(Math.hypot(length, width, height))}`;
  }, 'rectangular prism cuboid box volume surface area diagonal'),
  makeTool('right-triangle-calculator', 'Right Triangle Calculator', 'Find the hypotenuse and acute angles from the two perpendicular legs.', input => {
    const [opposite, adjacent] = numbers(input, 2);
    positive(opposite, 'Legs'); positive(adjacent, 'Legs');
    const angle = Math.atan2(opposite, adjacent) * 180 / Math.PI;
    return `Hypotenuse: ${formatNumber(Math.hypot(opposite, adjacent))}\nAcute angles: ${formatNumber(angle)}° and ${formatNumber(90 - angle)}°\nArea: ${formatNumber(opposite * adjacent / 2)}`;
  }, 'right triangle hypotenuse legs pythagorean theorem'),
  makeTool('ellipse-geometry-calculator', 'Ellipse Calculator', 'Calculate ellipse area, eccentricity, and Ramanujan’s perimeter approximation from semi-axes.', input => {
    const [major, minor] = numbers(input, 2);
    positive(major, 'Semi-axes'); positive(minor, 'Semi-axes');
    const a = Math.max(major, minor);
    const b = Math.min(major, minor);
    const h = ((a - b) / (a + b)) ** 2;
    return `Area: ${formatNumber(Math.PI * a * b)}\nPerimeter (Ramanujan approximation): ${formatNumber(Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h))))}\nEccentricity: ${formatNumber(Math.sqrt(1 - b ** 2 / a ** 2))}`;
  }, 'ellipse area perimeter eccentricity semi major minor axis'),
  makeTool('sector-geometry-calculator', 'Circle Sector Calculator', 'Calculate arc length and sector area from radius and central angle in degrees.', input => {
    const [radius, degrees] = numbers(input, 2);
    positive(radius, 'Radius');
    if (degrees < 0 || degrees > 360) throw new Error('Angle must be from 0° to 360°.');
    return `Arc length: ${formatNumber(2 * Math.PI * radius * degrees / 360)}\nSector area: ${formatNumber(Math.PI * radius ** 2 * degrees / 360)}\nChord length: ${formatNumber(2 * radius * Math.sin(degrees * Math.PI / 360))}`;
  }, 'circle sector arc length chord angle area'),
  makeTool('pyramid-volume-calculator', 'Pyramid Calculator', 'Calculate a square pyramid’s volume, slant height, and total surface area.', input => {
    const [baseEdge, height] = numbers(input, 2);
    positive(baseEdge, 'Base edge'); positive(height, 'Height');
    const slant = Math.hypot(height, baseEdge / 2);
    return `Volume: ${formatNumber(baseEdge ** 2 * height / 3)}\nFace slant height: ${formatNumber(slant)}\nTotal surface area: ${formatNumber(baseEdge ** 2 + 2 * baseEdge * slant)}`;
  }, 'square pyramid volume slant height surface area'),
  makeTool('torus-volume-calculator', 'Torus Calculator', 'Calculate torus volume and surface area from major and minor radii.', input => {
    const [major, minor] = numbers(input, 2);
    if (major <= minor || minor <= 0) throw new Error('Major radius must be greater than a positive minor radius.');
    return `Volume: ${formatNumber(2 * Math.PI ** 2 * major * minor ** 2)}\nSurface area: ${formatNumber(4 * Math.PI ** 2 * major * minor)}`;
  }, 'torus volume surface area major minor radius donut')
];

const physicsTools = [
  makeTool('force-calculator', 'Force Calculator (F = ma)', 'Calculate force, mass, or acceleration from Newton’s second law.', input => {
    const [mass, acceleration] = numbers(input, 2);
    return `Force: ${formatNumber(mass * acceleration)} N\nMass: ${formatNumber(mass)} kg\nAcceleration: ${formatNumber(acceleration)} m/s²`;
  }, 'physics force newton second law mass acceleration F ma', { assistantMatch: /\b(?:calculate|compute|find)\b.{0,50}\bforce\b/i }),
  makeTool('kinetic-energy-calculator', 'Kinetic Energy Calculator', 'Calculate kinetic energy, momentum, and stopping work from mass and velocity.', input => {
    const [mass, velocity] = numbers(input, 2);
    positive(mass, 'Mass');
    return `Kinetic energy: ${formatNumber(mass * velocity ** 2 / 2)} J\nMomentum: ${formatNumber(mass * velocity)} kg·m/s\nSpeed: ${formatNumber(Math.abs(velocity))} m/s`;
  }, 'physics kinetic energy momentum mass velocity speed', { assistantMatch: /\b(?:calculate|compute|find|what is)\b.{0,50}\b(?:kinetic energy|momentum)\b/i }),
  makeTool('gravitational-potential-energy-calculator', 'Gravitational Potential Energy Calculator', 'Calculate near-Earth gravitational potential energy using E = mgh.', input => {
    const [mass, height, gravity = 9.80665] = numbers(input, 3);
    if (mass < 0 || gravity < 0) throw new Error('Mass and gravitational acceleration cannot be negative.');
    return `Potential energy: ${formatNumber(mass * gravity * height)} J\nWeight: ${formatNumber(mass * gravity)} N\nGravity used: ${formatNumber(gravity)} m/s²`;
  }, 'physics potential energy mgh height gravity weight'),
  makeTool('momentum-impulse-calculator', 'Momentum & Impulse Calculator', 'Calculate momentum and average force from mass, initial/final velocities, and collision time.', input => {
    const [mass, initial, final, duration] = numbers(input, 4);
    positive(mass, 'Mass'); positive(duration, 'Duration');
    const impulse = mass * (final - initial);
    return `Initial momentum: ${formatNumber(mass * initial)} kg·m/s\nFinal momentum: ${formatNumber(mass * final)} kg·m/s\nImpulse: ${formatNumber(impulse)} N·s\nAverage force: ${formatNumber(impulse / duration)} N`;
  }, 'physics momentum impulse force collision velocity time'),
  makeTool('work-power-calculator', 'Work & Power Calculator', 'Calculate mechanical work, average power, and parallel force component.', input => {
    const [force, distance, seconds] = numbers(input, 3);
    if (seconds <= 0) throw new Error('Time must be greater than zero.');
    return `Work: ${formatNumber(force * distance)} J\nAverage power: ${formatNumber(force * distance / seconds)} W\nTime: ${formatNumber(seconds)} s`;
  }, 'physics mechanical work power force distance time'),
  makeTool('pressure-calculator', 'Pressure Calculator', 'Calculate pressure, force, or area from the other two values.', input => {
    const [force, area] = numbers(input, 2);
    positive(area, 'Area');
    return `Pressure: ${formatNumber(force / area)} Pa\nForce: ${formatNumber(force)} N\nArea: ${formatNumber(area)} m²`;
  }, 'physics pressure force area pascal', { assistantMatch: /\b(?:calculate|compute|find)\b.{0,50}\bpressure\b/i }),
  makeTool('density-calculator', 'Density Calculator', 'Calculate density, mass, and volume from two supplied quantities.', input => {
    const [mass, volume] = numbers(input, 2);
    positive(volume, 'Volume');
    return `Density: ${formatNumber(mass / volume)} kg/m³\nMass: ${formatNumber(mass)} kg\nVolume: ${formatNumber(volume)} m³`;
  }, 'physics density mass volume'),
  makeTool('wave-speed-calculator', 'Wave Speed Calculator', 'Calculate wave speed, frequency, and wavelength from any two values.', input => {
    const [frequency, wavelength] = numbers(input, 2);
    if (frequency < 0 || wavelength < 0) throw new Error('Frequency and wavelength cannot be negative.');
    return `Wave speed: ${formatNumber(frequency * wavelength)} m/s\nFrequency: ${formatNumber(frequency)} Hz\nWavelength: ${formatNumber(wavelength)} m`;
  }, 'physics wave speed frequency wavelength sound light'),
  makeTool('ohms-law-calculator', 'Ohm’s Law Calculator', 'Calculate voltage, current, resistance, and power from voltage and resistance.', input => {
    const [voltage, resistance] = numbers(input, 2);
    if (resistance === 0) throw new Error('Resistance cannot be zero.');
    const current = voltage / resistance;
    return `Voltage: ${formatNumber(voltage)} V\nCurrent: ${formatNumber(current)} A\nResistance: ${formatNumber(resistance)} Ω\nPower: ${formatNumber(voltage * current)} W`;
  }, 'physics electrical engineering ohms law voltage current resistance power circuit'),
  makeTool('series-resistance-calculator', 'Series Resistance Calculator', 'Calculate the equivalent resistance and voltage drop across series resistors.', input => {
    const values = numbers(input, 1);
    if (values.some(value => value < 0)) throw new Error('Resistance values cannot be negative.');
    return `Equivalent series resistance: ${formatNumber(values.reduce((sum, value) => sum + value, 0))} Ω\nResistors: ${values.length}`;
  }, 'electronics series resistors equivalent resistance'),
  makeTool('parallel-resistance-calculator', 'Parallel Resistance Calculator', 'Calculate the equivalent resistance of parallel resistors.', input => {
    const values = numbers(input, 1);
    if (values.some(value => value <= 0)) throw new Error('Parallel resistance values must be greater than zero.');
    return `Equivalent parallel resistance: ${formatNumber(1 / values.reduce((sum, value) => sum + 1 / value, 0))} Ω\nResistors: ${values.length}`;
  }, 'electronics parallel resistors equivalent resistance'),
  makeTool('centripetal-force-calculator', 'Centripetal Force Calculator', 'Calculate centripetal acceleration, force, and angular velocity from mass, speed, and radius.', input => {
    const [mass, speed, radius] = numbers(input, 3);
    positive(mass, 'Mass'); positive(radius, 'Radius');
    return `Centripetal acceleration: ${formatNumber(speed ** 2 / radius)} m/s²\nCentripetal force: ${formatNumber(mass * speed ** 2 / radius)} N\nAngular velocity: ${formatNumber(speed / radius)} rad/s`;
  }, 'physics centripetal force circular motion acceleration angular velocity'),
  makeTool('spring-force-calculator', 'Spring Force & Energy Calculator', 'Apply Hooke’s law to calculate spring force and elastic potential energy.', input => {
    const [springConstant, displacement] = numbers(input, 2);
    if (springConstant < 0) throw new Error('Spring constant cannot be negative.');
    return `Restoring force: ${formatNumber(-springConstant * displacement)} N\nElastic potential energy: ${formatNumber(springConstant * displacement ** 2 / 2)} J`;
  }, 'physics Hooke law spring force constant elastic potential energy'),
  makeTool('heat-energy-calculator', 'Specific Heat Calculator', 'Calculate thermal energy transfer with Q = mcΔT.', input => {
    const [mass, specificHeat, initialTemp, finalTemp] = numbers(input, 4);
    if (mass < 0 || specificHeat < 0) throw new Error('Mass and specific heat cannot be negative.');
    const change = finalTemp - initialTemp;
    return `Heat transferred: ${formatNumber(mass * specificHeat * change)} J\nTemperature change: ${formatNumber(change)} K (or °C)\nSpecific heat: ${formatNumber(specificHeat)} J/(kg·K)`;
  }, 'physics thermal heat energy specific heat temperature change Q mc delta T'),
  makeTool('ideal-gas-law-calculator', 'Ideal Gas Law Calculator', 'Calculate ideal-gas pressure from moles, temperature, and volume using R = 8.314462618 J/(mol·K).', input => {
    const [moles, celsius, volume] = numbers(input, 3);
    const kelvin = celsius + 273.15;
    positive(moles, 'Amount'); positive(kelvin, 'Absolute temperature'); positive(volume, 'Volume');
    return `Pressure: ${formatNumber(moles * 8.314462618 * kelvin / volume)} Pa\nTemperature: ${formatNumber(kelvin)} K\nAmount: ${formatNumber(moles)} mol\nVolume: ${formatNumber(volume)} m³`;
  }, 'physics ideal gas law PV nRT pressure temperature volume moles'),
  makeTool('gravitational-force-calculator', 'Universal Gravitation Calculator', 'Calculate gravitational attraction between two masses separated by a distance.', input => {
    const [mass1, mass2, distance] = numbers(input, 3);
    positive(mass1, 'Masses'); positive(mass2, 'Masses'); positive(distance, 'Distance');
    return `Gravitational force: ${formatNumber(6.67430e-11 * mass1 * mass2 / distance ** 2)} N`;
  }, 'physics Newton gravity gravitation masses distance force'),
  makeTool('coulombs-law-calculator', 'Coulomb’s Law Calculator', 'Calculate electrostatic force between two point charges in vacuum.', input => {
    const [charge1, charge2, distance] = numbers(input, 3);
    positive(distance, 'Distance');
    return `Electrostatic force: ${formatNumber(8.9875517923e9 * charge1 * charge2 / distance ** 2)} N\nMagnitude: ${formatNumber(8.9875517923e9 * Math.abs(charge1 * charge2) / distance ** 2)} N\nInteraction: ${charge1 * charge2 < 0 ? 'attractive' : 'repulsive (or zero)'}`;
  }, 'physics Coulomb electrostatic charges force distance'),
  makeTool('lens-equation-calculator', 'Thin Lens Equation Calculator', 'Calculate image distance, magnification, and image orientation from focal length and object distance.', input => {
    const [focalLength, objectDistance] = numbers(input, 2);
    if (focalLength === 0 || objectDistance === 0) throw new Error('Focal length and object distance cannot be zero.');
    const denominator = 1 / focalLength - 1 / objectDistance;
    if (denominator === 0) return 'Image distance: infinity (object is at the focal point)\nMagnification: unbounded';
    const imageDistance = 1 / denominator;
    return `Image distance: ${formatNumber(imageDistance)}\nMagnification: ${formatNumber(-imageDistance / objectDistance)}\nImage: ${imageDistance > 0 ? 'real' : 'virtual'}`;
  }, 'physics optics thin lens focal length image distance magnification'),
  makeTool('snells-law-calculator', 'Snell’s Law Calculator', 'Calculate refraction angle or check for total internal reflection using Snell’s law.', input => {
    const [incidentIndex, incidentDegrees, transmittedIndex] = numbers(input, 3);
    positive(incidentIndex, 'Refractive indices'); positive(transmittedIndex, 'Refractive indices');
    if (incidentDegrees < 0 || incidentDegrees >= 90) throw new Error('Incident angle must be from 0° up to (but not including) 90°.');
    const sine = incidentIndex * Math.sin(incidentDegrees * Math.PI / 180) / transmittedIndex;
    if (sine > 1) return 'Total internal reflection occurs; no refracted ray is transmitted.';
    return `Refracted angle: ${formatNumber(Math.asin(sine) * 180 / Math.PI)}°\nIncident medium refractive index: ${formatNumber(incidentIndex)}\nTransmitted medium refractive index: ${formatNumber(transmittedIndex)}`;
  }, 'physics optics Snell law refraction refractive index angle'),
  makeTool('kinematics-calculator', 'Kinematics Calculator (v = u + at)', 'Calculate final velocity and displacement under constant acceleration.', input => {
    const [initialVelocity, acceleration, seconds] = numbers(input, 3);
    if (seconds < 0) throw new Error('Time cannot be negative.');
    return `Final velocity: ${formatNumber(initialVelocity + acceleration * seconds)} m/s\nDisplacement: ${formatNumber(initialVelocity * seconds + acceleration * seconds ** 2 / 2)} m\nAverage velocity: ${formatNumber(initialVelocity + acceleration * seconds / 2)} m/s`;
  }, 'physics kinematics constant acceleration displacement velocity time'),
  makeTool('projectile-range-calculator', 'Projectile Motion Calculator', 'Estimate ideal projectile range, maximum height, and flight time without air resistance.', input => {
    const [speed, degrees, gravity = 9.80665] = numbers(input, 2);
    if (speed < 0 || gravity <= 0 || degrees < 0 || degrees > 90) throw new Error('Use non-negative speed, positive gravity, and an angle from 0° to 90°.');
    const radians = degrees * Math.PI / 180;
    const flightTime = 2 * speed * Math.sin(radians) / gravity;
    return `Horizontal range: ${formatNumber(speed ** 2 * Math.sin(2 * radians) / gravity)} m\nMaximum height: ${formatNumber(speed ** 2 * Math.sin(radians) ** 2 / (2 * gravity))} m\nFlight time: ${formatNumber(flightTime)} s\nModel assumes level ground and no air resistance.`;
  }, 'physics projectile trajectory range height flight time', { assistantMatch: /\b(?:calculate|compute|find)\b.{0,50}\bprojectile (?:motion|range|trajectory)\b/i }),
  makeTool('electrical-power-calculator', 'Electrical Power Calculator', 'Calculate electrical power and energy usage from voltage, current, and time.', input => {
    const [voltage, current, hours] = numbers(input, 3);
    if (hours < 0) throw new Error('Duration cannot be negative.');
    const watts = voltage * current;
    return `Power: ${formatNumber(watts)} W\nEnergy: ${formatNumber(watts * hours)} Wh\nEnergy: ${formatNumber(watts * hours / 1000)} kWh`;
  }, 'electricity electrical power energy voltage current watts kWh'),
  makeTool('torque-calculator', 'Torque Calculator', 'Calculate torque and mechanical power from force, lever arm, and rotational speed.', input => {
    const [force, radius, rpm] = numbers(input, 3);
    if (radius < 0 || rpm < 0) throw new Error('Lever arm and rotational speed cannot be negative.');
    const torque = force * radius;
    return `Torque: ${formatNumber(torque)} N·m\nAngular speed: ${formatNumber(rpm * Math.PI / 30)} rad/s\nMechanical power: ${formatNumber(torque * rpm * Math.PI / 30)} W`;
  }, 'physics engineering torque lever arm rpm rotational power'),
  makeTool('fluid-flow-calculator', 'Fluid Flow Calculator', 'Calculate volumetric flow rate, average fluid speed, and volume from area and duration.', input => {
    const [area, velocity, seconds] = numbers(input, 3);
    positive(area, 'Cross-sectional area');
    if (seconds < 0) throw new Error('Duration cannot be negative.');
    const flow = area * velocity;
    return `Volumetric flow rate: ${formatNumber(flow)} m³/s\nVolume transferred: ${formatNumber(flow * seconds)} m³\nAverage speed: ${formatNumber(velocity)} m/s`;
  }, 'physics fluid flow rate area velocity volume'),
  makeTool('thermal-expansion-calculator', 'Thermal Expansion Calculator', 'Calculate linear expansion and final length given the expansion coefficient and temperature change.', input => {
    const [length, coefficient, initialCelsius, finalCelsius] = numbers(input, 4);
    if (length < 0 || coefficient < 0) throw new Error('Length and expansion coefficient cannot be negative.');
    const change = initialCelsius - finalCelsius;
    const delta = length * coefficient * change;
    return `Change in length: ${formatNumber(delta)} m\nFinal length: ${formatNumber(length + delta)} m\nTemperature change: ${formatNumber(change)} °C`;
  }, 'physics thermal expansion coefficient length temperature change')
];

const conversionTools = [
  makeTool('degrees-radians-converter', 'Degrees & Radians Converter', 'Convert an angle between degrees, radians, and turns.', input => {
    const [degrees] = numbers(input, 1);
    return `Degrees: ${formatNumber(degrees)}°\nRadians: ${formatNumber(degrees * Math.PI / 180)} rad\nTurns: ${formatNumber(degrees / 360)}`;
  }, 'convert angle degrees radians turns'),
  makeTool('temperature-converter', 'Temperature Scale Converter', 'Convert Celsius into Fahrenheit and Kelvin, including validation above absolute zero.', input => {
    const [celsius] = numbers(input, 1);
    if (celsius < -273.15) throw new Error('Temperature cannot be below absolute zero.');
    return `Celsius: ${formatNumber(celsius)} °C\nFahrenheit: ${formatNumber(celsius * 9 / 5 + 32)} °F\nKelvin: ${formatNumber(celsius + 273.15)} K`;
  }, 'convert temperature Celsius Fahrenheit Kelvin absolute zero'),
  makeTool('pressure-unit-converter', 'Pressure Unit Converter', 'Convert a pressure value in pascals to kPa, bar, atmosphere, and psi.', input => {
    const [pascal] = numbers(input, 1);
    return `Pa: ${formatNumber(pascal)}\nkPa: ${formatNumber(pascal / 1000)}\nbar: ${formatNumber(pascal / 100000)}\natm: ${formatNumber(pascal / 101325)}\npsi: ${formatNumber(pascal / 6894.757293168)}`;
  }, 'convert pressure pascal bar atmosphere psi kPa'),
  makeTool('speed-unit-converter', 'Speed Unit Converter', 'Convert meters per second to kilometers per hour, miles per hour, and knots.', input => {
    const [metersPerSecond] = numbers(input, 1);
    return `m/s: ${formatNumber(metersPerSecond)}\nkm/h: ${formatNumber(metersPerSecond * 3.6)}\nmph: ${formatNumber(metersPerSecond * 2.2369362921)}\nknots: ${formatNumber(metersPerSecond * 1.9438444924)}`;
  }, 'convert speed velocity m/s km/h mph knots'),
  makeTool('energy-unit-converter', 'Energy Unit Converter', 'Convert joules to calories, kilocalories, watt-hours, and electronvolts.', input => {
    const [joules] = numbers(input, 1);
    return `J: ${formatNumber(joules)}\ncal: ${formatNumber(joules / 4.184)}\nkcal: ${formatNumber(joules / 4184)}\nWh: ${formatNumber(joules / 3600)}\neV: ${formatNumber(joules / 1.602176634e-19)}`;
  }, 'convert energy joule calorie kilowatt hour electronvolt'),
  makeTool('length-unit-converter', 'Length Unit Converter', 'Convert meters to kilometers, miles, feet, and inches.', input => {
    const [meters] = numbers(input, 1);
    return `Meters: ${formatNumber(meters)} m\nKilometers: ${formatNumber(meters / 1000)} km\nMiles: ${formatNumber(meters / 1609.344)} mi\nFeet: ${formatNumber(meters * 3.280839895)} ft\nInches: ${formatNumber(meters * 39.37007874)} in`;
  }, 'convert length distance meters kilometers miles feet inches'),
  makeTool('mass-unit-converter', 'Mass Unit Converter', 'Convert kilograms to grams, pounds, ounces, and metric tonnes.', input => {
    const [kilograms] = numbers(input, 1);
    return `Kilograms: ${formatNumber(kilograms)} kg\nGrams: ${formatNumber(kilograms * 1000)} g\nPounds: ${formatNumber(kilograms * 2.2046226218)} lb\nOunces: ${formatNumber(kilograms * 35.27396195)} oz\nMetric tonnes: ${formatNumber(kilograms / 1000)} t`;
  }, 'convert mass weight kilograms grams pounds ounces tonnes'),
  makeTool('area-unit-converter', 'Area Unit Converter', 'Convert square meters to square kilometers, hectares, acres, and square feet.', input => {
    const [squareMeters] = numbers(input, 1);
    return `m²: ${formatNumber(squareMeters)}\nkm²: ${formatNumber(squareMeters / 1e6)}\nHectares: ${formatNumber(squareMeters / 10000)}\nAcres: ${formatNumber(squareMeters / 4046.8564224)}\nft²: ${formatNumber(squareMeters * 10.7639104167)}`;
  }, 'convert area square meters hectares acres square feet'),
  makeTool('volume-unit-converter', 'Volume Unit Converter', 'Convert liters to milliliters, US gallons, US fluid ounces, and cubic meters.', input => {
    const [liters] = numbers(input, 1);
    return `Liters: ${formatNumber(liters)} L\nMilliliters: ${formatNumber(liters * 1000)} mL\nUS gallons: ${formatNumber(liters / 3.785411784)} gal\nUS fluid ounces: ${formatNumber(liters * 33.8140227)} fl oz\nCubic meters: ${formatNumber(liters / 1000)} m³`;
  }, 'convert volume liters gallons fluid ounces milliliters'),
  makeTool('data-size-converter', 'Data Size Converter', 'Show decimal and binary storage sizes for a byte count.', input => {
    const [bytes] = numbers(input, 1);
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error('Enter a non-negative safe whole number of bytes.');
    return `Bytes: ${bytes}\nDecimal: ${formatNumber(bytes / 1e3)} kB · ${formatNumber(bytes / 1e6)} MB · ${formatNumber(bytes / 1e9)} GB\nBinary: ${formatNumber(bytes / 1024)} KiB · ${formatNumber(bytes / 1048576)} MiB · ${formatNumber(bytes / 1073741824)} GiB`;
  }, 'convert bytes kib mib gib storage file size'),
  makeTool('number-base-converter', 'Number Base Converter', 'Convert a whole number between binary, octal, decimal, and hexadecimal.', (input, options) => {
    const radix = Number(options.base);
    const normalized = input.trim().replaceAll('_', '');
    if (!/^-?(?:0b[01]+|0o[0-7]+|0x[\da-f]+|[\da-z]+)$/i.test(normalized)) throw new Error('Enter a whole number, optionally prefixed with 0b, 0o, or 0x.');
    const value = Number(normalized);
    if (!Number.isSafeInteger(value)) throw new Error('The value must fit in JavaScript’s safe integer range.');
    return `Decimal: ${value}\nBinary: ${value.toString(2)}\nOctal: ${value.toString(8)}\nHexadecimal: 0x${value.toString(16).toUpperCase()}\nBase ${radix}: ${value.toString(radix)}`;
  }, 'convert number base binary octal decimal hexadecimal radix', { fields: [{ name: 'base', label: 'Additional output base', type: 'number', defaultValue: '2' }] }),
  makeTool('frequency-wavelength-converter', 'Frequency & Wavelength Converter', 'Calculate light wavelength from frequency or frequency from wavelength in vacuum.', (input, options) => {
    const [value] = numbers(input, 1);
    positive(value, 'Frequency or wavelength');
    const lightSpeed = 299792458;
    if (options.direction === 'wavelength') return `Wavelength: ${formatNumber(lightSpeed / value)} m\nFrequency: ${formatNumber(value)} Hz`;
    return `Frequency: ${formatNumber(lightSpeed / value)} Hz\nWavelength: ${formatNumber(value)} m`;
  }, 'convert light frequency wavelength photon radio', { fields: [{ name: 'direction', label: 'Input is', type: 'select', defaultValue: 'frequency', options: [['frequency', 'Frequency (Hz)'], ['wavelength', 'Wavelength (m)']] }] }),
  makeTool('unix-time-converter', 'Unix Time Precision Converter', 'Convert Unix seconds or milliseconds to an ISO timestamp and show both Unix precisions.', input => {
    const [timestamp] = numbers(input, 1);
    const milliseconds = Math.abs(timestamp) < 1e11 ? timestamp * 1000 : timestamp;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) throw new Error('Enter a valid Unix timestamp in seconds or milliseconds.');
    return `ISO 8601: ${date.toISOString()}\nUnix seconds: ${formatNumber(milliseconds / 1000)}\nUnix milliseconds: ${formatNumber(milliseconds)}`;
  }, 'unix timestamp epoch seconds milliseconds ISO date'),
  makeTool('rgb-hex-color-converter', 'RGB & Hex Color Converter', 'Convert three RGB integer channels into hexadecimal and CSS color notation.', input => {
    const channels = numbers(input, 3);
    if (channels.slice(0, 3).some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
      throw new Error('RGB channels must be whole numbers from 0 to 255.');
    }
    const [red, green, blue] = channels;
    const hex = `#${channels.map(value => value.toString(16).padStart(2, '0')).join('')}`;
    return `Hex: ${hex}\nCSS: rgb(${red} ${green} ${blue})\nChannels: Red ${red}, Green ${green}, Blue ${blue}`;
  }, 'convert RGB hex CSS color channels'),
  makeTool('binary-decimal-converter', 'Binary & Decimal Converter', 'Convert a binary integer to decimal, hexadecimal, and octal.', input => {
    const binary = input.trim().replaceAll('_', '');
    if (!/^[01]+$/.test(binary) || binary.length > 53) throw new Error('Enter up to 53 binary digits.');
    const value = Number.parseInt(binary, 2);
    return `Binary: ${binary}\nDecimal: ${value}\nHexadecimal: 0x${value.toString(16).toUpperCase()}\nOctal: ${value.toString(8)}`;
  }, 'binary to decimal convert bits base'),
  makeTool('hex-decimal-converter', 'Hexadecimal & Decimal Converter', 'Convert a hexadecimal integer to decimal, binary, and octal.', input => {
    const hex = input.trim().replace(/^0x/i, '').replaceAll('_', '');
    if (!/^[\da-f]+$/i.test(hex) || hex.length > 13) throw new Error('Enter up to 13 hexadecimal digits.');
    const value = Number.parseInt(hex, 16);
    if (!Number.isSafeInteger(value)) throw new Error('The value is outside JavaScript’s safe integer range.');
    return `Hexadecimal: 0x${hex.toUpperCase()}\nDecimal: ${value}\nBinary: ${value.toString(2)}\nOctal: ${value.toString(8)}`;
  }, 'hexadecimal to decimal convert base'),
  makeTool('roman-numeral-validator', 'Roman Numeral Validator', 'Check that a Roman numeral is canonical and report its integer value.', input => {
    const text = input.trim().toUpperCase();
    if (!/^[IVXLCDM]+$/.test(text)) throw new Error('Enter a Roman numeral using I, V, X, L, C, D, and M.');
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const total = [...text].reduce((sum, symbol, index) => sum + (values[symbol] < (values[text[index + 1]] || 0) ? -values[symbol] : values[symbol]), 0);
    const encode = number => {
      const symbols = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let remaining = number;
      return symbols.map(([value, symbol]) => { const count = Math.floor(remaining / value); remaining %= value; return symbol.repeat(count); }).join('');
    };
    if (total < 1 || total > 3999 || encode(total) !== text) throw new Error('That is not a canonical Roman numeral from I to MMMCMXCIX.');
    return `${text} = ${total}`;
  }, 'roman numeral validate integer canonical'),
  makeTool('character-encoding-inspector', 'Character Encoding Inspector', 'Show UTF-8 byte length, Unicode code points, and UTF-16 code units for text.', input => {
    const encoder = new TextEncoder();
    return `UTF-8 bytes: ${encoder.encode(input).length}\nUnicode code points: ${[...input].length}\nUTF-16 code units: ${input.length}\nCode points: ${[...input].map(char => `U+${char.codePointAt(0).toString(16).toUpperCase()}`).join(' ')}`;
  }, 'UTF-8 byte count Unicode code points UTF-16 encoding length'),
  makeTool('color-contrast-ratio-calculator', 'WCAG Color Contrast Calculator', 'Calculate relative luminance and contrast ratio for two six-digit hex colors.', input => {
    const colors = input.match(/#[\da-f]{6}\b/gi) || [];
    if (colors.length < 2) throw new Error('Enter two colors in #RRGGBB format.');
    const luminance = color => {
      const channels = color.slice(1).match(/.{2}/g).map(part => Number.parseInt(part, 16) / 255)
        .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const [first, second] = colors.slice(0, 2).map(luminance);
    const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    return `Contrast ratio: ${formatNumber(ratio)}:1\nWCAG AA normal text: ${ratio >= 4.5 ? 'Pass' : 'Fail'}\nWCAG AA large text: ${ratio >= 3 ? 'Pass' : 'Fail'}\nWCAG AAA normal text: ${ratio >= 7 ? 'Pass' : 'Fail'}`;
  }, 'WCAG color contrast accessibility ratio AA AAA luminance'),
  makeTool('angle-unit-converter', 'Angle Unit Converter', 'Convert radians to degrees, gradians, and turns.', input => {
    const [radians] = numbers(input, 1);
    return `Radians: ${formatNumber(radians)}\nDegrees: ${formatNumber(radians * 180 / Math.PI)}°\nGradians: ${formatNumber(radians * 200 / Math.PI)} gon\nTurns: ${formatNumber(radians / (2 * Math.PI))}`;
  }, 'angle convert radians degrees gradians turns'),
  makeTool('fuel-economy-converter', 'Fuel Economy Converter', 'Convert liters per 100 km to US mpg and UK mpg.', input => {
    const [litersPer100Km] = numbers(input, 1);
    positive(litersPer100Km, 'Fuel consumption');
    return `L/100 km: ${formatNumber(litersPer100Km)}\nUS mpg: ${formatNumber(235.214583 / litersPer100Km)}\nUK mpg: ${formatNumber(282.480936 / litersPer100Km)}`;
  }, 'convert fuel economy consumption L/100km mpg miles per gallon')
];

const dataTools = [
  makeTool('json-to-csv-converter', 'JSON Array to CSV Converter', 'Convert an array of JSON objects to CSV with escaped values and a consistent header.', input => {
    const rows = JSON.parse(input);
    if (!Array.isArray(rows) || !rows.length || rows.some(row => !row || Array.isArray(row) || typeof row !== 'object')) throw new Error('Enter a non-empty array of JSON objects.');
    const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const cell = value => {
      const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    return [headers.map(cell).join(','), ...rows.map(row => headers.map(header => cell(row[header])).join(','))].join('\n');
  }, 'JSON array objects CSV spreadsheet export'),
  makeTool('json-array-deduplicator', 'JSON Array Deduplicator', 'Remove duplicate JSON array items while preserving their first occurrence.', input => {
    const values = JSON.parse(input);
    if (!Array.isArray(values)) throw new Error('Enter a JSON array.');
    const seen = new Set();
    return JSON.stringify(values.filter(value => {
      const key = JSON.stringify(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }), null, 2);
  }, 'JSON array remove duplicates deduplicate unique'),
  makeTool('json-array-sorter', 'JSON Array Sorter', 'Sort a JSON array numerically or alphabetically.', (input, options) => {
    const values = JSON.parse(input);
    if (!Array.isArray(values)) throw new Error('Enter a JSON array.');
    if (values.some(value => !['string', 'number'].includes(typeof value))) throw new Error('Only arrays of strings or numbers can be sorted.');
    const sorted = values.toSorted((a, b) => options.order === 'numeric'
      ? Number(a) - Number(b)
      : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
    return JSON.stringify(sorted, null, 2);
  }, 'JSON array sort order alphabetical numeric', { fields: [{ name: 'order', label: 'Sort by', type: 'select', defaultValue: 'alphabetical', options: [['alphabetical', 'Alphabetical'], ['numeric', 'Numeric']] }] }),
  makeTool('json-array-statistics', 'JSON Numeric Array Statistics', 'Summarize a JSON array of numbers with mean, median, range, and population standard deviation.', input => {
    const values = JSON.parse(input);
    if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw new Error('Enter a non-empty JSON array containing only finite numbers.');
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return `Count: ${values.length}\nSum: ${formatNumber(mean * values.length)}\nMean: ${formatNumber(mean)}\nMedian: ${formatNumber(sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)}\nRange: ${formatNumber(sorted.at(-1) - sorted[0])}\nPopulation standard deviation: ${formatNumber(Math.sqrt(variance))}`;
  }, 'JSON array numeric statistics mean median standard deviation'),
  makeTool('json-ndjson-converter', 'JSON Array to NDJSON Converter', 'Convert a JSON array into newline-delimited JSON records.', input => {
    const values = JSON.parse(input);
    if (!Array.isArray(values)) throw new Error('Enter a JSON array.');
    return values.map(value => JSON.stringify(value)).join('\n');
  }, 'JSON array NDJSON newline delimited records'),
  makeTool('ndjson-json-converter', 'NDJSON to JSON Array Converter', 'Parse newline-delimited JSON into a formatted JSON array with clear line errors.', input => {
    const rows = input.split(/\r\n|\r|\n/).filter(line => line.trim());
    if (!rows.length) throw new Error('Enter one JSON value per line.');
    return JSON.stringify(rows.map((line, index) => {
      try { return JSON.parse(line); } catch (error) { throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`); }
    }), null, 2);
  }, 'NDJSON JSON lines convert newline delimited'),
  makeTool('json-key-renamer', 'JSON Key Renamer', 'Rename one top-level JSON object key while preserving its value.', (input, options) => {
    const object = JSON.parse(input);
    if (!object || Array.isArray(object) || typeof object !== 'object') throw new Error('Enter a JSON object.');
    if (!Object.hasOwn(object, options.from)) throw new Error(`Key "${options.from}" was not found.`);
    if (!options.to.trim()) throw new Error('Enter a new key name.');
    if (options.from !== options.to && Object.hasOwn(object, options.to)) throw new Error(`Key "${options.to}" already exists.`);
    const result = {};
    for (const [key, value] of Object.entries(object)) result[key === options.from ? options.to : key] = value;
    return JSON.stringify(result, null, 2);
  }, 'JSON rename object property key', { fields: [{ name: 'from', label: 'Current key', type: 'text', defaultValue: '' }, { name: 'to', label: 'New key', type: 'text', defaultValue: '' }] }),
  makeTool('json-path-list-generator', 'JSON Path List Generator', 'List every leaf-value JSONPath in an object or array.', input => {
    const value = JSON.parse(input);
    const paths = [];
    const visit = (item, path) => {
      if (item && typeof item === 'object') {
        const entries = Array.isArray(item) ? item.map((child, index) => [index, child]) : Object.entries(item);
        for (const [key, child] of entries) visit(child, Array.isArray(item) ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`);
      } else paths.push(`${path} = ${JSON.stringify(item)}`);
    };
    visit(value, '$');
    return paths.join('\n');
  }, 'JSONPath list extract nested keys leaf values'),
  makeTool('json-deep-merge', 'JSON Deep Merge Tool', 'Deep-merge two JSON objects; values in the second object take precedence.', input => {
    const [left, right] = JSON.parse(input);
    if (!left || !right || Array.isArray(left) || Array.isArray(right) || typeof left !== 'object' || typeof right !== 'object') throw new Error('Enter a JSON array containing two objects.');
    const merge = (a, b) => {
      const result = { ...a };
      for (const [key, value] of Object.entries(b)) {
        result[key] = value && typeof value === 'object' && !Array.isArray(value) && a[key] && typeof a[key] === 'object' && !Array.isArray(a[key])
          ? merge(a[key], value) : value;
      }
      return result;
    };
    return JSON.stringify(merge(left, right), null, 2);
  }, 'JSON deep merge combine two objects'),
  makeTool('json-key-caser', 'JSON Key Case Converter', 'Convert top-level JSON object keys to camelCase, snake_case, or kebab-case.', (input, options) => {
    const object = JSON.parse(input);
    if (!object || Array.isArray(object) || typeof object !== 'object') throw new Error('Enter a JSON object.');
    const convert = key => {
      const words = key.replace(/([a-z\d])([A-Z])/g, '$1 $2').match(/[\p{Letter}\p{Number}]+/gu) || [];
      if (options.mode === 'snake') return words.map(word => word.toLowerCase()).join('_');
      if (options.mode === 'kebab') return words.map(word => word.toLowerCase()).join('-');
      return words.map((word, index) => index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join('');
    };
    return JSON.stringify(Object.fromEntries(Object.entries(object).map(([key, value]) => [convert(key), value])), null, 2);
  }, 'JSON object keys camelCase snake_case kebab-case rename', { fields: [{ name: 'mode', label: 'Key style', type: 'select', defaultValue: 'camel', options: [['camel', 'camelCase'], ['snake', 'snake_case'], ['kebab', 'kebab-case']] }] }),
  makeTool('csv-delimiter-converter', 'CSV Delimiter Converter', 'Convert simple tab-, semicolon-, or pipe-delimited rows to escaped CSV.', (input, options) => {
    const delimiter = options.delimiter === 'tab' ? '\t' : options.delimiter;
    const rows = input.split(/\r\n|\r|\n/).map(line => line.split(delimiter));
    const quote = value => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
    return rows.map(row => row.map(quote).join(',')).join('\n');
  }, 'CSV delimiter convert TSV pipe semicolon separated values', { fields: [{ name: 'delimiter', label: 'Input delimiter', type: 'select', defaultValue: '\t', options: [['\t', 'Tab'], [';', 'Semicolon'], ['|', 'Pipe']] }] }),
  makeTool('csv-header-normalizer', 'CSV Header Normalizer', 'Normalize a CSV header row to lowercase snake_case names.', input => {
    const [header, ...rows] = input.split(/\r\n|\r|\n/);
    if (!header) throw new Error('Enter a CSV header row.');
    const names = header.split(',').map(value => value.trim().replace(/^"|"$/g, '').replaceAll('""', '"')
      .normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/([a-z\d])([A-Z])/g, '$1 $2')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
    if (new Set(names).size !== names.length) throw new Error('Header normalization produced duplicate names. Rename the conflicting columns first.');
    return [names.join(','), ...rows].join('\n');
  }, 'CSV header normalize snake case column names'),
  makeTool('csv-column-statistics', 'CSV Numeric Column Statistics', 'Calculate count, min, max, mean, and sum for a selected CSV column.', (input, options) => {
    const [header, ...rows] = input.split(/\r\n|\r|\n/).map(line => line.split(','));
    if (!header) throw new Error('Enter CSV data with a header row.');
    const index = header.findIndex(name => name.trim().replace(/^"|"$/g, '') === options.column);
    if (index < 0) throw new Error(`Column "${options.column}" was not found.`);
    const values = rows.map(row => Number(row[index]?.replace(/^"|"$/g, '').replaceAll('""', '"'))).filter(Number.isFinite);
    if (!values.length) throw new Error('The selected column contains no numeric values.');
    return `Count: ${values.length}\nSum: ${formatNumber(values.reduce((sum, value) => sum + value, 0))}\nMean: ${formatNumber(values.reduce((sum, value) => sum + value, 0) / values.length)}\nMin: ${Math.min(...values)}\nMax: ${Math.max(...values)}`;
  }, 'CSV spreadsheet column numeric statistics average sum', { fields: [{ name: 'column', label: 'Column name', type: 'text', defaultValue: '' }] }),
  makeTool('csv-column-to-json-array', 'CSV Column to JSON Array', 'Extract one CSV column by header into a JSON string array.', (input, options) => {
    const rows = input.split(/\r\n|\r|\n/).map(line => line.split(','));
    const index = rows[0]?.findIndex(header => header.trim().replace(/^"|"$/g, '') === options.column);
    if (index == null || index < 0) throw new Error(`Column "${options.column}" was not found.`);
    return JSON.stringify(rows.slice(1).map(row => (row[index] || '').replace(/^"|"$/g, '').replaceAll('""', '"')));
  }, 'CSV column extract JSON list array', { fields: [{ name: 'column', label: 'Column name', type: 'text', defaultValue: '' }] }),
  makeTool('csv-transpose-with-headers', 'CSV Pivot Transpose', 'Transpose a rectangular CSV table while adding stable row and column labels.', input => {
    const rows = input.split(/\r\n|\r|\n/).filter(Boolean).map(line => line.split(','));
    if (!rows.length || rows.some(row => row.length !== rows[0].length)) throw new Error('Enter a rectangular CSV table with the same number of columns per row.');
    return rows[0].map((_, column) => rows.map(row => row[column]).join(',')).join('\n');
  }, 'CSV transpose matrix pivot rows columns'),
  makeTool('text-lines-to-csv-column', 'Text Lines to CSV Column', 'Convert one item per line into a safely quoted single-column CSV file.', input => input.split(/\r\n|\r|\n/).map(value => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value).join('\n'), 'lines convert single column CSV spreadsheet export'),
  makeTool('markdown-table-to-json', 'Markdown Table to JSON', 'Convert a simple Markdown table into a JSON array of objects.', input => {
    const rows = input.split(/\r\n|\r|\n/).filter(line => line.includes('|')).map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
    const content = rows.filter(row => !row.every(cell => /^:?-{3,}:?$/.test(cell)));
    if (content.length < 2) throw new Error('Include a Markdown table with a header and at least one row.');
    const [headers, ...data] = content;
    if (data.some(row => row.length !== headers.length)) throw new Error('Every row must have the same number of columns as the header.');
    return JSON.stringify(data.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]]))), null, 2);
  }, 'Markdown table convert JSON parse'),
  makeTool('markdown-table-aligner', 'Markdown Table Aligner', 'Reformat a simple Markdown table with aligned cell widths.', input => {
    const rows = input.split(/\r\n|\r|\n/).filter(line => line.includes('|')).map(line => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));
    if (rows.length < 2) throw new Error('Enter a Markdown table with a header and a separator row.');
    const widths = rows[0].map((_, index) => Math.max(3, ...rows.filter((_, rowIndex) => rowIndex !== 1).map(row => row[index]?.length || 0)));
    const format = row => `| ${widths.map((width, index) => (row[index] || '').padEnd(width)).join(' | ')} |`;
    const separator = `| ${widths.map(width => '-'.repeat(width)).join(' | ')} |`;
    return rows.map((row, index) => format(index === 1 ? widths.map(width => '-'.repeat(width)) : row)).join('\n').replace(format(widths.map(width => '-'.repeat(width))), separator);
  }, 'Markdown table format align columns'),
  makeTool('text-to-sql-in-list', 'Text Lines to SQL IN List', 'Escape values and generate a SQL IN-list expression from one value per line.', input => {
    const values = input.split(/\r\n|\r|\n/).filter(Boolean);
    if (!values.length) throw new Error('Enter one or more values.');
    return `(${values.map(value => `'${value.replaceAll("'", "''")}'`).join(', ')})`;
  }, 'SQL IN clause list quotes escape SQL values'),
  makeTool('json-lines-formatter', 'JSON Lines Formatter', 'Pretty-print each line-delimited JSON document independently.', input => input.split(/\r\n|\r|\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.stringify(JSON.parse(line), null, 2); } catch (error) { throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`); }
  }).join('\n\n'), 'format pretty print multiple JSON lines'),
  makeTool('json-array-chunker', 'JSON Array Chunker', 'Split a JSON array into smaller arrays of a chosen maximum size.', (input, options) => {
    const data = JSON.parse(input);
    const size = Number(options.size);
    if (!Array.isArray(data)) throw new Error('Enter a JSON array.');
    if (!Number.isInteger(size) || size < 1 || size > 10000) throw new Error('Chunk size must be a whole number from 1 to 10,000.');
    const chunks = [];
    for (let index = 0; index < data.length; index += size) chunks.push(data.slice(index, index + size));
    return JSON.stringify(chunks, null, 2);
  }, 'JSON array split chunks batches page size', { fields: [{ name: 'size', label: 'Maximum items per chunk', type: 'number', defaultValue: '100' }] }),
  makeTool('json-array-slicer', 'JSON Array Slice Tool', 'Select a zero-based range from a JSON array.', (input, options) => {
    const data = JSON.parse(input);
    const start = Number(options.start);
    const end = Number(options.end);
    if (!Array.isArray(data)) throw new Error('Enter a JSON array.');
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) throw new Error('Enter a valid zero-based start and exclusive end index.');
    return JSON.stringify(data.slice(start, end), null, 2);
  }, 'JSON array slice select range items', { fields: [{ name: 'start', label: 'Start index (inclusive)', type: 'number', defaultValue: '0' }, { name: 'end', label: 'End index (exclusive)', type: 'number', defaultValue: '10' }] }),
  makeTool('json-numeric-key-sorter', 'JSON Numeric Key Sorter', 'Sort top-level JSON object keys alphabetically and format the result.', input => {
    const data = JSON.parse(input);
    if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Enter a JSON object.');
    return JSON.stringify(Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))), null, 2);
  }, 'JSON sort keys alphabetic natural order'),
  makeTool('query-parameter-table', 'URL Query Parameter Table', 'Parse URL query parameters and display each decoded key/value pair.', input => {
    let params;
    try { params = new URL(input.trim()).searchParams; } catch { params = new URLSearchParams(input.trim().replace(/^[^?]*\?/, '').replace(/^\?/, '')); }
    const entries = [...params.entries()];
    if (!entries.length) return 'No query parameters found.';
    return ['Parameter | Value', '--- | ---', ...entries.map(([key, value]) => `${key.replaceAll('|', '\\|')} | ${value.replaceAll('|', '\\|')}`)].join('\n');
  }, 'URL query parameters decode inspect list table'),
  makeTool('form-url-encoder', 'Form URL Encoder', 'Encode newline-separated key=value pairs as application/x-www-form-urlencoded data.', input => {
    const pairs = input.split(/\r\n|\r|\n/).filter(Boolean).map(line => {
      const separator = line.indexOf('=');
      if (separator < 1) throw new Error(`Expected key=value on line: ${line}`);
      return [line.slice(0, separator).trim(), line.slice(separator + 1)];
    });
    return new URLSearchParams(pairs).toString();
  }, 'application/x-www-form-urlencoded encode form fields'),
  makeTool('http-curl-header-parser', 'Curl Header to JSON Parser', 'Convert pasted curl -H header arguments into a JSON header object.', input => {
    const headers = {};
    for (const match of input.matchAll(/(?:-H|--header)\s+(['"])(.*?)\1/g)) {
      const separator = match[2].indexOf(':');
      if (separator < 1) throw new Error(`Invalid header: ${match[2]}`);
      headers[match[2].slice(0, separator).trim()] = match[2].slice(separator + 1).trim();
    }
    if (!Object.keys(headers).length) throw new Error('No -H or --header arguments were found.');
    return JSON.stringify(headers, null, 2);
  }, 'curl command parse headers JSON HTTP request'),
  makeTool('json-escape-html', 'JSON HTML Safe Escaper', 'Escape a JSON string for safe embedding inside an HTML script element.', input => {
    const json = JSON.stringify(JSON.parse(input));
    return json.replace(/[<>&\u2028\u2029]/g, character => ({
      '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029'
    })[character]);
  }, 'JSON escape HTML script embedding XSS safe serialization'),
  makeTool('json-type-summary', 'JSON Type Summary', 'Summarize the types and counts of JSON values recursively.', input => {
    const counts = { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 };
    const visit = value => {
      if (value === null) counts.null += 1;
      else if (Array.isArray(value)) { counts.array += 1; value.forEach(visit); }
      else if (typeof value === 'object') { counts.object += 1; Object.values(value).forEach(visit); }
      else counts[typeof value] += 1;
    };
    visit(JSON.parse(input));
    return Object.entries(counts).filter(([, count]) => count).map(([type, count]) => `${type}: ${count}`).join('\n');
  }, 'JSON inspect schema type counts values'),
  makeTool('csv-to-jsonl-converter', 'CSV to JSON Lines Converter', 'Convert a CSV table with a header row into newline-delimited JSON objects.', input => {
    const rows = input.split(/\r\n|\r|\n/).filter(Boolean).map(line => line.split(',').map(value => value.trim().replace(/^"|"$/g, '').replaceAll('""', '"')));
    if (rows.length < 2) throw new Error('Include a header row and at least one data row.');
    const [headers, ...data] = rows;
    if (data.some(row => row.length !== headers.length)) throw new Error('CSV rows must have the same number of fields as the header.');
    return data.map(row => JSON.stringify(Object.fromEntries(headers.map((header, index) => [header, row[index]])))).join('\n');
  }, 'CSV convert JSONL NDJSON records'),
  makeTool('csv-column-renamer', 'CSV Column Renamer', 'Rename a CSV column in the header without changing its data rows.', (input, options) => {
    const [header, ...rows] = input.split(/\r\n|\r|\n/);
    const columns = header.split(',');
    const index = columns.findIndex(value => value.trim().replace(/^"|"$/g, '') === options.from);
    if (index < 0) throw new Error(`Column "${options.from}" was not found.`);
    if (!options.to.trim()) throw new Error('Enter a replacement column name.');
    columns[index] = /[",\r\n]/.test(options.to) ? `"${options.to.replaceAll('"', '""')}"` : options.to;
    return [columns.join(','), ...rows].join('\n');
  }, 'CSV rename header column spreadsheet', { fields: [{ name: 'from', label: 'Current column', type: 'text', defaultValue: '' }, { name: 'to', label: 'New column name', type: 'text', defaultValue: '' }] })
];

const developerTools = [
  makeTool('javascript-string-escaper', 'JavaScript String Literal Escaper', 'Escape arbitrary text for inclusion in a single-quoted or double-quoted JavaScript string literal.', (input, options) => options.quote === 'single'
    ? `'${input.replaceAll('\\', '\\\\').replaceAll("'", "\\'").replaceAll('\n', '\\n').replaceAll('\r', '\\r')}'`
    : `"${JSON.stringify(input).slice(1, -1)}"`, 'JavaScript string literal escape quote source code', { fields: [{ name: 'quote', label: 'Quote style', type: 'select', defaultValue: 'double', options: [['double', 'Double quotes'], ['single', 'Single quotes']] }] }),
  makeTool('regex-match-counter', 'Regex Match Counter', 'Count regular-expression matches and show each captured full match.', (input, options) => {
    if (options.pattern.length > 300) throw new Error('Patterns are limited to 300 characters.');
    let regex;
    try { regex = new RegExp(options.pattern, `${options.flags.includes('g') ? '' : 'g'}${options.flags.replace(/[^imsuy]/g, '')}`); }
    catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
    const matches = [...input.matchAll(regex)].slice(0, 1000);
    return `Match count: ${matches.length}${matches.length ? `\n${matches.map((match, index) => `${index + 1}. ${match[0]}`).join('\n')}` : ''}`;
  }, 'regex count matches regular expression test', { fields: [{ name: 'pattern', label: 'Pattern', type: 'text', defaultValue: '' }, { name: 'flags', label: 'Flags', type: 'text', defaultValue: 'gi' }] }),
  makeTool('regex-group-inspector', 'Regex Capture Group Inspector', 'Inspect capture groups for every regular-expression match.', (input, options) => {
    let regex;
    try { regex = new RegExp(options.pattern, options.flags.includes('g') ? options.flags : `${options.flags}g`); }
    catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
    const matches = [...input.matchAll(regex)].slice(0, 500);
    if (!matches.length) return 'No matches found.';
    return matches.map((match, index) => `Match ${index + 1}: ${JSON.stringify(match[0])}${match.slice(1).map((group, groupIndex) => `\n  Group ${groupIndex + 1}: ${JSON.stringify(group ?? null)}`).join('')}`).join('\n');
  }, 'regex capture groups inspect extract captures', { fields: [{ name: 'pattern', label: 'Pattern', type: 'text', defaultValue: '' }, { name: 'flags', label: 'Flags', type: 'text', defaultValue: 'g' }] }),
  makeTool('regex-test-case-generator', 'Regex Test Case Generator', 'Test a regex against one candidate string and report whether it matches.', (input, options) => {
    try { return new RegExp(options.pattern, options.flags).test(input) ? 'Match: yes' : 'Match: no'; }
    catch (error) { throw new Error(`Invalid regular expression: ${error.message}`); }
  }, 'regex test pattern candidate does match', { fields: [{ name: 'pattern', label: 'Pattern', type: 'text', defaultValue: '' }, { name: 'flags', label: 'Flags', type: 'text', defaultValue: '' }] }),
  makeTool('json-pointer-escape-tool', 'JSON Pointer Escape Tool', 'Escape a JSON object key for use as one RFC 6901 JSON Pointer segment.', input => input.replace(/~/g, '~0').replace(/\//g, '~1'), 'JSON Pointer RFC 6901 escape slash tilde key'),
  makeTool('json-pointer-unescape-tool', 'JSON Pointer Unescape Tool', 'Decode one RFC 6901 JSON Pointer segment, rejecting invalid escape sequences.', input => {
    if (/~(?![01])/.test(input)) throw new Error('Invalid JSON Pointer escape. Use ~0 for tilde and ~1 for slash.');
    return input.replace(/~1/g, '/').replace(/~0/g, '~');
  }, 'JSON Pointer RFC 6901 unescape decode segment'),
  makeTool('html-attribute-escaper', 'HTML Attribute Value Escaper', 'Escape text for safe use as a quoted HTML attribute value.', input => input.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]), 'HTML attribute escape encode quote ampersand'),
  makeTool('css-identifier-escaper', 'CSS Identifier Escaper', 'Escape a string as a CSS identifier using the standards-based CSS.escape API.', input => {
    if (!globalThis.CSS?.escape) throw new Error('CSS.escape is not supported in this browser.');
    return CSS.escape(input);
  }, 'CSS identifier escape selector class id'),
  makeTool('html-tag-counter', 'HTML Tag Counter', 'Count opening HTML tags from pasted markup and summarize the most common tag names.', input => {
    const counts = new Map();
    for (const match of input.matchAll(/<\s*([a-z][\w:-]*)\b[^>]*>/gi)) {
      const tag = match[1].toLowerCase();
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return counts.size ? [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag, count]) => `<${tag}>: ${count}`).join('\n') : 'No HTML tags found.';
  }, 'HTML markup count elements tags analyze'),
  makeTool('markdown-heading-auditor', 'Markdown Heading Auditor', 'List Markdown heading levels and flag skipped heading levels.', input => {
    const headings = [...input.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(match => ({ level: match[1].length, text: match[2].trim() }));
    if (!headings.length) return 'No Markdown headings found.';
    const issues = [];
    headings.forEach((heading, index) => {
      if (index && heading.level > headings[index - 1].level + 1) issues.push(`Heading "${heading.text}" skips from H${headings[index - 1].level} to H${heading.level}.`);
    });
    return `${headings.map(heading => `H${heading.level}: ${heading.text}`).join('\n')}\n\n${issues.length ? `Hierarchy issues:\n${issues.join('\n')}` : 'Heading levels do not skip.'}`;
  }, 'Markdown heading outline accessibility hierarchy H1 H2'),
  makeTool('markdown-link-auditor', 'Markdown Link Auditor', 'Extract Markdown links and classify absolute URLs, relative paths, and anchors.', input => {
    const links = [...input.matchAll(/!?\[([^\]]*)\]\(([^)]+)\)/g)].map(([, label, target]) => {
      let kind = 'relative path';
      try { kind = new URL(target).protocol === 'https:' ? 'HTTPS URL' : new URL(target).protocol === 'http:' ? 'HTTP URL' : 'non-web URL'; }
      catch { if (target.startsWith('#')) kind = 'page anchor'; }
      return `${kind}: ${label || '(no label)'} → ${target}`;
    });
    return links.length ? links.join('\n') : 'No Markdown links found.';
  }, 'Markdown audit links URLs anchors targets'),
  makeTool('sql-identifier-escaper', 'SQL Identifier Escaper', 'Quote an SQL identifier using standard double quotes, escaping embedded quotes.', input => `"${input.replaceAll('"', '""')}"`, 'SQL identifier quote escape table column name'),
  makeTool('sql-string-literal-escaper', 'SQL String Literal Escaper', 'Quote an SQL text literal and escape apostrophes using SQL-standard doubling.', input => `'${input.replaceAll("'", "''")}'`, 'SQL string literal quote escape apostrophe'),
  makeTool('url-component-inspector', 'URL Component Inspector', 'Parse an HTTP or HTTPS URL into protocol, host, port, path, query, and fragment.', input => {
    let url;
    try { url = new URL(input.trim()); } catch { throw new Error('Enter a valid absolute URL.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
    return `Protocol: ${url.protocol}\nHostname: ${url.hostname}\nPort: ${url.port || '(default)'}\nPath: ${url.pathname}\nQuery: ${url.search || '(none)'}\nFragment: ${url.hash || '(none)'}\nUsername present: ${Boolean(url.username)}\nPassword present: ${Boolean(url.password)}`;
  }, 'URL parse inspect protocol hostname port path query fragment'),
  makeTool('url-path-encoder', 'URL Path Segment Encoder', 'Encode a single path segment without leaving slashes, spaces, or reserved characters unescaped.', input => encodeURIComponent(input).replaceAll("'", '%27').replaceAll('!', '%21').replaceAll('*', '%2A').replaceAll('(', '%28').replaceAll(')', '%29'), 'URL encode path segment slash URI component'),
  makeTool('url-fragment-encoder', 'URL Fragment Encoder', 'Encode text for safe use as a URL fragment identifier.', input => encodeURIComponent(input).replaceAll("'", '%27'), 'URL hash fragment encode anchor'),
  makeTool('slug-case-converter', 'Identifier Case Converter', 'Convert identifiers to camelCase, PascalCase, snake_case, kebab-case, or CONSTANT_CASE.', (input, options) => {
    const words = input.replace(/([a-z\d])([A-Z])/g, '$1 $2').match(/[\p{Letter}\p{Number}]+/gu) || [];
    if (!words.length) throw new Error('Enter a name containing letters or numbers.');
    const lower = words.map(word => word.toLowerCase());
    if (options.mode === 'snake') return lower.join('_');
    if (options.mode === 'kebab') return lower.join('-');
    if (options.mode === 'constant') return lower.join('_').toUpperCase();
    const pascal = lower.map(word => word[0].toUpperCase() + word.slice(1)).join('');
    return options.mode === 'pascal' ? pascal : pascal[0].toLowerCase() + pascal.slice(1);
  }, 'convert identifier camelCase PascalCase snake_case kebab-case CONSTANT_CASE', { fields: [{ name: 'mode', label: 'Identifier style', type: 'select', defaultValue: 'camel', options: [['camel', 'camelCase'], ['pascal', 'PascalCase'], ['snake', 'snake_case'], ['kebab', 'kebab-case'], ['constant', 'CONSTANT_CASE']] }] }),
  makeTool('text-to-quoted-list', 'Text to Quoted List', 'Quote each line as a JavaScript/JSON-compatible string and join with a chosen delimiter.', (input, options) => input.split(/\r\n|\r|\n/).filter(Boolean).map(value => JSON.stringify(value)).join(options.delimiter), 'quote lines join list strings SQL JavaScript array', { fields: [{ name: 'delimiter', label: 'Join with', type: 'select', defaultValue: ', ', options: [[', ', 'Comma'], ['\n', 'New line'], [' | ', 'Pipe']] }] }),
  makeTool('source-line-extractor', 'Source Line Range Extractor', 'Extract an inclusive line range from pasted source code.', (input, options) => {
    const lines = input.split(/\r\n|\r|\n/);
    const start = Number(options.start);
    const end = Number(options.end);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || start > lines.length) throw new Error(`Enter a valid 1-based line range from 1 to ${lines.length}.`);
    return lines.slice(start - 1, Math.min(end, lines.length)).join('\n');
  }, 'extract source code lines line range', { fields: [{ name: 'start', label: 'Start line (1-based)', type: 'number', defaultValue: '1' }, { name: 'end', label: 'End line (inclusive)', type: 'number', defaultValue: '10' }] }),
  makeTool('line-wrap-tool', 'Text Line Wrapper', 'Wrap text at a specified character width while preserving words.', (input, options) => {
    const width = Number(options.width);
    if (!Number.isInteger(width) || width < 10 || width > 500) throw new Error('Line width must be a whole number from 10 to 500.');
    return input.split(/\r\n|\r|\n/).map(line => {
      const words = line.split(/\s+/).filter(Boolean);
      const lines = [];
      let current = '';
      for (const word of words) {
        if (word.length > width) {
          if (current) lines.push(current);
          for (let index = 0; index < word.length; index += width) lines.push(word.slice(index, index + width));
          current = '';
        } else if (current && current.length + word.length + 1 > width) {
          lines.push(current);
          current = word;
        } else current = current ? `${current} ${word}` : word;
      }
      if (current) lines.push(current);
      return lines.join('\n');
    }).join('\n');
  }, 'wrap text lines character width word wrap', { fields: [{ name: 'width', label: 'Maximum characters per line', type: 'number', defaultValue: '80' }] }),
  makeTool('text-prefix-suffix-tool', 'Text Prefix & Suffix Tool', 'Add a prefix and/or suffix to every line of text.', (input, options) => input.split(/\r\n|\r|\n/).map(line => `${options.prefix}${line}${options.suffix}`).join('\n'), 'text lines prepend append prefix suffix each line', { fields: [{ name: 'prefix', label: 'Prefix', type: 'text', defaultValue: '' }, { name: 'suffix', label: 'Suffix', type: 'text', defaultValue: '' }] }),
  makeTool('unicode-codepoint-inspector', 'Unicode Code Point Inspector', 'Inspect each Unicode character’s decimal value, hexadecimal code point, and UTF-8 byte length.', input => [...input].map(char => `${JSON.stringify(char)}\tU+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}\t${char.codePointAt(0)}\t${new TextEncoder().encode(char).length} UTF-8 byte(s)`).join('\n'), 'Unicode code point inspect decimal hex UTF-8 characters'),
  makeTool('text-whitespace-visualizer', 'Whitespace Visualizer', 'Make spaces, tabs, line endings, and non-breaking spaces visible for debugging.', input => input.replace(/ /g, '·').replace(/\t/g, '→\t').replace(/\u00a0/g, '⍽').replace(/\r\n/g, '↵\n').replace(/\r/g, '␍').replace(/\n/g, '↵\n'), 'debug invisible whitespace tabs spaces line endings'),
  makeTool('text-frequency-table', 'Word Frequency Table', 'Count word frequency and rank common words in pasted text.', (input, options) => {
    const words = input.toLocaleLowerCase().match(/[\p{Letter}\p{Number}]+(?:['’-][\p{Letter}\p{Number}]+)*/gu) || [];
    if (!words.length) return 'No words found.';
    const counts = new Map();
    words.forEach(word => { if (options.ignoreCommon === 'yes' && ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'was', 'were', 'with'].includes(word)) return; counts.set(word, (counts.get(word) || 0) + 1); });
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 100).map(([word, count]) => `${word}\t${count}`).join('\n');
  }, 'word frequency counter rank term corpus', { fields: [{ name: 'ignoreCommon', label: 'Ignore common English words', type: 'select', defaultValue: 'no', options: [['no', 'No'], ['yes', 'Yes']] }] }),
  makeTool('text-duplicate-word-finder', 'Repeated Word Finder', 'Find consecutive repeated words, a common typing and copy-editing error.', input => {
    const matches = [...input.matchAll(/\b([\p{Letter}\p{Number}]+)\s+\1\b/giu)];
    return matches.length ? matches.map(match => `Line ${input.slice(0, match.index).split(/\r\n|\r|\n/).length}: ${match[0]}`).join('\n') : 'No consecutive repeated words found.';
  }, 'proofread repeated duplicate consecutive words typo'),
  makeTool('text-smart-quotes-converter', 'Smart Quotes Converter', 'Convert straight quotes to typographic curly quotes or normalize curly quotes to straight quotes.', (input, options) => options.mode === 'straight'
    ? input.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    : input.replace(/"([^"\n]*)"/g, '“$1”').replace(/'([^'\n]*)'/g, '‘$1’'), 'text typography curly smart quotes straight quotes', { fields: [{ name: 'mode', label: 'Quote style', type: 'select', defaultValue: 'curly', options: [['curly', 'Smart curly quotes'], ['straight', 'Straight quotes']] }] }),
  makeTool('text-reading-time-estimator', 'Reading Time Estimator', 'Estimate reading duration at a selected words-per-minute pace.', (input, options) => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const rate = Number(options.rate);
    if (!Number.isFinite(rate) || rate < 50 || rate > 1500) throw new Error('Reading speed must be from 50 to 1,500 words per minute.');
    const minutes = words / rate;
    return `Words: ${words}\nReading speed: ${rate} words/minute\nEstimated reading time: ${Math.floor(minutes)} min ${Math.round((minutes % 1) * 60)} sec`;
  }, 'estimate reading time word count pace speaking duration', { fields: [{ name: 'rate', label: 'Words per minute', type: 'number', defaultValue: '225' }] })
];

const dateTools = [
  makeTool('world-clock', 'Exact Current Time & World Clock', 'Get the exact current time, date, time-zone offset, and UTC timestamp for your device or any IANA time zone.', async (_input, options) => {
    const aliases = { tokyo: 'Asia/Tokyo', london: 'Europe/London', paris: 'Europe/Paris', berlin: 'Europe/Berlin', 'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles', chicago: 'America/Chicago', denver: 'America/Denver', sydney: 'Australia/Sydney', singapore: 'Asia/Singapore', dubai: 'Asia/Dubai', kolkata: 'Asia/Kolkata', mumbai: 'Asia/Kolkata', delhi: 'Asia/Kolkata', utc: 'UTC' };
    const requested = options.timeZone.trim();
    const timeZone = aliases[requested.toLowerCase()] || requested || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const response = await fetch(`/api/time?timeZone=${encodeURIComponent(timeZone)}`, { cache: 'no-store' });
      let data;
      try { data = await response.json(); } catch { throw new Error('The time service returned an invalid response.'); }
      if (!response.ok) throw new Error(data.error || 'The time service could not provide the requested time zone.');
      return `Current time in ${data.timeZone}: ${data.time}\nUTC offset: ${data.utcOffset}\nUTC now: ${data.iso}\nUnix timestamp: ${data.unixSeconds}`;
    } catch (error) {
      if (error instanceof TypeError) throw new Error('Could not reach the server time service. Check your connection and try again.');
      throw error;
    }
  }, 'exact current local world time clock timezone UTC offset date now', { requiresInput: false, fields: [{ name: 'timeZone', label: 'IANA time zone or city (optional)', type: 'text', defaultValue: '' }], assistantMatch: /\b(?:current|local|exact|world)\s+time\b|\btime\s+(?:in|at|now)\b|\bwhat time is it\b/i }),
  makeTool('date-adder-calculator', 'Date & Duration Calculator', 'Add or subtract calendar days from a date and report the resulting weekday.', (input, options) => {
    const date = new Date(input.trim());
    const amount = Number(options.days);
    if (Number.isNaN(date.getTime()) || !Number.isInteger(amount) || Math.abs(amount) > 100000) throw new Error('Enter a valid date and whole-day offset between -100,000 and 100,000.');
    date.setUTCDate(date.getUTCDate() + amount);
    return `Result: ${date.toISOString()}\nWeekday: ${new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(date)}\nDays added: ${amount}`;
  }, 'date add subtract days date arithmetic weekday', { fields: [{ name: 'days', label: 'Days to add (negative subtracts)', type: 'number', defaultValue: '7' }], placeholder: 'Enter an ISO date, such as 2026-01-31.' }),
  makeTool('date-week-number-calculator', 'ISO Week Number Calculator', 'Find the ISO-8601 week number, week-year, and weekday for a date.', input => {
    const date = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date such as 2026-11-09.');
    const thursday = new Date(date);
    thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
    firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - (firstThursday.getUTCDay() || 7));
    return `ISO week: ${Math.ceil(((thursday - firstThursday) / 86400000 + 1) / 7)}\nWeek-year: ${thursday.getUTCFullYear()}\nWeekday: ${new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(date)}`;
  }, 'ISO week number week year date calendar'),
  makeTool('leap-year-checker', 'Leap Year Checker', 'Check whether a year is a leap year in the Gregorian calendar.', input => {
    const year = Number(input.trim());
    if (!Number.isInteger(year) || year < 1 || year > 9999) throw new Error('Enter a year from 1 to 9999.');
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return `${year} is ${leap ? '' : 'not '}a leap year.\nDays in year: ${leap ? 366 : 365}`;
  }, 'leap year check Gregorian calendar February 29'),
  makeTool('date-to-day-of-year', 'Day of Year Calculator', 'Calculate the ordinal day number and remaining days in the year for a date.', input => {
    const date = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date such as 2026-11-09.');
    const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
    const day = Math.floor((date.getTime() - yearStart) / 86400000) + 1;
    const yearDays = (date.getUTCFullYear() % 4 === 0 && (date.getUTCFullYear() % 100 !== 0 || date.getUTCFullYear() % 400 === 0)) ? 366 : 365;
    return `Day of year: ${day}\nDays remaining: ${yearDays - day}\nYear length: ${yearDays}`;
  }, 'date ordinal day of year days remaining calendar'),
  makeTool('date-month-length-calculator', 'Days in Month Calculator', 'Count the days in a specified Gregorian month and year.', input => {
    const [year, month] = input.trim().split(/[-/,.\s]+/).map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1 || year > 9999 || month < 1 || month > 12) throw new Error('Enter a year and month, for example 2024, 2.');
    return `${year}-${String(month).padStart(2, '0')} has ${new Date(Date.UTC(year, month, 0)).getUTCDate()} days.`;
  }, 'days in month calendar number February month length', { placeholder: 'Enter year and month, such as 2024, 2.' }),
  makeTool('date-countdown-calculator', 'Date Countdown Calculator', 'Calculate the time remaining until a target date from the current instant.', input => {
    const target = new Date(input.trim());
    if (Number.isNaN(target.getTime())) throw new Error('Enter a valid target date and time.');
    const milliseconds = target.getTime() - Date.now();
    const absolute = Math.abs(milliseconds);
    const days = Math.floor(absolute / 86400000);
    const hours = Math.floor(absolute % 86400000 / 3600000);
    const minutes = Math.floor(absolute % 3600000 / 60000);
    return `${milliseconds >= 0 ? 'Time remaining' : 'Time elapsed'}: ${days} days, ${hours} hours, ${minutes} minutes\nTarget UTC: ${target.toISOString()}`;
  }, 'date countdown timer until deadline time remaining', { placeholder: 'Enter a target date, e.g. 2027-01-01T00:00:00Z.' }),
  makeTool('date-day-count-calculator', 'Exact Days Between Dates', 'Calculate signed and absolute elapsed days between two calendar dates.', (input, options) => {
    const start = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    const end = new Date(`${options.end.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Enter valid ISO dates, such as 2026-01-01.');
    const signedDays = (end - start) / 86400000;
    return `Signed difference: ${signedDays} days\nAbsolute difference: ${Math.abs(signedDays)} days\nWeeks: ${formatNumber(Math.abs(signedDays) / 7)}`;
  }, 'date difference days between dates elapsed calendar duration', { fields: [{ name: 'end', label: 'End date (ISO)', type: 'text', defaultValue: '' }], placeholder: 'Enter the start date in ISO format.' }),
  makeTool('business-day-calculator', 'Business Days Between Dates', 'Count weekdays between two dates, excluding the end date; public holidays are not included.', (input, options) => {
    const start = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    const end = new Date(`${options.end.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Enter valid ISO dates, such as 2026-01-01.');
    let count = 0;
    const direction = start <= end ? 1 : -1;
    for (const date = new Date(start); direction > 0 ? date < end : date > end; date.setUTCDate(date.getUTCDate() + direction)) {
      if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) count += direction;
    }
    return `Weekdays (excluding end date): ${count}\nPublic holidays are not included.`;
  }, 'business days weekdays working days between two dates', { fields: [{ name: 'end', label: 'End date (ISO)', type: 'text', defaultValue: '' }], placeholder: 'Enter the start date in ISO format.' }),
  makeTool('age-calculator', 'Age & Anniversary Calculator', 'Calculate age in completed years, months, and days from a birth date.', input => {
    const birth = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) throw new Error('Enter a valid birth date in the past.');
    const today = new Date();
    let years = today.getUTCFullYear() - birth.getUTCFullYear();
    let months = today.getUTCMonth() - birth.getUTCMonth();
    let days = today.getUTCDate() - birth.getUTCDate();
    if (days < 0) { months -= 1; days += new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).getUTCDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return `Age: ${years} years, ${months} months, ${days} days\nBirth date: ${birth.toISOString().slice(0, 10)}\nCurrent UTC date: ${today.toISOString().slice(0, 10)}`;
  }, 'age calculator birthday age years months days'),
  makeTool('date-quarter-calculator', 'Calendar Quarter Calculator', 'Find the calendar quarter and first and last dates for a supplied date.', input => {
    const date = new Date(`${input.trim().slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date such as 2026-11-09.');
    const firstMonth = Math.floor(date.getUTCMonth() / 3) * 3;
    return `Quarter: Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}\nStarts: ${new Date(Date.UTC(date.getUTCFullYear(), firstMonth, 1)).toISOString().slice(0, 10)}\nEnds: ${new Date(Date.UTC(date.getUTCFullYear(), firstMonth + 3, 0)).toISOString().slice(0, 10)}`;
  }, 'calendar quarter financial fiscal date Q1 Q2 Q3 Q4')
];

export const ADVANCED_TOOLS = [
  ...mathTools,
  ...geometryTools,
  ...physicsTools,
  ...conversionTools,
  ...dataTools,
  ...developerTools,
  ...dateTools
];
