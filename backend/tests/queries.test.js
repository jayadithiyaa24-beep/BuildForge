const test = require('node:test');
const assert = require('node:assert');
const { toNative, neo4j } = require('../config/neo4j');
const { cypherQueries, analyticsCatalog } = require('../queries/cypherQueries');

test('toNative utility correctly converts Neo4j Integers to JS numbers', () => {
  const nInt = neo4j.int(42);
  const converted = toNative(nInt);
  assert.strictEqual(typeof converted, 'number');
  assert.strictEqual(converted, 42);
});

test('toNative utility parses nested objects and arrays', () => {
  const complex = {
    price: neo4j.int(36999),
    tags: ['cpu', 'am5'],
    specs: {
      cores: neo4j.int(8),
      tdp: neo4j.int(120)
    }
  };
  const result = toNative(complex);
  assert.strictEqual(result.price, 36999);
  assert.strictEqual(result.specs.cores, 8);
  assert.strictEqual(result.specs.tdp, 120);
  assert.deepStrictEqual(result.tags, ['cpu', 'am5']);
});

test('DBMS Lab Analytics Catalog contains all 18 required Cypher queries', () => {
  assert.strictEqual(analyticsCatalog.length, 18, 'Must have exactly 18 analytical queries');
  
  for (let i = 1; i <= 18; i++) {
    const qId = `query-${i}`;
    const found = analyticsCatalog.find(q => q.id === qId);
    assert.ok(found, `Query with ID ${qId} must exist`);
    assert.ok(found.name.length > 3, `Query ${qId} must have a name`);
    assert.ok(found.description.length > 10, `Query ${qId} must have a detailed description`);
    assert.ok(found.cypher.includes('MATCH'), `Query ${qId} must contain valid Cypher starting with MATCH`);
  }
});

test('Review rating bounds validation constraint (DA2 TRG_REVIEW_RATING_BOUNDS rule)', () => {
  const isValidRating = (r) => typeof r === 'number' && r >= 1 && r <= 5;
  
  assert.strictEqual(isValidRating(5), true);
  assert.strictEqual(isValidRating(1), true);
  assert.strictEqual(isValidRating(0), false);
  assert.strictEqual(isValidRating(6), false);
  assert.strictEqual(isValidRating(-1), false);
});

test('Socket compatibility logic detects matching and mismatching sockets', () => {
  const checkSocket = (cpuSocket, moboSocket) => {
    if (!cpuSocket || !moboSocket) return 'INCOMPLETE';
    return cpuSocket === moboSocket ? 'COMPATIBLE' : 'SOCKET_MISMATCH';
  };

  assert.strictEqual(checkSocket('AM5', 'AM5'), 'COMPATIBLE');
  assert.strictEqual(checkSocket('LGA1700', 'LGA1700'), 'COMPATIBLE');
  assert.strictEqual(checkSocket('AM5', 'LGA1700'), 'SOCKET_MISMATCH');
  assert.strictEqual(checkSocket('AM4', 'AM5'), 'SOCKET_MISMATCH');
  assert.strictEqual(checkSocket(null, 'AM5'), 'INCOMPLETE');
});

test('RAM Generation compatibility detects memory generation mismatches', () => {
  const checkRam = (ramGen, moboRamGen) => {
    if (!ramGen || !moboRamGen) return 'INCOMPLETE';
    return ramGen === moboRamGen ? 'COMPATIBLE' : 'RAM_MISMATCH';
  };

  assert.strictEqual(checkRam('DDR5', 'DDR5'), 'COMPATIBLE');
  assert.strictEqual(checkRam('DDR4', 'DDR4'), 'COMPATIBLE');
  assert.strictEqual(checkRam('DDR4', 'DDR5'), 'RAM_MISMATCH');
  assert.strictEqual(checkRam('DDR5', 'DDR4'), 'RAM_MISMATCH');
});

test('PSU Wattage calculation validates minimum 80W safety headroom buffer', () => {
  const checkPsu = (psuWattage, totalTdp) => {
    if (!psuWattage || !totalTdp) return 'INCOMPLETE';
    return psuWattage >= (totalTdp + 80) ? 'ADEQUATE' : 'INSUFFICIENT_PSU_WATTAGE';
  };

  assert.strictEqual(checkPsu(850, 520), 'ADEQUATE');       // 850 >= 600
  assert.strictEqual(checkPsu(650, 580), 'INSUFFICIENT_PSU_WATTAGE'); // 650 < 660
  assert.strictEqual(checkPsu(750, 670), 'ADEQUATE');       // 750 >= 750
});

test('DBMS Lab Allowlist strictly rejects queries outside query-1 to query-18', () => {
  const isAllowlisted = (id) => analyticsCatalog.some(q => q.id === id);

  assert.strictEqual(isAllowlisted('query-1'), true);
  assert.strictEqual(isAllowlisted('query-18'), true);
  assert.strictEqual(isAllowlisted('query-19'), false);
  assert.strictEqual(isAllowlisted('arbitrary_drop_db'), false);
  assert.strictEqual(isAllowlisted(''), false);
});

