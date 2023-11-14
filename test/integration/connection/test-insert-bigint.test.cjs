'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');
const Long = require('long');

connection.query(
  [
    'CREATE TEMPORARY TABLE `bigs` (',
    '`id` bigint NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
);

connection.query("INSERT INTO bigs SET title='test', id=123");
connection.query("INSERT INTO bigs SET title='test1'", (err, result) => {
  if (err) {
    throw err;
  }
  assert.strictEqual(result.insertId, 124);
  // > 24 bits
  connection.query("INSERT INTO bigs SET title='test', id=123456789");
  connection.query("INSERT INTO bigs SET title='test2'", (err, result) => {
    assert.strictEqual(result.insertId, 123456790);
    // big int
    connection.query("INSERT INTO bigs SET title='test', id=9007199254740991");
    connection.query("INSERT INTO bigs SET title='test3'", (err, result) => {
      assert.strictEqual(
        Long.fromString('9007199254740992').compare(result.insertId),
        0,
      );
      connection.query(
        "INSERT INTO bigs SET title='test', id=90071992547409923",
      );
      connection.query("INSERT INTO bigs SET title='test4'", (err, result) => {
        assert.strictEqual(
          Long.fromString('90071992547409924').compare(result.insertId),
          0,
        );
        connection.query(
          {
            sql: 'select * from bigs',
            supportBigNumbers: true,
            bigNumberString: false,
          },
          (err, result) => {
            assert.strictEqual(result[0].id, 123);
            assert.strictEqual(result[1].id, 124);
            assert.strictEqual(result[2].id, 123456789);
            assert.strictEqual(result[3].id, 123456790);
            assert.strictEqual(result[4].id, 9007199254740991);
            assert.strictEqual(result[5].id, '9007199254740992');
            assert.strictEqual(result[6].id, '90071992547409923');
            assert.strictEqual(result[7].id, '90071992547409924');
            connection.end();
          },
        );
      });
    });
  });
});
