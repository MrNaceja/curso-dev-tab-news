/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    username: {
      // Limite imposto pelo próprio github em sua tabela de users...
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    email: {
      // O porque de 254 chars de limite em email: https://stackoverflow.com/a/1199238
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password: {
      // o porque de 60 chars de limite em senha: https://www.npmjs.com/package/bcrypt#hash-info
      type: "varchar(60)",
      notNull: true,
    },
    created_at: {
      // Importancia de ser timestamp com timezone: https://justatheory.com/2012/04/postgres-use-timestamptz/
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
    updated_at: {
      // Importancia de ser timestamp com timezone: https://justatheory.com/2012/04/postgres-use-timestamptz/
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = false;
