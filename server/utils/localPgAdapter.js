const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'task_management'
});

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.operation = 'select';
    this.selectColumns = '*';
    this.whereConditions = [];
    this.params = [];
    this.updateFields = {};
    this.insertData = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.orderBy = null;
    this.limitCount = null;
  }

  select(columns = '*') {
    this.operation = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(data) {
    this.operation = 'insert';
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(fields) {
    this.operation = 'update';
    this.updateFields = fields;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.params.push(value);
    this.whereConditions.push(`${column} = $${this.params.length}`);
    return this;
  }

  neq(column, value) {
    this.params.push(value);
    this.whereConditions.push(`${column} != $${this.params.length}`);
    return this;
  }

  in(column, values) {
    if (!values || values.length === 0) {
      this.whereConditions.push('1=0');
      return this;
    }
    const paramIndices = values.map((val) => {
      this.params.push(val);
      return `$${this.params.length}`;
    });
    this.whereConditions.push(`${column} IN (${paramIndices.join(', ')})`);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderBy = `${column} ${ascending ? 'ASC' : 'DESC'}`;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    try {
      let sql = '';
      const whereClause = this.whereConditions.length > 0
        ? ` WHERE ${this.whereConditions.join(' AND ')}`
        : '';

      if (this.operation === 'select') {
        sql = `SELECT ${this.selectColumns} FROM ${this.table}${whereClause}`;
        if (this.orderBy) sql += ` ORDER BY ${this.orderBy}`;
        if (this.limitCount) sql += ` LIMIT ${this.limitCount}`;
        else if (this.isSingle) sql += ` LIMIT 1`;

        const { rows } = await pool.query(sql, this.params);
        if (this.isSingle) {
          if (rows.length === 0) {
            return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
          }
          return { data: rows[0], error: null };
        }
        if (this.isMaybeSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: rows, error: null };
      }

      if (this.operation === 'insert') {
        if (!this.insertData || this.insertData.length === 0) {
          return { data: [], error: null };
        }
        const insertedRows = [];
        for (const item of this.insertData) {
          const keys = Object.keys(item);
          const vals = Object.values(item);
          const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
          const insertSql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
          const { rows } = await pool.query(insertSql, vals);
          insertedRows.push(...rows);
        }
        return { data: this.insertData.length === 1 ? insertedRows[0] : insertedRows, error: null };
      }

      if (this.operation === 'update') {
        const keys = Object.keys(this.updateFields);
        const updateVals = Object.values(this.updateFields);
        const setClauses = keys.map((key, idx) => `${key} = $${this.params.length + idx + 1}`);

        sql = `UPDATE ${this.table} SET ${setClauses.join(', ')}${whereClause} RETURNING *`;
        const { rows } = await pool.query(sql, [...this.params, ...updateVals]);
        return { data: rows, error: null };
      }

      if (this.operation === 'delete') {
        sql = `DELETE FROM ${this.table}${whereClause} RETURNING *`;
        const { rows } = await pool.query(sql, this.params);
        return { data: rows, error: null };
      }
    } catch (err) {
      console.error(`[LocalPgAdapter] Error on table '${this.table}':`, err.message);
      return { data: null, error: err };
    }
  }
}

module.exports = {
  from: (table) => new QueryBuilder(table),
  pool
};
