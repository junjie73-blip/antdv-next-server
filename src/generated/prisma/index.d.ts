
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model sys_tenant
 * 
 */
export type sys_tenant = $Result.DefaultSelection<Prisma.$sys_tenantPayload>
/**
 * Model sys_user
 * 
 */
export type sys_user = $Result.DefaultSelection<Prisma.$sys_userPayload>
/**
 * Model sys_role
 * 
 */
export type sys_role = $Result.DefaultSelection<Prisma.$sys_rolePayload>
/**
 * Model sys_dept
 * 
 */
export type sys_dept = $Result.DefaultSelection<Prisma.$sys_deptPayload>
/**
 * Model sys_menu
 * 
 */
export type sys_menu = $Result.DefaultSelection<Prisma.$sys_menuPayload>
/**
 * Model sys_permission
 * 
 */
export type sys_permission = $Result.DefaultSelection<Prisma.$sys_permissionPayload>
/**
 * Model sys_dict_type
 * 
 */
export type sys_dict_type = $Result.DefaultSelection<Prisma.$sys_dict_typePayload>
/**
 * Model sys_dict_data
 * 
 */
export type sys_dict_data = $Result.DefaultSelection<Prisma.$sys_dict_dataPayload>
/**
 * Model sys_notice
 * 
 */
export type sys_notice = $Result.DefaultSelection<Prisma.$sys_noticePayload>
/**
 * Model sys_audit_log
 * 
 */
export type sys_audit_log = $Result.DefaultSelection<Prisma.$sys_audit_logPayload>
/**
 * Model sys_user_role
 * 
 */
export type sys_user_role = $Result.DefaultSelection<Prisma.$sys_user_rolePayload>
/**
 * Model sys_user_dept
 * 
 */
export type sys_user_dept = $Result.DefaultSelection<Prisma.$sys_user_deptPayload>
/**
 * Model sys_role_menu
 * 
 */
export type sys_role_menu = $Result.DefaultSelection<Prisma.$sys_role_menuPayload>
/**
 * Model sys_role_permission
 * 
 */
export type sys_role_permission = $Result.DefaultSelection<Prisma.$sys_role_permissionPayload>
/**
 * Model sys_mfa_config
 * 
 */
export type sys_mfa_config = $Result.DefaultSelection<Prisma.$sys_mfa_configPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Sys_tenants
 * const sys_tenants = await prisma.sys_tenant.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Sys_tenants
   * const sys_tenants = await prisma.sys_tenant.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.PrismaClientConstructorArgs<ClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.sys_tenant`: Exposes CRUD operations for the **sys_tenant** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_tenants
    * const sys_tenants = await prisma.sys_tenant.findMany()
    * ```
    */
  get sys_tenant(): Prisma.sys_tenantDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_user`: Exposes CRUD operations for the **sys_user** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_users
    * const sys_users = await prisma.sys_user.findMany()
    * ```
    */
  get sys_user(): Prisma.sys_userDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_role`: Exposes CRUD operations for the **sys_role** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_roles
    * const sys_roles = await prisma.sys_role.findMany()
    * ```
    */
  get sys_role(): Prisma.sys_roleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_dept`: Exposes CRUD operations for the **sys_dept** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_depts
    * const sys_depts = await prisma.sys_dept.findMany()
    * ```
    */
  get sys_dept(): Prisma.sys_deptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_menu`: Exposes CRUD operations for the **sys_menu** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_menus
    * const sys_menus = await prisma.sys_menu.findMany()
    * ```
    */
  get sys_menu(): Prisma.sys_menuDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_permission`: Exposes CRUD operations for the **sys_permission** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_permissions
    * const sys_permissions = await prisma.sys_permission.findMany()
    * ```
    */
  get sys_permission(): Prisma.sys_permissionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_dict_type`: Exposes CRUD operations for the **sys_dict_type** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_dict_types
    * const sys_dict_types = await prisma.sys_dict_type.findMany()
    * ```
    */
  get sys_dict_type(): Prisma.sys_dict_typeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_dict_data`: Exposes CRUD operations for the **sys_dict_data** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_dict_data
    * const sys_dict_data = await prisma.sys_dict_data.findMany()
    * ```
    */
  get sys_dict_data(): Prisma.sys_dict_dataDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_notice`: Exposes CRUD operations for the **sys_notice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_notices
    * const sys_notices = await prisma.sys_notice.findMany()
    * ```
    */
  get sys_notice(): Prisma.sys_noticeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_audit_log`: Exposes CRUD operations for the **sys_audit_log** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_audit_logs
    * const sys_audit_logs = await prisma.sys_audit_log.findMany()
    * ```
    */
  get sys_audit_log(): Prisma.sys_audit_logDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_user_role`: Exposes CRUD operations for the **sys_user_role** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_user_roles
    * const sys_user_roles = await prisma.sys_user_role.findMany()
    * ```
    */
  get sys_user_role(): Prisma.sys_user_roleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_user_dept`: Exposes CRUD operations for the **sys_user_dept** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_user_depts
    * const sys_user_depts = await prisma.sys_user_dept.findMany()
    * ```
    */
  get sys_user_dept(): Prisma.sys_user_deptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_role_menu`: Exposes CRUD operations for the **sys_role_menu** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_role_menus
    * const sys_role_menus = await prisma.sys_role_menu.findMany()
    * ```
    */
  get sys_role_menu(): Prisma.sys_role_menuDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_role_permission`: Exposes CRUD operations for the **sys_role_permission** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_role_permissions
    * const sys_role_permissions = await prisma.sys_role_permission.findMany()
    * ```
    */
  get sys_role_permission(): Prisma.sys_role_permissionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.sys_mfa_config`: Exposes CRUD operations for the **sys_mfa_config** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sys_mfa_configs
    * const sys_mfa_configs = await prisma.sys_mfa_config.findMany()
    * ```
    */
  get sys_mfa_config(): Prisma.sys_mfa_configDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.9.1
   * Query Engine version: e922089b7d7502aff4249d5da3420f6fa55fc6ad
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * Resolved type of the argument passed to the `PrismaClient` constructor.
   *
   * When called without a narrower options type (the common case), this resolves
   * to `PrismaClientOptions` directly, which produces a clear TypeScript error
   * message (`not assignable to parameter of type 'PrismaClientOptions'`) when
   * the argument is missing or incomplete. When the user supplies a narrower
   * options type (e.g. via a literal), it falls back to `Subset` to keep
   * filtering out unknown properties.
   */
  export type PrismaClientConstructorArgs<Options extends PrismaClientOptions> =
    [PrismaClientOptions] extends [Options] ? PrismaClientOptions : Subset<Options, PrismaClientOptions>;

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      ((Without<T, U> & U) | (Without<U, T> & T)) & object
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    sys_tenant: 'sys_tenant',
    sys_user: 'sys_user',
    sys_role: 'sys_role',
    sys_dept: 'sys_dept',
    sys_menu: 'sys_menu',
    sys_permission: 'sys_permission',
    sys_dict_type: 'sys_dict_type',
    sys_dict_data: 'sys_dict_data',
    sys_notice: 'sys_notice',
    sys_audit_log: 'sys_audit_log',
    sys_user_role: 'sys_user_role',
    sys_user_dept: 'sys_user_dept',
    sys_role_menu: 'sys_role_menu',
    sys_role_permission: 'sys_role_permission',
    sys_mfa_config: 'sys_mfa_config'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "sys_tenant" | "sys_user" | "sys_role" | "sys_dept" | "sys_menu" | "sys_permission" | "sys_dict_type" | "sys_dict_data" | "sys_notice" | "sys_audit_log" | "sys_user_role" | "sys_user_dept" | "sys_role_menu" | "sys_role_permission" | "sys_mfa_config"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      sys_tenant: {
        payload: Prisma.$sys_tenantPayload<ExtArgs>
        fields: Prisma.sys_tenantFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_tenantFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_tenantFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          findFirst: {
            args: Prisma.sys_tenantFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_tenantFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          findMany: {
            args: Prisma.sys_tenantFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>[]
          }
          create: {
            args: Prisma.sys_tenantCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          createMany: {
            args: Prisma.sys_tenantCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_tenantCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>[]
          }
          delete: {
            args: Prisma.sys_tenantDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          update: {
            args: Prisma.sys_tenantUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          deleteMany: {
            args: Prisma.sys_tenantDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_tenantUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_tenantUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>[]
          }
          upsert: {
            args: Prisma.sys_tenantUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_tenantPayload>
          }
          aggregate: {
            args: Prisma.Sys_tenantAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_tenant>
          }
          groupBy: {
            args: Prisma.sys_tenantGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_tenantGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_tenantCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_tenantCountAggregateOutputType> | number
          }
        }
      }
      sys_user: {
        payload: Prisma.$sys_userPayload<ExtArgs>
        fields: Prisma.sys_userFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_userFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_userFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          findFirst: {
            args: Prisma.sys_userFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_userFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          findMany: {
            args: Prisma.sys_userFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>[]
          }
          create: {
            args: Prisma.sys_userCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          createMany: {
            args: Prisma.sys_userCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_userCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>[]
          }
          delete: {
            args: Prisma.sys_userDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          update: {
            args: Prisma.sys_userUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          deleteMany: {
            args: Prisma.sys_userDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_userUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_userUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>[]
          }
          upsert: {
            args: Prisma.sys_userUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_userPayload>
          }
          aggregate: {
            args: Prisma.Sys_userAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_user>
          }
          groupBy: {
            args: Prisma.sys_userGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_userGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_userCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_userCountAggregateOutputType> | number
          }
        }
      }
      sys_role: {
        payload: Prisma.$sys_rolePayload<ExtArgs>
        fields: Prisma.sys_roleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_roleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_roleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          findFirst: {
            args: Prisma.sys_roleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_roleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          findMany: {
            args: Prisma.sys_roleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>[]
          }
          create: {
            args: Prisma.sys_roleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          createMany: {
            args: Prisma.sys_roleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_roleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>[]
          }
          delete: {
            args: Prisma.sys_roleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          update: {
            args: Prisma.sys_roleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          deleteMany: {
            args: Prisma.sys_roleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_roleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_roleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>[]
          }
          upsert: {
            args: Prisma.sys_roleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_rolePayload>
          }
          aggregate: {
            args: Prisma.Sys_roleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_role>
          }
          groupBy: {
            args: Prisma.sys_roleGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_roleGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_roleCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_roleCountAggregateOutputType> | number
          }
        }
      }
      sys_dept: {
        payload: Prisma.$sys_deptPayload<ExtArgs>
        fields: Prisma.sys_deptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_deptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_deptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          findFirst: {
            args: Prisma.sys_deptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_deptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          findMany: {
            args: Prisma.sys_deptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>[]
          }
          create: {
            args: Prisma.sys_deptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          createMany: {
            args: Prisma.sys_deptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_deptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>[]
          }
          delete: {
            args: Prisma.sys_deptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          update: {
            args: Prisma.sys_deptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          deleteMany: {
            args: Prisma.sys_deptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_deptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_deptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>[]
          }
          upsert: {
            args: Prisma.sys_deptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_deptPayload>
          }
          aggregate: {
            args: Prisma.Sys_deptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_dept>
          }
          groupBy: {
            args: Prisma.sys_deptGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_deptGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_deptCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_deptCountAggregateOutputType> | number
          }
        }
      }
      sys_menu: {
        payload: Prisma.$sys_menuPayload<ExtArgs>
        fields: Prisma.sys_menuFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_menuFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_menuFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          findFirst: {
            args: Prisma.sys_menuFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_menuFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          findMany: {
            args: Prisma.sys_menuFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>[]
          }
          create: {
            args: Prisma.sys_menuCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          createMany: {
            args: Prisma.sys_menuCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_menuCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>[]
          }
          delete: {
            args: Prisma.sys_menuDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          update: {
            args: Prisma.sys_menuUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          deleteMany: {
            args: Prisma.sys_menuDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_menuUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_menuUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>[]
          }
          upsert: {
            args: Prisma.sys_menuUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_menuPayload>
          }
          aggregate: {
            args: Prisma.Sys_menuAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_menu>
          }
          groupBy: {
            args: Prisma.sys_menuGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_menuGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_menuCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_menuCountAggregateOutputType> | number
          }
        }
      }
      sys_permission: {
        payload: Prisma.$sys_permissionPayload<ExtArgs>
        fields: Prisma.sys_permissionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_permissionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_permissionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          findFirst: {
            args: Prisma.sys_permissionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_permissionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          findMany: {
            args: Prisma.sys_permissionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>[]
          }
          create: {
            args: Prisma.sys_permissionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          createMany: {
            args: Prisma.sys_permissionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_permissionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>[]
          }
          delete: {
            args: Prisma.sys_permissionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          update: {
            args: Prisma.sys_permissionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          deleteMany: {
            args: Prisma.sys_permissionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_permissionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_permissionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>[]
          }
          upsert: {
            args: Prisma.sys_permissionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_permissionPayload>
          }
          aggregate: {
            args: Prisma.Sys_permissionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_permission>
          }
          groupBy: {
            args: Prisma.sys_permissionGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_permissionGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_permissionCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_permissionCountAggregateOutputType> | number
          }
        }
      }
      sys_dict_type: {
        payload: Prisma.$sys_dict_typePayload<ExtArgs>
        fields: Prisma.sys_dict_typeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_dict_typeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_dict_typeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          findFirst: {
            args: Prisma.sys_dict_typeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_dict_typeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          findMany: {
            args: Prisma.sys_dict_typeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>[]
          }
          create: {
            args: Prisma.sys_dict_typeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          createMany: {
            args: Prisma.sys_dict_typeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_dict_typeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>[]
          }
          delete: {
            args: Prisma.sys_dict_typeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          update: {
            args: Prisma.sys_dict_typeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          deleteMany: {
            args: Prisma.sys_dict_typeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_dict_typeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_dict_typeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>[]
          }
          upsert: {
            args: Prisma.sys_dict_typeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_typePayload>
          }
          aggregate: {
            args: Prisma.Sys_dict_typeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_dict_type>
          }
          groupBy: {
            args: Prisma.sys_dict_typeGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_dict_typeGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_dict_typeCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_dict_typeCountAggregateOutputType> | number
          }
        }
      }
      sys_dict_data: {
        payload: Prisma.$sys_dict_dataPayload<ExtArgs>
        fields: Prisma.sys_dict_dataFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_dict_dataFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_dict_dataFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          findFirst: {
            args: Prisma.sys_dict_dataFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_dict_dataFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          findMany: {
            args: Prisma.sys_dict_dataFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>[]
          }
          create: {
            args: Prisma.sys_dict_dataCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          createMany: {
            args: Prisma.sys_dict_dataCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_dict_dataCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>[]
          }
          delete: {
            args: Prisma.sys_dict_dataDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          update: {
            args: Prisma.sys_dict_dataUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          deleteMany: {
            args: Prisma.sys_dict_dataDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_dict_dataUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_dict_dataUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>[]
          }
          upsert: {
            args: Prisma.sys_dict_dataUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_dict_dataPayload>
          }
          aggregate: {
            args: Prisma.Sys_dict_dataAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_dict_data>
          }
          groupBy: {
            args: Prisma.sys_dict_dataGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_dict_dataGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_dict_dataCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_dict_dataCountAggregateOutputType> | number
          }
        }
      }
      sys_notice: {
        payload: Prisma.$sys_noticePayload<ExtArgs>
        fields: Prisma.sys_noticeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_noticeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_noticeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          findFirst: {
            args: Prisma.sys_noticeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_noticeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          findMany: {
            args: Prisma.sys_noticeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>[]
          }
          create: {
            args: Prisma.sys_noticeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          createMany: {
            args: Prisma.sys_noticeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_noticeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>[]
          }
          delete: {
            args: Prisma.sys_noticeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          update: {
            args: Prisma.sys_noticeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          deleteMany: {
            args: Prisma.sys_noticeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_noticeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_noticeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>[]
          }
          upsert: {
            args: Prisma.sys_noticeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_noticePayload>
          }
          aggregate: {
            args: Prisma.Sys_noticeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_notice>
          }
          groupBy: {
            args: Prisma.sys_noticeGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_noticeGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_noticeCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_noticeCountAggregateOutputType> | number
          }
        }
      }
      sys_audit_log: {
        payload: Prisma.$sys_audit_logPayload<ExtArgs>
        fields: Prisma.sys_audit_logFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_audit_logFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_audit_logFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          findFirst: {
            args: Prisma.sys_audit_logFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_audit_logFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          findMany: {
            args: Prisma.sys_audit_logFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>[]
          }
          create: {
            args: Prisma.sys_audit_logCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          createMany: {
            args: Prisma.sys_audit_logCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_audit_logCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>[]
          }
          delete: {
            args: Prisma.sys_audit_logDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          update: {
            args: Prisma.sys_audit_logUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          deleteMany: {
            args: Prisma.sys_audit_logDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_audit_logUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_audit_logUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>[]
          }
          upsert: {
            args: Prisma.sys_audit_logUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_audit_logPayload>
          }
          aggregate: {
            args: Prisma.Sys_audit_logAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_audit_log>
          }
          groupBy: {
            args: Prisma.sys_audit_logGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_audit_logGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_audit_logCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_audit_logCountAggregateOutputType> | number
          }
        }
      }
      sys_user_role: {
        payload: Prisma.$sys_user_rolePayload<ExtArgs>
        fields: Prisma.sys_user_roleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_user_roleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_user_roleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          findFirst: {
            args: Prisma.sys_user_roleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_user_roleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          findMany: {
            args: Prisma.sys_user_roleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>[]
          }
          create: {
            args: Prisma.sys_user_roleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          createMany: {
            args: Prisma.sys_user_roleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_user_roleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>[]
          }
          delete: {
            args: Prisma.sys_user_roleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          update: {
            args: Prisma.sys_user_roleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          deleteMany: {
            args: Prisma.sys_user_roleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_user_roleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_user_roleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>[]
          }
          upsert: {
            args: Prisma.sys_user_roleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_rolePayload>
          }
          aggregate: {
            args: Prisma.Sys_user_roleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_user_role>
          }
          groupBy: {
            args: Prisma.sys_user_roleGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_user_roleGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_user_roleCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_user_roleCountAggregateOutputType> | number
          }
        }
      }
      sys_user_dept: {
        payload: Prisma.$sys_user_deptPayload<ExtArgs>
        fields: Prisma.sys_user_deptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_user_deptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_user_deptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          findFirst: {
            args: Prisma.sys_user_deptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_user_deptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          findMany: {
            args: Prisma.sys_user_deptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>[]
          }
          create: {
            args: Prisma.sys_user_deptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          createMany: {
            args: Prisma.sys_user_deptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_user_deptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>[]
          }
          delete: {
            args: Prisma.sys_user_deptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          update: {
            args: Prisma.sys_user_deptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          deleteMany: {
            args: Prisma.sys_user_deptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_user_deptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_user_deptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>[]
          }
          upsert: {
            args: Prisma.sys_user_deptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_user_deptPayload>
          }
          aggregate: {
            args: Prisma.Sys_user_deptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_user_dept>
          }
          groupBy: {
            args: Prisma.sys_user_deptGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_user_deptGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_user_deptCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_user_deptCountAggregateOutputType> | number
          }
        }
      }
      sys_role_menu: {
        payload: Prisma.$sys_role_menuPayload<ExtArgs>
        fields: Prisma.sys_role_menuFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_role_menuFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_role_menuFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          findFirst: {
            args: Prisma.sys_role_menuFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_role_menuFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          findMany: {
            args: Prisma.sys_role_menuFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>[]
          }
          create: {
            args: Prisma.sys_role_menuCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          createMany: {
            args: Prisma.sys_role_menuCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_role_menuCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>[]
          }
          delete: {
            args: Prisma.sys_role_menuDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          update: {
            args: Prisma.sys_role_menuUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          deleteMany: {
            args: Prisma.sys_role_menuDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_role_menuUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_role_menuUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>[]
          }
          upsert: {
            args: Prisma.sys_role_menuUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_menuPayload>
          }
          aggregate: {
            args: Prisma.Sys_role_menuAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_role_menu>
          }
          groupBy: {
            args: Prisma.sys_role_menuGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_role_menuGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_role_menuCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_role_menuCountAggregateOutputType> | number
          }
        }
      }
      sys_role_permission: {
        payload: Prisma.$sys_role_permissionPayload<ExtArgs>
        fields: Prisma.sys_role_permissionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_role_permissionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_role_permissionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          findFirst: {
            args: Prisma.sys_role_permissionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_role_permissionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          findMany: {
            args: Prisma.sys_role_permissionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>[]
          }
          create: {
            args: Prisma.sys_role_permissionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          createMany: {
            args: Prisma.sys_role_permissionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_role_permissionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>[]
          }
          delete: {
            args: Prisma.sys_role_permissionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          update: {
            args: Prisma.sys_role_permissionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          deleteMany: {
            args: Prisma.sys_role_permissionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_role_permissionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_role_permissionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>[]
          }
          upsert: {
            args: Prisma.sys_role_permissionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_role_permissionPayload>
          }
          aggregate: {
            args: Prisma.Sys_role_permissionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_role_permission>
          }
          groupBy: {
            args: Prisma.sys_role_permissionGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_role_permissionGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_role_permissionCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_role_permissionCountAggregateOutputType> | number
          }
        }
      }
      sys_mfa_config: {
        payload: Prisma.$sys_mfa_configPayload<ExtArgs>
        fields: Prisma.sys_mfa_configFieldRefs
        operations: {
          findUnique: {
            args: Prisma.sys_mfa_configFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.sys_mfa_configFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          findFirst: {
            args: Prisma.sys_mfa_configFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.sys_mfa_configFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          findMany: {
            args: Prisma.sys_mfa_configFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>[]
          }
          create: {
            args: Prisma.sys_mfa_configCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          createMany: {
            args: Prisma.sys_mfa_configCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.sys_mfa_configCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>[]
          }
          delete: {
            args: Prisma.sys_mfa_configDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          update: {
            args: Prisma.sys_mfa_configUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          deleteMany: {
            args: Prisma.sys_mfa_configDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.sys_mfa_configUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.sys_mfa_configUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>[]
          }
          upsert: {
            args: Prisma.sys_mfa_configUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$sys_mfa_configPayload>
          }
          aggregate: {
            args: Prisma.Sys_mfa_configAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSys_mfa_config>
          }
          groupBy: {
            args: Prisma.sys_mfa_configGroupByArgs<ExtArgs>
            result: $Utils.Optional<Sys_mfa_configGroupByOutputType>[]
          }
          count: {
            args: Prisma.sys_mfa_configCountArgs<ExtArgs>
            result: $Utils.Optional<Sys_mfa_configCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * A driver adapter that PrismaClient uses to connect to your database, such as the ones provided by `@prisma/adapter-pg`, `@prisma/adapter-libsql`, `@prisma/adapter-planetscale`, etc.
     * 
     * A driver adapter is **required** unless you connect to your database through Prisma Accelerate (in which case use `accelerateUrl` instead).
     * 
     * Learn more: https://pris.ly/d/driver-adapters
     * 
     * @example
     * ```ts
     * import { PrismaPg } from '@prisma/adapter-pg'
     * import { PrismaClient } from './generated/prisma/client'
     * 
     * const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
     * const prisma = new PrismaClient({ adapter })
     * ```
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * The Prisma Accelerate connection URL. Use this option to connect to your database through Prisma Accelerate instead of using a driver adapter to connect directly.
     * 
     * Learn more: https://pris.ly/d/accelerate
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    sys_tenant?: sys_tenantOmit
    sys_user?: sys_userOmit
    sys_role?: sys_roleOmit
    sys_dept?: sys_deptOmit
    sys_menu?: sys_menuOmit
    sys_permission?: sys_permissionOmit
    sys_dict_type?: sys_dict_typeOmit
    sys_dict_data?: sys_dict_dataOmit
    sys_notice?: sys_noticeOmit
    sys_audit_log?: sys_audit_logOmit
    sys_user_role?: sys_user_roleOmit
    sys_user_dept?: sys_user_deptOmit
    sys_role_menu?: sys_role_menuOmit
    sys_role_permission?: sys_role_permissionOmit
    sys_mfa_config?: sys_mfa_configOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model sys_tenant
   */

  export type AggregateSys_tenant = {
    _count: Sys_tenantCountAggregateOutputType | null
    _avg: Sys_tenantAvgAggregateOutputType | null
    _sum: Sys_tenantSumAggregateOutputType | null
    _min: Sys_tenantMinAggregateOutputType | null
    _max: Sys_tenantMaxAggregateOutputType | null
  }

  export type Sys_tenantAvgAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_tenantSumAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_tenantMinAggregateOutputType = {
    tenant_id: string | null
    tenant_code: string | null
    tenant_name: string | null
    contact_name: string | null
    contact_phone: string | null
    contact_email: string | null
    status: number | null
    expire_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_tenantMaxAggregateOutputType = {
    tenant_id: string | null
    tenant_code: string | null
    tenant_name: string | null
    contact_name: string | null
    contact_phone: string | null
    contact_email: string | null
    status: number | null
    expire_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_tenantCountAggregateOutputType = {
    tenant_id: number
    tenant_code: number
    tenant_name: number
    contact_name: number
    contact_phone: number
    contact_email: number
    status: number
    expire_time: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_tenantAvgAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_tenantSumAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_tenantMinAggregateInputType = {
    tenant_id?: true
    tenant_code?: true
    tenant_name?: true
    contact_name?: true
    contact_phone?: true
    contact_email?: true
    status?: true
    expire_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_tenantMaxAggregateInputType = {
    tenant_id?: true
    tenant_code?: true
    tenant_name?: true
    contact_name?: true
    contact_phone?: true
    contact_email?: true
    status?: true
    expire_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_tenantCountAggregateInputType = {
    tenant_id?: true
    tenant_code?: true
    tenant_name?: true
    contact_name?: true
    contact_phone?: true
    contact_email?: true
    status?: true
    expire_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_tenantAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_tenant to aggregate.
     */
    where?: sys_tenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_tenants to fetch.
     */
    orderBy?: sys_tenantOrderByWithRelationInput | sys_tenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_tenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_tenants
    **/
    _count?: true | Sys_tenantCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_tenantAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_tenantSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_tenantMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_tenantMaxAggregateInputType
  }

  export type GetSys_tenantAggregateType<T extends Sys_tenantAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_tenant]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_tenant[P]>
      : GetScalarType<T[P], AggregateSys_tenant[P]>
  }




  export type sys_tenantGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_tenantWhereInput
    orderBy?: sys_tenantOrderByWithAggregationInput | sys_tenantOrderByWithAggregationInput[]
    by: Sys_tenantScalarFieldEnum[] | Sys_tenantScalarFieldEnum
    having?: sys_tenantScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_tenantCountAggregateInputType | true
    _avg?: Sys_tenantAvgAggregateInputType
    _sum?: Sys_tenantSumAggregateInputType
    _min?: Sys_tenantMinAggregateInputType
    _max?: Sys_tenantMaxAggregateInputType
  }

  export type Sys_tenantGroupByOutputType = {
    tenant_id: string
    tenant_code: string
    tenant_name: string
    contact_name: string | null
    contact_phone: string | null
    contact_email: string | null
    status: number
    expire_time: Date | null
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_tenantCountAggregateOutputType | null
    _avg: Sys_tenantAvgAggregateOutputType | null
    _sum: Sys_tenantSumAggregateOutputType | null
    _min: Sys_tenantMinAggregateOutputType | null
    _max: Sys_tenantMaxAggregateOutputType | null
  }

  type GetSys_tenantGroupByPayload<T extends sys_tenantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_tenantGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_tenantGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_tenantGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_tenantGroupByOutputType[P]>
        }
      >
    >


  export type sys_tenantSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenant_id?: boolean
    tenant_code?: boolean
    tenant_name?: boolean
    contact_name?: boolean
    contact_phone?: boolean
    contact_email?: boolean
    status?: boolean
    expire_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_tenant"]>

  export type sys_tenantSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenant_id?: boolean
    tenant_code?: boolean
    tenant_name?: boolean
    contact_name?: boolean
    contact_phone?: boolean
    contact_email?: boolean
    status?: boolean
    expire_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_tenant"]>

  export type sys_tenantSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenant_id?: boolean
    tenant_code?: boolean
    tenant_name?: boolean
    contact_name?: boolean
    contact_phone?: boolean
    contact_email?: boolean
    status?: boolean
    expire_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_tenant"]>

  export type sys_tenantSelectScalar = {
    tenant_id?: boolean
    tenant_code?: boolean
    tenant_name?: boolean
    contact_name?: boolean
    contact_phone?: boolean
    contact_email?: boolean
    status?: boolean
    expire_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_tenantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenant_id" | "tenant_code" | "tenant_name" | "contact_name" | "contact_phone" | "contact_email" | "status" | "expire_time" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_tenant"]>

  export type $sys_tenantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_tenant"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenant_id: string
      tenant_code: string
      tenant_name: string
      contact_name: string | null
      contact_phone: string | null
      contact_email: string | null
      status: number
      expire_time: Date | null
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_tenant"]>
    composites: {}
  }

  type sys_tenantGetPayload<S extends boolean | null | undefined | sys_tenantDefaultArgs> = $Result.GetResult<Prisma.$sys_tenantPayload, S>

  type sys_tenantCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_tenantFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_tenantCountAggregateInputType | true
    }

  export interface sys_tenantDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_tenant'], meta: { name: 'sys_tenant' } }
    /**
     * Find zero or one Sys_tenant that matches the filter.
     * @param {sys_tenantFindUniqueArgs} args - Arguments to find a Sys_tenant
     * @example
     * // Get one Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_tenantFindUniqueArgs>(args: SelectSubset<T, sys_tenantFindUniqueArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_tenant that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_tenantFindUniqueOrThrowArgs} args - Arguments to find a Sys_tenant
     * @example
     * // Get one Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_tenantFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_tenantFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_tenant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantFindFirstArgs} args - Arguments to find a Sys_tenant
     * @example
     * // Get one Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_tenantFindFirstArgs>(args?: SelectSubset<T, sys_tenantFindFirstArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_tenant that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantFindFirstOrThrowArgs} args - Arguments to find a Sys_tenant
     * @example
     * // Get one Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_tenantFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_tenantFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_tenants
     * const sys_tenants = await prisma.sys_tenant.findMany()
     * 
     * // Get first 10 Sys_tenants
     * const sys_tenants = await prisma.sys_tenant.findMany({ take: 10 })
     * 
     * // Only select the `tenant_id`
     * const sys_tenantWithTenant_idOnly = await prisma.sys_tenant.findMany({ select: { tenant_id: true } })
     * 
     */
    findMany<T extends sys_tenantFindManyArgs>(args?: SelectSubset<T, sys_tenantFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_tenant.
     * @param {sys_tenantCreateArgs} args - Arguments to create a Sys_tenant.
     * @example
     * // Create one Sys_tenant
     * const Sys_tenant = await prisma.sys_tenant.create({
     *   data: {
     *     // ... data to create a Sys_tenant
     *   }
     * })
     * 
     */
    create<T extends sys_tenantCreateArgs>(args: SelectSubset<T, sys_tenantCreateArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_tenants.
     * @param {sys_tenantCreateManyArgs} args - Arguments to create many Sys_tenants.
     * @example
     * // Create many Sys_tenants
     * const sys_tenant = await prisma.sys_tenant.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_tenantCreateManyArgs>(args?: SelectSubset<T, sys_tenantCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_tenants and returns the data saved in the database.
     * @param {sys_tenantCreateManyAndReturnArgs} args - Arguments to create many Sys_tenants.
     * @example
     * // Create many Sys_tenants
     * const sys_tenant = await prisma.sys_tenant.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_tenants and only return the `tenant_id`
     * const sys_tenantWithTenant_idOnly = await prisma.sys_tenant.createManyAndReturn({
     *   select: { tenant_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_tenantCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_tenantCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_tenant.
     * @param {sys_tenantDeleteArgs} args - Arguments to delete one Sys_tenant.
     * @example
     * // Delete one Sys_tenant
     * const Sys_tenant = await prisma.sys_tenant.delete({
     *   where: {
     *     // ... filter to delete one Sys_tenant
     *   }
     * })
     * 
     */
    delete<T extends sys_tenantDeleteArgs>(args: SelectSubset<T, sys_tenantDeleteArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_tenant.
     * @param {sys_tenantUpdateArgs} args - Arguments to update one Sys_tenant.
     * @example
     * // Update one Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_tenantUpdateArgs>(args: SelectSubset<T, sys_tenantUpdateArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_tenants.
     * @param {sys_tenantDeleteManyArgs} args - Arguments to filter Sys_tenants to delete.
     * @example
     * // Delete a few Sys_tenants
     * const { count } = await prisma.sys_tenant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_tenantDeleteManyArgs>(args?: SelectSubset<T, sys_tenantDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_tenants
     * const sys_tenant = await prisma.sys_tenant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_tenantUpdateManyArgs>(args: SelectSubset<T, sys_tenantUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_tenants and returns the data updated in the database.
     * @param {sys_tenantUpdateManyAndReturnArgs} args - Arguments to update many Sys_tenants.
     * @example
     * // Update many Sys_tenants
     * const sys_tenant = await prisma.sys_tenant.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_tenants and only return the `tenant_id`
     * const sys_tenantWithTenant_idOnly = await prisma.sys_tenant.updateManyAndReturn({
     *   select: { tenant_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_tenantUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_tenantUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_tenant.
     * @param {sys_tenantUpsertArgs} args - Arguments to update or create a Sys_tenant.
     * @example
     * // Update or create a Sys_tenant
     * const sys_tenant = await prisma.sys_tenant.upsert({
     *   create: {
     *     // ... data to create a Sys_tenant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_tenant we want to update
     *   }
     * })
     */
    upsert<T extends sys_tenantUpsertArgs>(args: SelectSubset<T, sys_tenantUpsertArgs<ExtArgs>>): Prisma__sys_tenantClient<$Result.GetResult<Prisma.$sys_tenantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantCountArgs} args - Arguments to filter Sys_tenants to count.
     * @example
     * // Count the number of Sys_tenants
     * const count = await prisma.sys_tenant.count({
     *   where: {
     *     // ... the filter for the Sys_tenants we want to count
     *   }
     * })
    **/
    count<T extends sys_tenantCountArgs>(
      args?: Subset<T, sys_tenantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_tenantCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_tenant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_tenantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_tenantAggregateArgs>(args: Subset<T, Sys_tenantAggregateArgs>): Prisma.PrismaPromise<GetSys_tenantAggregateType<T>>

    /**
     * Group by Sys_tenant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_tenantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_tenantGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_tenantGroupByArgs['orderBy'] }
        : { orderBy?: sys_tenantGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_tenantGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_tenantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_tenant model
   */
  readonly fields: sys_tenantFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_tenant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_tenantClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_tenant model
   */
  interface sys_tenantFieldRefs {
    readonly tenant_id: FieldRef<"sys_tenant", 'String'>
    readonly tenant_code: FieldRef<"sys_tenant", 'String'>
    readonly tenant_name: FieldRef<"sys_tenant", 'String'>
    readonly contact_name: FieldRef<"sys_tenant", 'String'>
    readonly contact_phone: FieldRef<"sys_tenant", 'String'>
    readonly contact_email: FieldRef<"sys_tenant", 'String'>
    readonly status: FieldRef<"sys_tenant", 'Int'>
    readonly expire_time: FieldRef<"sys_tenant", 'DateTime'>
    readonly created_at: FieldRef<"sys_tenant", 'DateTime'>
    readonly updated_at: FieldRef<"sys_tenant", 'DateTime'>
    readonly created_by: FieldRef<"sys_tenant", 'String'>
    readonly updated_by: FieldRef<"sys_tenant", 'String'>
    readonly is_deleted: FieldRef<"sys_tenant", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_tenant findUnique
   */
  export type sys_tenantFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter, which sys_tenant to fetch.
     */
    where: sys_tenantWhereUniqueInput
  }

  /**
   * sys_tenant findUniqueOrThrow
   */
  export type sys_tenantFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter, which sys_tenant to fetch.
     */
    where: sys_tenantWhereUniqueInput
  }

  /**
   * sys_tenant findFirst
   */
  export type sys_tenantFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter, which sys_tenant to fetch.
     */
    where?: sys_tenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_tenants to fetch.
     */
    orderBy?: sys_tenantOrderByWithRelationInput | sys_tenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_tenants.
     */
    cursor?: sys_tenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_tenants.
     */
    distinct?: Sys_tenantScalarFieldEnum | Sys_tenantScalarFieldEnum[]
  }

  /**
   * sys_tenant findFirstOrThrow
   */
  export type sys_tenantFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter, which sys_tenant to fetch.
     */
    where?: sys_tenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_tenants to fetch.
     */
    orderBy?: sys_tenantOrderByWithRelationInput | sys_tenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_tenants.
     */
    cursor?: sys_tenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_tenants.
     */
    distinct?: Sys_tenantScalarFieldEnum | Sys_tenantScalarFieldEnum[]
  }

  /**
   * sys_tenant findMany
   */
  export type sys_tenantFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter, which sys_tenants to fetch.
     */
    where?: sys_tenantWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_tenants to fetch.
     */
    orderBy?: sys_tenantOrderByWithRelationInput | sys_tenantOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_tenants.
     */
    cursor?: sys_tenantWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_tenants.
     */
    distinct?: Sys_tenantScalarFieldEnum | Sys_tenantScalarFieldEnum[]
  }

  /**
   * sys_tenant create
   */
  export type sys_tenantCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_tenant.
     */
    data: XOR<sys_tenantCreateInput, sys_tenantUncheckedCreateInput>
  }

  /**
   * sys_tenant createMany
   */
  export type sys_tenantCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_tenants.
     */
    data: sys_tenantCreateManyInput | sys_tenantCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_tenant createManyAndReturn
   */
  export type sys_tenantCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * The data used to create many sys_tenants.
     */
    data: sys_tenantCreateManyInput | sys_tenantCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_tenant update
   */
  export type sys_tenantUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_tenant.
     */
    data: XOR<sys_tenantUpdateInput, sys_tenantUncheckedUpdateInput>
    /**
     * Choose, which sys_tenant to update.
     */
    where: sys_tenantWhereUniqueInput
  }

  /**
   * sys_tenant updateMany
   */
  export type sys_tenantUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_tenants.
     */
    data: XOR<sys_tenantUpdateManyMutationInput, sys_tenantUncheckedUpdateManyInput>
    /**
     * Filter which sys_tenants to update
     */
    where?: sys_tenantWhereInput
    /**
     * Limit how many sys_tenants to update.
     */
    limit?: number
  }

  /**
   * sys_tenant updateManyAndReturn
   */
  export type sys_tenantUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * The data used to update sys_tenants.
     */
    data: XOR<sys_tenantUpdateManyMutationInput, sys_tenantUncheckedUpdateManyInput>
    /**
     * Filter which sys_tenants to update
     */
    where?: sys_tenantWhereInput
    /**
     * Limit how many sys_tenants to update.
     */
    limit?: number
  }

  /**
   * sys_tenant upsert
   */
  export type sys_tenantUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_tenant to update in case it exists.
     */
    where: sys_tenantWhereUniqueInput
    /**
     * In case the sys_tenant found by the `where` argument doesn't exist, create a new sys_tenant with this data.
     */
    create: XOR<sys_tenantCreateInput, sys_tenantUncheckedCreateInput>
    /**
     * In case the sys_tenant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_tenantUpdateInput, sys_tenantUncheckedUpdateInput>
  }

  /**
   * sys_tenant delete
   */
  export type sys_tenantDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
    /**
     * Filter which sys_tenant to delete.
     */
    where: sys_tenantWhereUniqueInput
  }

  /**
   * sys_tenant deleteMany
   */
  export type sys_tenantDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_tenants to delete
     */
    where?: sys_tenantWhereInput
    /**
     * Limit how many sys_tenants to delete.
     */
    limit?: number
  }

  /**
   * sys_tenant without action
   */
  export type sys_tenantDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_tenant
     */
    select?: sys_tenantSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_tenant
     */
    omit?: sys_tenantOmit<ExtArgs> | null
  }


  /**
   * Model sys_user
   */

  export type AggregateSys_user = {
    _count: Sys_userCountAggregateOutputType | null
    _avg: Sys_userAvgAggregateOutputType | null
    _sum: Sys_userSumAggregateOutputType | null
    _min: Sys_userMinAggregateOutputType | null
    _max: Sys_userMaxAggregateOutputType | null
  }

  export type Sys_userAvgAggregateOutputType = {
    gender: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_userSumAggregateOutputType = {
    gender: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_userMinAggregateOutputType = {
    user_id: string | null
    tenant_id: string | null
    username: string | null
    password: string | null
    real_name: string | null
    phone: string | null
    email: string | null
    avatar: string | null
    gender: number | null
    status: number | null
    last_login_ip: string | null
    last_login_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_userMaxAggregateOutputType = {
    user_id: string | null
    tenant_id: string | null
    username: string | null
    password: string | null
    real_name: string | null
    phone: string | null
    email: string | null
    avatar: string | null
    gender: number | null
    status: number | null
    last_login_ip: string | null
    last_login_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_userCountAggregateOutputType = {
    user_id: number
    tenant_id: number
    username: number
    password: number
    real_name: number
    phone: number
    email: number
    avatar: number
    gender: number
    status: number
    last_login_ip: number
    last_login_time: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_userAvgAggregateInputType = {
    gender?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_userSumAggregateInputType = {
    gender?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_userMinAggregateInputType = {
    user_id?: true
    tenant_id?: true
    username?: true
    password?: true
    real_name?: true
    phone?: true
    email?: true
    avatar?: true
    gender?: true
    status?: true
    last_login_ip?: true
    last_login_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_userMaxAggregateInputType = {
    user_id?: true
    tenant_id?: true
    username?: true
    password?: true
    real_name?: true
    phone?: true
    email?: true
    avatar?: true
    gender?: true
    status?: true
    last_login_ip?: true
    last_login_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_userCountAggregateInputType = {
    user_id?: true
    tenant_id?: true
    username?: true
    password?: true
    real_name?: true
    phone?: true
    email?: true
    avatar?: true
    gender?: true
    status?: true
    last_login_ip?: true
    last_login_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_userAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_user to aggregate.
     */
    where?: sys_userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_users to fetch.
     */
    orderBy?: sys_userOrderByWithRelationInput | sys_userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_users
    **/
    _count?: true | Sys_userCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_userAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_userSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_userMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_userMaxAggregateInputType
  }

  export type GetSys_userAggregateType<T extends Sys_userAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_user]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_user[P]>
      : GetScalarType<T[P], AggregateSys_user[P]>
  }




  export type sys_userGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_userWhereInput
    orderBy?: sys_userOrderByWithAggregationInput | sys_userOrderByWithAggregationInput[]
    by: Sys_userScalarFieldEnum[] | Sys_userScalarFieldEnum
    having?: sys_userScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_userCountAggregateInputType | true
    _avg?: Sys_userAvgAggregateInputType
    _sum?: Sys_userSumAggregateInputType
    _min?: Sys_userMinAggregateInputType
    _max?: Sys_userMaxAggregateInputType
  }

  export type Sys_userGroupByOutputType = {
    user_id: string
    tenant_id: string
    username: string
    password: string
    real_name: string | null
    phone: string | null
    email: string | null
    avatar: string | null
    gender: number | null
    status: number
    last_login_ip: string | null
    last_login_time: Date | null
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_userCountAggregateOutputType | null
    _avg: Sys_userAvgAggregateOutputType | null
    _sum: Sys_userSumAggregateOutputType | null
    _min: Sys_userMinAggregateOutputType | null
    _max: Sys_userMaxAggregateOutputType | null
  }

  type GetSys_userGroupByPayload<T extends sys_userGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_userGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_userGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_userGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_userGroupByOutputType[P]>
        }
      >
    >


  export type sys_userSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    tenant_id?: boolean
    username?: boolean
    password?: boolean
    real_name?: boolean
    phone?: boolean
    email?: boolean
    avatar?: boolean
    gender?: boolean
    status?: boolean
    last_login_ip?: boolean
    last_login_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_user"]>

  export type sys_userSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    tenant_id?: boolean
    username?: boolean
    password?: boolean
    real_name?: boolean
    phone?: boolean
    email?: boolean
    avatar?: boolean
    gender?: boolean
    status?: boolean
    last_login_ip?: boolean
    last_login_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_user"]>

  export type sys_userSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    user_id?: boolean
    tenant_id?: boolean
    username?: boolean
    password?: boolean
    real_name?: boolean
    phone?: boolean
    email?: boolean
    avatar?: boolean
    gender?: boolean
    status?: boolean
    last_login_ip?: boolean
    last_login_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_user"]>

  export type sys_userSelectScalar = {
    user_id?: boolean
    tenant_id?: boolean
    username?: boolean
    password?: boolean
    real_name?: boolean
    phone?: boolean
    email?: boolean
    avatar?: boolean
    gender?: boolean
    status?: boolean
    last_login_ip?: boolean
    last_login_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_userOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"user_id" | "tenant_id" | "username" | "password" | "real_name" | "phone" | "email" | "avatar" | "gender" | "status" | "last_login_ip" | "last_login_time" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_user"]>

  export type $sys_userPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_user"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      user_id: string
      tenant_id: string
      username: string
      password: string
      real_name: string | null
      phone: string | null
      email: string | null
      avatar: string | null
      gender: number | null
      status: number
      last_login_ip: string | null
      last_login_time: Date | null
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_user"]>
    composites: {}
  }

  type sys_userGetPayload<S extends boolean | null | undefined | sys_userDefaultArgs> = $Result.GetResult<Prisma.$sys_userPayload, S>

  type sys_userCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_userFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_userCountAggregateInputType | true
    }

  export interface sys_userDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_user'], meta: { name: 'sys_user' } }
    /**
     * Find zero or one Sys_user that matches the filter.
     * @param {sys_userFindUniqueArgs} args - Arguments to find a Sys_user
     * @example
     * // Get one Sys_user
     * const sys_user = await prisma.sys_user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_userFindUniqueArgs>(args: SelectSubset<T, sys_userFindUniqueArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_user that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_userFindUniqueOrThrowArgs} args - Arguments to find a Sys_user
     * @example
     * // Get one Sys_user
     * const sys_user = await prisma.sys_user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_userFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_userFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userFindFirstArgs} args - Arguments to find a Sys_user
     * @example
     * // Get one Sys_user
     * const sys_user = await prisma.sys_user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_userFindFirstArgs>(args?: SelectSubset<T, sys_userFindFirstArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userFindFirstOrThrowArgs} args - Arguments to find a Sys_user
     * @example
     * // Get one Sys_user
     * const sys_user = await prisma.sys_user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_userFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_userFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_users
     * const sys_users = await prisma.sys_user.findMany()
     * 
     * // Get first 10 Sys_users
     * const sys_users = await prisma.sys_user.findMany({ take: 10 })
     * 
     * // Only select the `user_id`
     * const sys_userWithUser_idOnly = await prisma.sys_user.findMany({ select: { user_id: true } })
     * 
     */
    findMany<T extends sys_userFindManyArgs>(args?: SelectSubset<T, sys_userFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_user.
     * @param {sys_userCreateArgs} args - Arguments to create a Sys_user.
     * @example
     * // Create one Sys_user
     * const Sys_user = await prisma.sys_user.create({
     *   data: {
     *     // ... data to create a Sys_user
     *   }
     * })
     * 
     */
    create<T extends sys_userCreateArgs>(args: SelectSubset<T, sys_userCreateArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_users.
     * @param {sys_userCreateManyArgs} args - Arguments to create many Sys_users.
     * @example
     * // Create many Sys_users
     * const sys_user = await prisma.sys_user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_userCreateManyArgs>(args?: SelectSubset<T, sys_userCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_users and returns the data saved in the database.
     * @param {sys_userCreateManyAndReturnArgs} args - Arguments to create many Sys_users.
     * @example
     * // Create many Sys_users
     * const sys_user = await prisma.sys_user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_users and only return the `user_id`
     * const sys_userWithUser_idOnly = await prisma.sys_user.createManyAndReturn({
     *   select: { user_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_userCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_userCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_user.
     * @param {sys_userDeleteArgs} args - Arguments to delete one Sys_user.
     * @example
     * // Delete one Sys_user
     * const Sys_user = await prisma.sys_user.delete({
     *   where: {
     *     // ... filter to delete one Sys_user
     *   }
     * })
     * 
     */
    delete<T extends sys_userDeleteArgs>(args: SelectSubset<T, sys_userDeleteArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_user.
     * @param {sys_userUpdateArgs} args - Arguments to update one Sys_user.
     * @example
     * // Update one Sys_user
     * const sys_user = await prisma.sys_user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_userUpdateArgs>(args: SelectSubset<T, sys_userUpdateArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_users.
     * @param {sys_userDeleteManyArgs} args - Arguments to filter Sys_users to delete.
     * @example
     * // Delete a few Sys_users
     * const { count } = await prisma.sys_user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_userDeleteManyArgs>(args?: SelectSubset<T, sys_userDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_users
     * const sys_user = await prisma.sys_user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_userUpdateManyArgs>(args: SelectSubset<T, sys_userUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_users and returns the data updated in the database.
     * @param {sys_userUpdateManyAndReturnArgs} args - Arguments to update many Sys_users.
     * @example
     * // Update many Sys_users
     * const sys_user = await prisma.sys_user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_users and only return the `user_id`
     * const sys_userWithUser_idOnly = await prisma.sys_user.updateManyAndReturn({
     *   select: { user_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_userUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_userUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_user.
     * @param {sys_userUpsertArgs} args - Arguments to update or create a Sys_user.
     * @example
     * // Update or create a Sys_user
     * const sys_user = await prisma.sys_user.upsert({
     *   create: {
     *     // ... data to create a Sys_user
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_user we want to update
     *   }
     * })
     */
    upsert<T extends sys_userUpsertArgs>(args: SelectSubset<T, sys_userUpsertArgs<ExtArgs>>): Prisma__sys_userClient<$Result.GetResult<Prisma.$sys_userPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userCountArgs} args - Arguments to filter Sys_users to count.
     * @example
     * // Count the number of Sys_users
     * const count = await prisma.sys_user.count({
     *   where: {
     *     // ... the filter for the Sys_users we want to count
     *   }
     * })
    **/
    count<T extends sys_userCountArgs>(
      args?: Subset<T, sys_userCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_userCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_user.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_userAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_userAggregateArgs>(args: Subset<T, Sys_userAggregateArgs>): Prisma.PrismaPromise<GetSys_userAggregateType<T>>

    /**
     * Group by Sys_user.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_userGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_userGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_userGroupByArgs['orderBy'] }
        : { orderBy?: sys_userGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_userGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_userGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_user model
   */
  readonly fields: sys_userFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_user.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_userClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_user model
   */
  interface sys_userFieldRefs {
    readonly user_id: FieldRef<"sys_user", 'String'>
    readonly tenant_id: FieldRef<"sys_user", 'String'>
    readonly username: FieldRef<"sys_user", 'String'>
    readonly password: FieldRef<"sys_user", 'String'>
    readonly real_name: FieldRef<"sys_user", 'String'>
    readonly phone: FieldRef<"sys_user", 'String'>
    readonly email: FieldRef<"sys_user", 'String'>
    readonly avatar: FieldRef<"sys_user", 'String'>
    readonly gender: FieldRef<"sys_user", 'Int'>
    readonly status: FieldRef<"sys_user", 'Int'>
    readonly last_login_ip: FieldRef<"sys_user", 'String'>
    readonly last_login_time: FieldRef<"sys_user", 'DateTime'>
    readonly created_at: FieldRef<"sys_user", 'DateTime'>
    readonly updated_at: FieldRef<"sys_user", 'DateTime'>
    readonly created_by: FieldRef<"sys_user", 'String'>
    readonly updated_by: FieldRef<"sys_user", 'String'>
    readonly is_deleted: FieldRef<"sys_user", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_user findUnique
   */
  export type sys_userFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter, which sys_user to fetch.
     */
    where: sys_userWhereUniqueInput
  }

  /**
   * sys_user findUniqueOrThrow
   */
  export type sys_userFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter, which sys_user to fetch.
     */
    where: sys_userWhereUniqueInput
  }

  /**
   * sys_user findFirst
   */
  export type sys_userFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter, which sys_user to fetch.
     */
    where?: sys_userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_users to fetch.
     */
    orderBy?: sys_userOrderByWithRelationInput | sys_userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_users.
     */
    cursor?: sys_userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_users.
     */
    distinct?: Sys_userScalarFieldEnum | Sys_userScalarFieldEnum[]
  }

  /**
   * sys_user findFirstOrThrow
   */
  export type sys_userFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter, which sys_user to fetch.
     */
    where?: sys_userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_users to fetch.
     */
    orderBy?: sys_userOrderByWithRelationInput | sys_userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_users.
     */
    cursor?: sys_userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_users.
     */
    distinct?: Sys_userScalarFieldEnum | Sys_userScalarFieldEnum[]
  }

  /**
   * sys_user findMany
   */
  export type sys_userFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter, which sys_users to fetch.
     */
    where?: sys_userWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_users to fetch.
     */
    orderBy?: sys_userOrderByWithRelationInput | sys_userOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_users.
     */
    cursor?: sys_userWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_users.
     */
    distinct?: Sys_userScalarFieldEnum | Sys_userScalarFieldEnum[]
  }

  /**
   * sys_user create
   */
  export type sys_userCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_user.
     */
    data: XOR<sys_userCreateInput, sys_userUncheckedCreateInput>
  }

  /**
   * sys_user createMany
   */
  export type sys_userCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_users.
     */
    data: sys_userCreateManyInput | sys_userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user createManyAndReturn
   */
  export type sys_userCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * The data used to create many sys_users.
     */
    data: sys_userCreateManyInput | sys_userCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user update
   */
  export type sys_userUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_user.
     */
    data: XOR<sys_userUpdateInput, sys_userUncheckedUpdateInput>
    /**
     * Choose, which sys_user to update.
     */
    where: sys_userWhereUniqueInput
  }

  /**
   * sys_user updateMany
   */
  export type sys_userUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_users.
     */
    data: XOR<sys_userUpdateManyMutationInput, sys_userUncheckedUpdateManyInput>
    /**
     * Filter which sys_users to update
     */
    where?: sys_userWhereInput
    /**
     * Limit how many sys_users to update.
     */
    limit?: number
  }

  /**
   * sys_user updateManyAndReturn
   */
  export type sys_userUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * The data used to update sys_users.
     */
    data: XOR<sys_userUpdateManyMutationInput, sys_userUncheckedUpdateManyInput>
    /**
     * Filter which sys_users to update
     */
    where?: sys_userWhereInput
    /**
     * Limit how many sys_users to update.
     */
    limit?: number
  }

  /**
   * sys_user upsert
   */
  export type sys_userUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_user to update in case it exists.
     */
    where: sys_userWhereUniqueInput
    /**
     * In case the sys_user found by the `where` argument doesn't exist, create a new sys_user with this data.
     */
    create: XOR<sys_userCreateInput, sys_userUncheckedCreateInput>
    /**
     * In case the sys_user was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_userUpdateInput, sys_userUncheckedUpdateInput>
  }

  /**
   * sys_user delete
   */
  export type sys_userDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
    /**
     * Filter which sys_user to delete.
     */
    where: sys_userWhereUniqueInput
  }

  /**
   * sys_user deleteMany
   */
  export type sys_userDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_users to delete
     */
    where?: sys_userWhereInput
    /**
     * Limit how many sys_users to delete.
     */
    limit?: number
  }

  /**
   * sys_user without action
   */
  export type sys_userDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user
     */
    select?: sys_userSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user
     */
    omit?: sys_userOmit<ExtArgs> | null
  }


  /**
   * Model sys_role
   */

  export type AggregateSys_role = {
    _count: Sys_roleCountAggregateOutputType | null
    _avg: Sys_roleAvgAggregateOutputType | null
    _sum: Sys_roleSumAggregateOutputType | null
    _min: Sys_roleMinAggregateOutputType | null
    _max: Sys_roleMaxAggregateOutputType | null
  }

  export type Sys_roleAvgAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_roleSumAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_roleMinAggregateOutputType = {
    role_id: string | null
    tenant_id: string | null
    role_code: string | null
    role_name: string | null
    description: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_roleMaxAggregateOutputType = {
    role_id: string | null
    tenant_id: string | null
    role_code: string | null
    role_name: string | null
    description: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_roleCountAggregateOutputType = {
    role_id: number
    tenant_id: number
    role_code: number
    role_name: number
    description: number
    sort_order: number
    status: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_roleAvgAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_roleSumAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_roleMinAggregateInputType = {
    role_id?: true
    tenant_id?: true
    role_code?: true
    role_name?: true
    description?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_roleMaxAggregateInputType = {
    role_id?: true
    tenant_id?: true
    role_code?: true
    role_name?: true
    description?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_roleCountAggregateInputType = {
    role_id?: true
    tenant_id?: true
    role_code?: true
    role_name?: true
    description?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_roleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_role to aggregate.
     */
    where?: sys_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_roles to fetch.
     */
    orderBy?: sys_roleOrderByWithRelationInput | sys_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_roles
    **/
    _count?: true | Sys_roleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_roleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_roleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_roleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_roleMaxAggregateInputType
  }

  export type GetSys_roleAggregateType<T extends Sys_roleAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_role]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_role[P]>
      : GetScalarType<T[P], AggregateSys_role[P]>
  }




  export type sys_roleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_roleWhereInput
    orderBy?: sys_roleOrderByWithAggregationInput | sys_roleOrderByWithAggregationInput[]
    by: Sys_roleScalarFieldEnum[] | Sys_roleScalarFieldEnum
    having?: sys_roleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_roleCountAggregateInputType | true
    _avg?: Sys_roleAvgAggregateInputType
    _sum?: Sys_roleSumAggregateInputType
    _min?: Sys_roleMinAggregateInputType
    _max?: Sys_roleMaxAggregateInputType
  }

  export type Sys_roleGroupByOutputType = {
    role_id: string
    tenant_id: string
    role_code: string
    role_name: string
    description: string | null
    sort_order: number
    status: number
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_roleCountAggregateOutputType | null
    _avg: Sys_roleAvgAggregateOutputType | null
    _sum: Sys_roleSumAggregateOutputType | null
    _min: Sys_roleMinAggregateOutputType | null
    _max: Sys_roleMaxAggregateOutputType | null
  }

  type GetSys_roleGroupByPayload<T extends sys_roleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_roleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_roleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_roleGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_roleGroupByOutputType[P]>
        }
      >
    >


  export type sys_roleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    role_id?: boolean
    tenant_id?: boolean
    role_code?: boolean
    role_name?: boolean
    description?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_role"]>

  export type sys_roleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    role_id?: boolean
    tenant_id?: boolean
    role_code?: boolean
    role_name?: boolean
    description?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_role"]>

  export type sys_roleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    role_id?: boolean
    tenant_id?: boolean
    role_code?: boolean
    role_name?: boolean
    description?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_role"]>

  export type sys_roleSelectScalar = {
    role_id?: boolean
    tenant_id?: boolean
    role_code?: boolean
    role_name?: boolean
    description?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_roleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"role_id" | "tenant_id" | "role_code" | "role_name" | "description" | "sort_order" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_role"]>

  export type $sys_rolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_role"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      role_id: string
      tenant_id: string
      role_code: string
      role_name: string
      description: string | null
      sort_order: number
      status: number
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_role"]>
    composites: {}
  }

  type sys_roleGetPayload<S extends boolean | null | undefined | sys_roleDefaultArgs> = $Result.GetResult<Prisma.$sys_rolePayload, S>

  type sys_roleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_roleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_roleCountAggregateInputType | true
    }

  export interface sys_roleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_role'], meta: { name: 'sys_role' } }
    /**
     * Find zero or one Sys_role that matches the filter.
     * @param {sys_roleFindUniqueArgs} args - Arguments to find a Sys_role
     * @example
     * // Get one Sys_role
     * const sys_role = await prisma.sys_role.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_roleFindUniqueArgs>(args: SelectSubset<T, sys_roleFindUniqueArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_role that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_roleFindUniqueOrThrowArgs} args - Arguments to find a Sys_role
     * @example
     * // Get one Sys_role
     * const sys_role = await prisma.sys_role.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_roleFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_roleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleFindFirstArgs} args - Arguments to find a Sys_role
     * @example
     * // Get one Sys_role
     * const sys_role = await prisma.sys_role.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_roleFindFirstArgs>(args?: SelectSubset<T, sys_roleFindFirstArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleFindFirstOrThrowArgs} args - Arguments to find a Sys_role
     * @example
     * // Get one Sys_role
     * const sys_role = await prisma.sys_role.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_roleFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_roleFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_roles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_roles
     * const sys_roles = await prisma.sys_role.findMany()
     * 
     * // Get first 10 Sys_roles
     * const sys_roles = await prisma.sys_role.findMany({ take: 10 })
     * 
     * // Only select the `role_id`
     * const sys_roleWithRole_idOnly = await prisma.sys_role.findMany({ select: { role_id: true } })
     * 
     */
    findMany<T extends sys_roleFindManyArgs>(args?: SelectSubset<T, sys_roleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_role.
     * @param {sys_roleCreateArgs} args - Arguments to create a Sys_role.
     * @example
     * // Create one Sys_role
     * const Sys_role = await prisma.sys_role.create({
     *   data: {
     *     // ... data to create a Sys_role
     *   }
     * })
     * 
     */
    create<T extends sys_roleCreateArgs>(args: SelectSubset<T, sys_roleCreateArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_roles.
     * @param {sys_roleCreateManyArgs} args - Arguments to create many Sys_roles.
     * @example
     * // Create many Sys_roles
     * const sys_role = await prisma.sys_role.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_roleCreateManyArgs>(args?: SelectSubset<T, sys_roleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_roles and returns the data saved in the database.
     * @param {sys_roleCreateManyAndReturnArgs} args - Arguments to create many Sys_roles.
     * @example
     * // Create many Sys_roles
     * const sys_role = await prisma.sys_role.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_roles and only return the `role_id`
     * const sys_roleWithRole_idOnly = await prisma.sys_role.createManyAndReturn({
     *   select: { role_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_roleCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_roleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_role.
     * @param {sys_roleDeleteArgs} args - Arguments to delete one Sys_role.
     * @example
     * // Delete one Sys_role
     * const Sys_role = await prisma.sys_role.delete({
     *   where: {
     *     // ... filter to delete one Sys_role
     *   }
     * })
     * 
     */
    delete<T extends sys_roleDeleteArgs>(args: SelectSubset<T, sys_roleDeleteArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_role.
     * @param {sys_roleUpdateArgs} args - Arguments to update one Sys_role.
     * @example
     * // Update one Sys_role
     * const sys_role = await prisma.sys_role.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_roleUpdateArgs>(args: SelectSubset<T, sys_roleUpdateArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_roles.
     * @param {sys_roleDeleteManyArgs} args - Arguments to filter Sys_roles to delete.
     * @example
     * // Delete a few Sys_roles
     * const { count } = await prisma.sys_role.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_roleDeleteManyArgs>(args?: SelectSubset<T, sys_roleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_roles
     * const sys_role = await prisma.sys_role.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_roleUpdateManyArgs>(args: SelectSubset<T, sys_roleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_roles and returns the data updated in the database.
     * @param {sys_roleUpdateManyAndReturnArgs} args - Arguments to update many Sys_roles.
     * @example
     * // Update many Sys_roles
     * const sys_role = await prisma.sys_role.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_roles and only return the `role_id`
     * const sys_roleWithRole_idOnly = await prisma.sys_role.updateManyAndReturn({
     *   select: { role_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_roleUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_roleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_role.
     * @param {sys_roleUpsertArgs} args - Arguments to update or create a Sys_role.
     * @example
     * // Update or create a Sys_role
     * const sys_role = await prisma.sys_role.upsert({
     *   create: {
     *     // ... data to create a Sys_role
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_role we want to update
     *   }
     * })
     */
    upsert<T extends sys_roleUpsertArgs>(args: SelectSubset<T, sys_roleUpsertArgs<ExtArgs>>): Prisma__sys_roleClient<$Result.GetResult<Prisma.$sys_rolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleCountArgs} args - Arguments to filter Sys_roles to count.
     * @example
     * // Count the number of Sys_roles
     * const count = await prisma.sys_role.count({
     *   where: {
     *     // ... the filter for the Sys_roles we want to count
     *   }
     * })
    **/
    count<T extends sys_roleCountArgs>(
      args?: Subset<T, sys_roleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_roleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_roleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_roleAggregateArgs>(args: Subset<T, Sys_roleAggregateArgs>): Prisma.PrismaPromise<GetSys_roleAggregateType<T>>

    /**
     * Group by Sys_role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_roleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_roleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_roleGroupByArgs['orderBy'] }
        : { orderBy?: sys_roleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_roleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_roleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_role model
   */
  readonly fields: sys_roleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_role.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_roleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_role model
   */
  interface sys_roleFieldRefs {
    readonly role_id: FieldRef<"sys_role", 'String'>
    readonly tenant_id: FieldRef<"sys_role", 'String'>
    readonly role_code: FieldRef<"sys_role", 'String'>
    readonly role_name: FieldRef<"sys_role", 'String'>
    readonly description: FieldRef<"sys_role", 'String'>
    readonly sort_order: FieldRef<"sys_role", 'Int'>
    readonly status: FieldRef<"sys_role", 'Int'>
    readonly created_at: FieldRef<"sys_role", 'DateTime'>
    readonly updated_at: FieldRef<"sys_role", 'DateTime'>
    readonly created_by: FieldRef<"sys_role", 'String'>
    readonly updated_by: FieldRef<"sys_role", 'String'>
    readonly is_deleted: FieldRef<"sys_role", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_role findUnique
   */
  export type sys_roleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_role to fetch.
     */
    where: sys_roleWhereUniqueInput
  }

  /**
   * sys_role findUniqueOrThrow
   */
  export type sys_roleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_role to fetch.
     */
    where: sys_roleWhereUniqueInput
  }

  /**
   * sys_role findFirst
   */
  export type sys_roleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_role to fetch.
     */
    where?: sys_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_roles to fetch.
     */
    orderBy?: sys_roleOrderByWithRelationInput | sys_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_roles.
     */
    cursor?: sys_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_roles.
     */
    distinct?: Sys_roleScalarFieldEnum | Sys_roleScalarFieldEnum[]
  }

  /**
   * sys_role findFirstOrThrow
   */
  export type sys_roleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_role to fetch.
     */
    where?: sys_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_roles to fetch.
     */
    orderBy?: sys_roleOrderByWithRelationInput | sys_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_roles.
     */
    cursor?: sys_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_roles.
     */
    distinct?: Sys_roleScalarFieldEnum | Sys_roleScalarFieldEnum[]
  }

  /**
   * sys_role findMany
   */
  export type sys_roleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_roles to fetch.
     */
    where?: sys_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_roles to fetch.
     */
    orderBy?: sys_roleOrderByWithRelationInput | sys_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_roles.
     */
    cursor?: sys_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_roles.
     */
    distinct?: Sys_roleScalarFieldEnum | Sys_roleScalarFieldEnum[]
  }

  /**
   * sys_role create
   */
  export type sys_roleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_role.
     */
    data: XOR<sys_roleCreateInput, sys_roleUncheckedCreateInput>
  }

  /**
   * sys_role createMany
   */
  export type sys_roleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_roles.
     */
    data: sys_roleCreateManyInput | sys_roleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role createManyAndReturn
   */
  export type sys_roleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * The data used to create many sys_roles.
     */
    data: sys_roleCreateManyInput | sys_roleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role update
   */
  export type sys_roleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_role.
     */
    data: XOR<sys_roleUpdateInput, sys_roleUncheckedUpdateInput>
    /**
     * Choose, which sys_role to update.
     */
    where: sys_roleWhereUniqueInput
  }

  /**
   * sys_role updateMany
   */
  export type sys_roleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_roles.
     */
    data: XOR<sys_roleUpdateManyMutationInput, sys_roleUncheckedUpdateManyInput>
    /**
     * Filter which sys_roles to update
     */
    where?: sys_roleWhereInput
    /**
     * Limit how many sys_roles to update.
     */
    limit?: number
  }

  /**
   * sys_role updateManyAndReturn
   */
  export type sys_roleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * The data used to update sys_roles.
     */
    data: XOR<sys_roleUpdateManyMutationInput, sys_roleUncheckedUpdateManyInput>
    /**
     * Filter which sys_roles to update
     */
    where?: sys_roleWhereInput
    /**
     * Limit how many sys_roles to update.
     */
    limit?: number
  }

  /**
   * sys_role upsert
   */
  export type sys_roleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_role to update in case it exists.
     */
    where: sys_roleWhereUniqueInput
    /**
     * In case the sys_role found by the `where` argument doesn't exist, create a new sys_role with this data.
     */
    create: XOR<sys_roleCreateInput, sys_roleUncheckedCreateInput>
    /**
     * In case the sys_role was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_roleUpdateInput, sys_roleUncheckedUpdateInput>
  }

  /**
   * sys_role delete
   */
  export type sys_roleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
    /**
     * Filter which sys_role to delete.
     */
    where: sys_roleWhereUniqueInput
  }

  /**
   * sys_role deleteMany
   */
  export type sys_roleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_roles to delete
     */
    where?: sys_roleWhereInput
    /**
     * Limit how many sys_roles to delete.
     */
    limit?: number
  }

  /**
   * sys_role without action
   */
  export type sys_roleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role
     */
    select?: sys_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role
     */
    omit?: sys_roleOmit<ExtArgs> | null
  }


  /**
   * Model sys_dept
   */

  export type AggregateSys_dept = {
    _count: Sys_deptCountAggregateOutputType | null
    _avg: Sys_deptAvgAggregateOutputType | null
    _sum: Sys_deptSumAggregateOutputType | null
    _min: Sys_deptMinAggregateOutputType | null
    _max: Sys_deptMaxAggregateOutputType | null
  }

  export type Sys_deptAvgAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_deptSumAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_deptMinAggregateOutputType = {
    dept_id: string | null
    tenant_id: string | null
    parent_id: string | null
    dept_code: string | null
    dept_name: string | null
    leader: string | null
    phone: string | null
    email: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_deptMaxAggregateOutputType = {
    dept_id: string | null
    tenant_id: string | null
    parent_id: string | null
    dept_code: string | null
    dept_name: string | null
    leader: string | null
    phone: string | null
    email: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_deptCountAggregateOutputType = {
    dept_id: number
    tenant_id: number
    parent_id: number
    dept_code: number
    dept_name: number
    leader: number
    phone: number
    email: number
    sort_order: number
    status: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_deptAvgAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_deptSumAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_deptMinAggregateInputType = {
    dept_id?: true
    tenant_id?: true
    parent_id?: true
    dept_code?: true
    dept_name?: true
    leader?: true
    phone?: true
    email?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_deptMaxAggregateInputType = {
    dept_id?: true
    tenant_id?: true
    parent_id?: true
    dept_code?: true
    dept_name?: true
    leader?: true
    phone?: true
    email?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_deptCountAggregateInputType = {
    dept_id?: true
    tenant_id?: true
    parent_id?: true
    dept_code?: true
    dept_name?: true
    leader?: true
    phone?: true
    email?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_deptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_dept to aggregate.
     */
    where?: sys_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_depts to fetch.
     */
    orderBy?: sys_deptOrderByWithRelationInput | sys_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_depts
    **/
    _count?: true | Sys_deptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_deptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_deptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_deptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_deptMaxAggregateInputType
  }

  export type GetSys_deptAggregateType<T extends Sys_deptAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_dept]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_dept[P]>
      : GetScalarType<T[P], AggregateSys_dept[P]>
  }




  export type sys_deptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_deptWhereInput
    orderBy?: sys_deptOrderByWithAggregationInput | sys_deptOrderByWithAggregationInput[]
    by: Sys_deptScalarFieldEnum[] | Sys_deptScalarFieldEnum
    having?: sys_deptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_deptCountAggregateInputType | true
    _avg?: Sys_deptAvgAggregateInputType
    _sum?: Sys_deptSumAggregateInputType
    _min?: Sys_deptMinAggregateInputType
    _max?: Sys_deptMaxAggregateInputType
  }

  export type Sys_deptGroupByOutputType = {
    dept_id: string
    tenant_id: string
    parent_id: string
    dept_code: string
    dept_name: string
    leader: string | null
    phone: string | null
    email: string | null
    sort_order: number
    status: number
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_deptCountAggregateOutputType | null
    _avg: Sys_deptAvgAggregateOutputType | null
    _sum: Sys_deptSumAggregateOutputType | null
    _min: Sys_deptMinAggregateOutputType | null
    _max: Sys_deptMaxAggregateOutputType | null
  }

  type GetSys_deptGroupByPayload<T extends sys_deptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_deptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_deptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_deptGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_deptGroupByOutputType[P]>
        }
      >
    >


  export type sys_deptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dept_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    dept_code?: boolean
    dept_name?: boolean
    leader?: boolean
    phone?: boolean
    email?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dept"]>

  export type sys_deptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dept_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    dept_code?: boolean
    dept_name?: boolean
    leader?: boolean
    phone?: boolean
    email?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dept"]>

  export type sys_deptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dept_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    dept_code?: boolean
    dept_name?: boolean
    leader?: boolean
    phone?: boolean
    email?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dept"]>

  export type sys_deptSelectScalar = {
    dept_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    dept_code?: boolean
    dept_name?: boolean
    leader?: boolean
    phone?: boolean
    email?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_deptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"dept_id" | "tenant_id" | "parent_id" | "dept_code" | "dept_name" | "leader" | "phone" | "email" | "sort_order" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_dept"]>

  export type $sys_deptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_dept"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      dept_id: string
      tenant_id: string
      parent_id: string
      dept_code: string
      dept_name: string
      leader: string | null
      phone: string | null
      email: string | null
      sort_order: number
      status: number
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_dept"]>
    composites: {}
  }

  type sys_deptGetPayload<S extends boolean | null | undefined | sys_deptDefaultArgs> = $Result.GetResult<Prisma.$sys_deptPayload, S>

  type sys_deptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_deptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_deptCountAggregateInputType | true
    }

  export interface sys_deptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_dept'], meta: { name: 'sys_dept' } }
    /**
     * Find zero or one Sys_dept that matches the filter.
     * @param {sys_deptFindUniqueArgs} args - Arguments to find a Sys_dept
     * @example
     * // Get one Sys_dept
     * const sys_dept = await prisma.sys_dept.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_deptFindUniqueArgs>(args: SelectSubset<T, sys_deptFindUniqueArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_dept that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_deptFindUniqueOrThrowArgs} args - Arguments to find a Sys_dept
     * @example
     * // Get one Sys_dept
     * const sys_dept = await prisma.sys_dept.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_deptFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_deptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dept that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptFindFirstArgs} args - Arguments to find a Sys_dept
     * @example
     * // Get one Sys_dept
     * const sys_dept = await prisma.sys_dept.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_deptFindFirstArgs>(args?: SelectSubset<T, sys_deptFindFirstArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dept that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptFindFirstOrThrowArgs} args - Arguments to find a Sys_dept
     * @example
     * // Get one Sys_dept
     * const sys_dept = await prisma.sys_dept.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_deptFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_deptFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_depts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_depts
     * const sys_depts = await prisma.sys_dept.findMany()
     * 
     * // Get first 10 Sys_depts
     * const sys_depts = await prisma.sys_dept.findMany({ take: 10 })
     * 
     * // Only select the `dept_id`
     * const sys_deptWithDept_idOnly = await prisma.sys_dept.findMany({ select: { dept_id: true } })
     * 
     */
    findMany<T extends sys_deptFindManyArgs>(args?: SelectSubset<T, sys_deptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_dept.
     * @param {sys_deptCreateArgs} args - Arguments to create a Sys_dept.
     * @example
     * // Create one Sys_dept
     * const Sys_dept = await prisma.sys_dept.create({
     *   data: {
     *     // ... data to create a Sys_dept
     *   }
     * })
     * 
     */
    create<T extends sys_deptCreateArgs>(args: SelectSubset<T, sys_deptCreateArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_depts.
     * @param {sys_deptCreateManyArgs} args - Arguments to create many Sys_depts.
     * @example
     * // Create many Sys_depts
     * const sys_dept = await prisma.sys_dept.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_deptCreateManyArgs>(args?: SelectSubset<T, sys_deptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_depts and returns the data saved in the database.
     * @param {sys_deptCreateManyAndReturnArgs} args - Arguments to create many Sys_depts.
     * @example
     * // Create many Sys_depts
     * const sys_dept = await prisma.sys_dept.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_depts and only return the `dept_id`
     * const sys_deptWithDept_idOnly = await prisma.sys_dept.createManyAndReturn({
     *   select: { dept_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_deptCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_deptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_dept.
     * @param {sys_deptDeleteArgs} args - Arguments to delete one Sys_dept.
     * @example
     * // Delete one Sys_dept
     * const Sys_dept = await prisma.sys_dept.delete({
     *   where: {
     *     // ... filter to delete one Sys_dept
     *   }
     * })
     * 
     */
    delete<T extends sys_deptDeleteArgs>(args: SelectSubset<T, sys_deptDeleteArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_dept.
     * @param {sys_deptUpdateArgs} args - Arguments to update one Sys_dept.
     * @example
     * // Update one Sys_dept
     * const sys_dept = await prisma.sys_dept.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_deptUpdateArgs>(args: SelectSubset<T, sys_deptUpdateArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_depts.
     * @param {sys_deptDeleteManyArgs} args - Arguments to filter Sys_depts to delete.
     * @example
     * // Delete a few Sys_depts
     * const { count } = await prisma.sys_dept.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_deptDeleteManyArgs>(args?: SelectSubset<T, sys_deptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_depts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_depts
     * const sys_dept = await prisma.sys_dept.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_deptUpdateManyArgs>(args: SelectSubset<T, sys_deptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_depts and returns the data updated in the database.
     * @param {sys_deptUpdateManyAndReturnArgs} args - Arguments to update many Sys_depts.
     * @example
     * // Update many Sys_depts
     * const sys_dept = await prisma.sys_dept.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_depts and only return the `dept_id`
     * const sys_deptWithDept_idOnly = await prisma.sys_dept.updateManyAndReturn({
     *   select: { dept_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_deptUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_deptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_dept.
     * @param {sys_deptUpsertArgs} args - Arguments to update or create a Sys_dept.
     * @example
     * // Update or create a Sys_dept
     * const sys_dept = await prisma.sys_dept.upsert({
     *   create: {
     *     // ... data to create a Sys_dept
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_dept we want to update
     *   }
     * })
     */
    upsert<T extends sys_deptUpsertArgs>(args: SelectSubset<T, sys_deptUpsertArgs<ExtArgs>>): Prisma__sys_deptClient<$Result.GetResult<Prisma.$sys_deptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_depts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptCountArgs} args - Arguments to filter Sys_depts to count.
     * @example
     * // Count the number of Sys_depts
     * const count = await prisma.sys_dept.count({
     *   where: {
     *     // ... the filter for the Sys_depts we want to count
     *   }
     * })
    **/
    count<T extends sys_deptCountArgs>(
      args?: Subset<T, sys_deptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_deptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_dept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_deptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_deptAggregateArgs>(args: Subset<T, Sys_deptAggregateArgs>): Prisma.PrismaPromise<GetSys_deptAggregateType<T>>

    /**
     * Group by Sys_dept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_deptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_deptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_deptGroupByArgs['orderBy'] }
        : { orderBy?: sys_deptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_deptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_deptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_dept model
   */
  readonly fields: sys_deptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_dept.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_deptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_dept model
   */
  interface sys_deptFieldRefs {
    readonly dept_id: FieldRef<"sys_dept", 'String'>
    readonly tenant_id: FieldRef<"sys_dept", 'String'>
    readonly parent_id: FieldRef<"sys_dept", 'String'>
    readonly dept_code: FieldRef<"sys_dept", 'String'>
    readonly dept_name: FieldRef<"sys_dept", 'String'>
    readonly leader: FieldRef<"sys_dept", 'String'>
    readonly phone: FieldRef<"sys_dept", 'String'>
    readonly email: FieldRef<"sys_dept", 'String'>
    readonly sort_order: FieldRef<"sys_dept", 'Int'>
    readonly status: FieldRef<"sys_dept", 'Int'>
    readonly created_at: FieldRef<"sys_dept", 'DateTime'>
    readonly updated_at: FieldRef<"sys_dept", 'DateTime'>
    readonly created_by: FieldRef<"sys_dept", 'String'>
    readonly updated_by: FieldRef<"sys_dept", 'String'>
    readonly is_deleted: FieldRef<"sys_dept", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_dept findUnique
   */
  export type sys_deptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_dept to fetch.
     */
    where: sys_deptWhereUniqueInput
  }

  /**
   * sys_dept findUniqueOrThrow
   */
  export type sys_deptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_dept to fetch.
     */
    where: sys_deptWhereUniqueInput
  }

  /**
   * sys_dept findFirst
   */
  export type sys_deptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_dept to fetch.
     */
    where?: sys_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_depts to fetch.
     */
    orderBy?: sys_deptOrderByWithRelationInput | sys_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_depts.
     */
    cursor?: sys_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_depts.
     */
    distinct?: Sys_deptScalarFieldEnum | Sys_deptScalarFieldEnum[]
  }

  /**
   * sys_dept findFirstOrThrow
   */
  export type sys_deptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_dept to fetch.
     */
    where?: sys_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_depts to fetch.
     */
    orderBy?: sys_deptOrderByWithRelationInput | sys_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_depts.
     */
    cursor?: sys_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_depts.
     */
    distinct?: Sys_deptScalarFieldEnum | Sys_deptScalarFieldEnum[]
  }

  /**
   * sys_dept findMany
   */
  export type sys_deptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_depts to fetch.
     */
    where?: sys_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_depts to fetch.
     */
    orderBy?: sys_deptOrderByWithRelationInput | sys_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_depts.
     */
    cursor?: sys_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_depts.
     */
    distinct?: Sys_deptScalarFieldEnum | Sys_deptScalarFieldEnum[]
  }

  /**
   * sys_dept create
   */
  export type sys_deptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_dept.
     */
    data: XOR<sys_deptCreateInput, sys_deptUncheckedCreateInput>
  }

  /**
   * sys_dept createMany
   */
  export type sys_deptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_depts.
     */
    data: sys_deptCreateManyInput | sys_deptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dept createManyAndReturn
   */
  export type sys_deptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * The data used to create many sys_depts.
     */
    data: sys_deptCreateManyInput | sys_deptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dept update
   */
  export type sys_deptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_dept.
     */
    data: XOR<sys_deptUpdateInput, sys_deptUncheckedUpdateInput>
    /**
     * Choose, which sys_dept to update.
     */
    where: sys_deptWhereUniqueInput
  }

  /**
   * sys_dept updateMany
   */
  export type sys_deptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_depts.
     */
    data: XOR<sys_deptUpdateManyMutationInput, sys_deptUncheckedUpdateManyInput>
    /**
     * Filter which sys_depts to update
     */
    where?: sys_deptWhereInput
    /**
     * Limit how many sys_depts to update.
     */
    limit?: number
  }

  /**
   * sys_dept updateManyAndReturn
   */
  export type sys_deptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * The data used to update sys_depts.
     */
    data: XOR<sys_deptUpdateManyMutationInput, sys_deptUncheckedUpdateManyInput>
    /**
     * Filter which sys_depts to update
     */
    where?: sys_deptWhereInput
    /**
     * Limit how many sys_depts to update.
     */
    limit?: number
  }

  /**
   * sys_dept upsert
   */
  export type sys_deptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_dept to update in case it exists.
     */
    where: sys_deptWhereUniqueInput
    /**
     * In case the sys_dept found by the `where` argument doesn't exist, create a new sys_dept with this data.
     */
    create: XOR<sys_deptCreateInput, sys_deptUncheckedCreateInput>
    /**
     * In case the sys_dept was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_deptUpdateInput, sys_deptUncheckedUpdateInput>
  }

  /**
   * sys_dept delete
   */
  export type sys_deptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
    /**
     * Filter which sys_dept to delete.
     */
    where: sys_deptWhereUniqueInput
  }

  /**
   * sys_dept deleteMany
   */
  export type sys_deptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_depts to delete
     */
    where?: sys_deptWhereInput
    /**
     * Limit how many sys_depts to delete.
     */
    limit?: number
  }

  /**
   * sys_dept without action
   */
  export type sys_deptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dept
     */
    select?: sys_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dept
     */
    omit?: sys_deptOmit<ExtArgs> | null
  }


  /**
   * Model sys_menu
   */

  export type AggregateSys_menu = {
    _count: Sys_menuCountAggregateOutputType | null
    _avg: Sys_menuAvgAggregateOutputType | null
    _sum: Sys_menuSumAggregateOutputType | null
    _min: Sys_menuMinAggregateOutputType | null
    _max: Sys_menuMaxAggregateOutputType | null
  }

  export type Sys_menuAvgAggregateOutputType = {
    menu_type: number | null
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_menuSumAggregateOutputType = {
    menu_type: number | null
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_menuMinAggregateOutputType = {
    menu_id: string | null
    tenant_id: string | null
    parent_id: string | null
    menu_name: string | null
    menu_type: number | null
    icon: string | null
    path: string | null
    component: string | null
    permission: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_menuMaxAggregateOutputType = {
    menu_id: string | null
    tenant_id: string | null
    parent_id: string | null
    menu_name: string | null
    menu_type: number | null
    icon: string | null
    path: string | null
    component: string | null
    permission: string | null
    sort_order: number | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_menuCountAggregateOutputType = {
    menu_id: number
    tenant_id: number
    parent_id: number
    menu_name: number
    menu_type: number
    icon: number
    path: number
    component: number
    permission: number
    sort_order: number
    status: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_menuAvgAggregateInputType = {
    menu_type?: true
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_menuSumAggregateInputType = {
    menu_type?: true
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_menuMinAggregateInputType = {
    menu_id?: true
    tenant_id?: true
    parent_id?: true
    menu_name?: true
    menu_type?: true
    icon?: true
    path?: true
    component?: true
    permission?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_menuMaxAggregateInputType = {
    menu_id?: true
    tenant_id?: true
    parent_id?: true
    menu_name?: true
    menu_type?: true
    icon?: true
    path?: true
    component?: true
    permission?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_menuCountAggregateInputType = {
    menu_id?: true
    tenant_id?: true
    parent_id?: true
    menu_name?: true
    menu_type?: true
    icon?: true
    path?: true
    component?: true
    permission?: true
    sort_order?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_menuAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_menu to aggregate.
     */
    where?: sys_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_menus to fetch.
     */
    orderBy?: sys_menuOrderByWithRelationInput | sys_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_menus
    **/
    _count?: true | Sys_menuCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_menuAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_menuSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_menuMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_menuMaxAggregateInputType
  }

  export type GetSys_menuAggregateType<T extends Sys_menuAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_menu]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_menu[P]>
      : GetScalarType<T[P], AggregateSys_menu[P]>
  }




  export type sys_menuGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_menuWhereInput
    orderBy?: sys_menuOrderByWithAggregationInput | sys_menuOrderByWithAggregationInput[]
    by: Sys_menuScalarFieldEnum[] | Sys_menuScalarFieldEnum
    having?: sys_menuScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_menuCountAggregateInputType | true
    _avg?: Sys_menuAvgAggregateInputType
    _sum?: Sys_menuSumAggregateInputType
    _min?: Sys_menuMinAggregateInputType
    _max?: Sys_menuMaxAggregateInputType
  }

  export type Sys_menuGroupByOutputType = {
    menu_id: string
    tenant_id: string
    parent_id: string
    menu_name: string
    menu_type: number
    icon: string | null
    path: string | null
    component: string | null
    permission: string | null
    sort_order: number
    status: number
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_menuCountAggregateOutputType | null
    _avg: Sys_menuAvgAggregateOutputType | null
    _sum: Sys_menuSumAggregateOutputType | null
    _min: Sys_menuMinAggregateOutputType | null
    _max: Sys_menuMaxAggregateOutputType | null
  }

  type GetSys_menuGroupByPayload<T extends sys_menuGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_menuGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_menuGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_menuGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_menuGroupByOutputType[P]>
        }
      >
    >


  export type sys_menuSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    menu_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    menu_name?: boolean
    menu_type?: boolean
    icon?: boolean
    path?: boolean
    component?: boolean
    permission?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_menu"]>

  export type sys_menuSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    menu_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    menu_name?: boolean
    menu_type?: boolean
    icon?: boolean
    path?: boolean
    component?: boolean
    permission?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_menu"]>

  export type sys_menuSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    menu_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    menu_name?: boolean
    menu_type?: boolean
    icon?: boolean
    path?: boolean
    component?: boolean
    permission?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_menu"]>

  export type sys_menuSelectScalar = {
    menu_id?: boolean
    tenant_id?: boolean
    parent_id?: boolean
    menu_name?: boolean
    menu_type?: boolean
    icon?: boolean
    path?: boolean
    component?: boolean
    permission?: boolean
    sort_order?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_menuOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"menu_id" | "tenant_id" | "parent_id" | "menu_name" | "menu_type" | "icon" | "path" | "component" | "permission" | "sort_order" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_menu"]>

  export type $sys_menuPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_menu"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      menu_id: string
      tenant_id: string
      parent_id: string
      menu_name: string
      menu_type: number
      icon: string | null
      path: string | null
      component: string | null
      permission: string | null
      sort_order: number
      status: number
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_menu"]>
    composites: {}
  }

  type sys_menuGetPayload<S extends boolean | null | undefined | sys_menuDefaultArgs> = $Result.GetResult<Prisma.$sys_menuPayload, S>

  type sys_menuCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_menuFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_menuCountAggregateInputType | true
    }

  export interface sys_menuDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_menu'], meta: { name: 'sys_menu' } }
    /**
     * Find zero or one Sys_menu that matches the filter.
     * @param {sys_menuFindUniqueArgs} args - Arguments to find a Sys_menu
     * @example
     * // Get one Sys_menu
     * const sys_menu = await prisma.sys_menu.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_menuFindUniqueArgs>(args: SelectSubset<T, sys_menuFindUniqueArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_menu that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_menuFindUniqueOrThrowArgs} args - Arguments to find a Sys_menu
     * @example
     * // Get one Sys_menu
     * const sys_menu = await prisma.sys_menu.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_menuFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_menuFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_menu that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuFindFirstArgs} args - Arguments to find a Sys_menu
     * @example
     * // Get one Sys_menu
     * const sys_menu = await prisma.sys_menu.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_menuFindFirstArgs>(args?: SelectSubset<T, sys_menuFindFirstArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_menu that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuFindFirstOrThrowArgs} args - Arguments to find a Sys_menu
     * @example
     * // Get one Sys_menu
     * const sys_menu = await prisma.sys_menu.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_menuFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_menuFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_menus that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_menus
     * const sys_menus = await prisma.sys_menu.findMany()
     * 
     * // Get first 10 Sys_menus
     * const sys_menus = await prisma.sys_menu.findMany({ take: 10 })
     * 
     * // Only select the `menu_id`
     * const sys_menuWithMenu_idOnly = await prisma.sys_menu.findMany({ select: { menu_id: true } })
     * 
     */
    findMany<T extends sys_menuFindManyArgs>(args?: SelectSubset<T, sys_menuFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_menu.
     * @param {sys_menuCreateArgs} args - Arguments to create a Sys_menu.
     * @example
     * // Create one Sys_menu
     * const Sys_menu = await prisma.sys_menu.create({
     *   data: {
     *     // ... data to create a Sys_menu
     *   }
     * })
     * 
     */
    create<T extends sys_menuCreateArgs>(args: SelectSubset<T, sys_menuCreateArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_menus.
     * @param {sys_menuCreateManyArgs} args - Arguments to create many Sys_menus.
     * @example
     * // Create many Sys_menus
     * const sys_menu = await prisma.sys_menu.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_menuCreateManyArgs>(args?: SelectSubset<T, sys_menuCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_menus and returns the data saved in the database.
     * @param {sys_menuCreateManyAndReturnArgs} args - Arguments to create many Sys_menus.
     * @example
     * // Create many Sys_menus
     * const sys_menu = await prisma.sys_menu.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_menus and only return the `menu_id`
     * const sys_menuWithMenu_idOnly = await prisma.sys_menu.createManyAndReturn({
     *   select: { menu_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_menuCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_menuCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_menu.
     * @param {sys_menuDeleteArgs} args - Arguments to delete one Sys_menu.
     * @example
     * // Delete one Sys_menu
     * const Sys_menu = await prisma.sys_menu.delete({
     *   where: {
     *     // ... filter to delete one Sys_menu
     *   }
     * })
     * 
     */
    delete<T extends sys_menuDeleteArgs>(args: SelectSubset<T, sys_menuDeleteArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_menu.
     * @param {sys_menuUpdateArgs} args - Arguments to update one Sys_menu.
     * @example
     * // Update one Sys_menu
     * const sys_menu = await prisma.sys_menu.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_menuUpdateArgs>(args: SelectSubset<T, sys_menuUpdateArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_menus.
     * @param {sys_menuDeleteManyArgs} args - Arguments to filter Sys_menus to delete.
     * @example
     * // Delete a few Sys_menus
     * const { count } = await prisma.sys_menu.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_menuDeleteManyArgs>(args?: SelectSubset<T, sys_menuDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_menus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_menus
     * const sys_menu = await prisma.sys_menu.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_menuUpdateManyArgs>(args: SelectSubset<T, sys_menuUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_menus and returns the data updated in the database.
     * @param {sys_menuUpdateManyAndReturnArgs} args - Arguments to update many Sys_menus.
     * @example
     * // Update many Sys_menus
     * const sys_menu = await prisma.sys_menu.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_menus and only return the `menu_id`
     * const sys_menuWithMenu_idOnly = await prisma.sys_menu.updateManyAndReturn({
     *   select: { menu_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_menuUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_menuUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_menu.
     * @param {sys_menuUpsertArgs} args - Arguments to update or create a Sys_menu.
     * @example
     * // Update or create a Sys_menu
     * const sys_menu = await prisma.sys_menu.upsert({
     *   create: {
     *     // ... data to create a Sys_menu
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_menu we want to update
     *   }
     * })
     */
    upsert<T extends sys_menuUpsertArgs>(args: SelectSubset<T, sys_menuUpsertArgs<ExtArgs>>): Prisma__sys_menuClient<$Result.GetResult<Prisma.$sys_menuPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_menus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuCountArgs} args - Arguments to filter Sys_menus to count.
     * @example
     * // Count the number of Sys_menus
     * const count = await prisma.sys_menu.count({
     *   where: {
     *     // ... the filter for the Sys_menus we want to count
     *   }
     * })
    **/
    count<T extends sys_menuCountArgs>(
      args?: Subset<T, sys_menuCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_menuCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_menu.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_menuAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_menuAggregateArgs>(args: Subset<T, Sys_menuAggregateArgs>): Prisma.PrismaPromise<GetSys_menuAggregateType<T>>

    /**
     * Group by Sys_menu.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_menuGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_menuGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_menuGroupByArgs['orderBy'] }
        : { orderBy?: sys_menuGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_menuGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_menuGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_menu model
   */
  readonly fields: sys_menuFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_menu.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_menuClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_menu model
   */
  interface sys_menuFieldRefs {
    readonly menu_id: FieldRef<"sys_menu", 'String'>
    readonly tenant_id: FieldRef<"sys_menu", 'String'>
    readonly parent_id: FieldRef<"sys_menu", 'String'>
    readonly menu_name: FieldRef<"sys_menu", 'String'>
    readonly menu_type: FieldRef<"sys_menu", 'Int'>
    readonly icon: FieldRef<"sys_menu", 'String'>
    readonly path: FieldRef<"sys_menu", 'String'>
    readonly component: FieldRef<"sys_menu", 'String'>
    readonly permission: FieldRef<"sys_menu", 'String'>
    readonly sort_order: FieldRef<"sys_menu", 'Int'>
    readonly status: FieldRef<"sys_menu", 'Int'>
    readonly created_at: FieldRef<"sys_menu", 'DateTime'>
    readonly updated_at: FieldRef<"sys_menu", 'DateTime'>
    readonly created_by: FieldRef<"sys_menu", 'String'>
    readonly updated_by: FieldRef<"sys_menu", 'String'>
    readonly is_deleted: FieldRef<"sys_menu", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_menu findUnique
   */
  export type sys_menuFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_menu to fetch.
     */
    where: sys_menuWhereUniqueInput
  }

  /**
   * sys_menu findUniqueOrThrow
   */
  export type sys_menuFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_menu to fetch.
     */
    where: sys_menuWhereUniqueInput
  }

  /**
   * sys_menu findFirst
   */
  export type sys_menuFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_menu to fetch.
     */
    where?: sys_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_menus to fetch.
     */
    orderBy?: sys_menuOrderByWithRelationInput | sys_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_menus.
     */
    cursor?: sys_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_menus.
     */
    distinct?: Sys_menuScalarFieldEnum | Sys_menuScalarFieldEnum[]
  }

  /**
   * sys_menu findFirstOrThrow
   */
  export type sys_menuFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_menu to fetch.
     */
    where?: sys_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_menus to fetch.
     */
    orderBy?: sys_menuOrderByWithRelationInput | sys_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_menus.
     */
    cursor?: sys_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_menus.
     */
    distinct?: Sys_menuScalarFieldEnum | Sys_menuScalarFieldEnum[]
  }

  /**
   * sys_menu findMany
   */
  export type sys_menuFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_menus to fetch.
     */
    where?: sys_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_menus to fetch.
     */
    orderBy?: sys_menuOrderByWithRelationInput | sys_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_menus.
     */
    cursor?: sys_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_menus.
     */
    distinct?: Sys_menuScalarFieldEnum | Sys_menuScalarFieldEnum[]
  }

  /**
   * sys_menu create
   */
  export type sys_menuCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_menu.
     */
    data: XOR<sys_menuCreateInput, sys_menuUncheckedCreateInput>
  }

  /**
   * sys_menu createMany
   */
  export type sys_menuCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_menus.
     */
    data: sys_menuCreateManyInput | sys_menuCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_menu createManyAndReturn
   */
  export type sys_menuCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * The data used to create many sys_menus.
     */
    data: sys_menuCreateManyInput | sys_menuCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_menu update
   */
  export type sys_menuUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_menu.
     */
    data: XOR<sys_menuUpdateInput, sys_menuUncheckedUpdateInput>
    /**
     * Choose, which sys_menu to update.
     */
    where: sys_menuWhereUniqueInput
  }

  /**
   * sys_menu updateMany
   */
  export type sys_menuUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_menus.
     */
    data: XOR<sys_menuUpdateManyMutationInput, sys_menuUncheckedUpdateManyInput>
    /**
     * Filter which sys_menus to update
     */
    where?: sys_menuWhereInput
    /**
     * Limit how many sys_menus to update.
     */
    limit?: number
  }

  /**
   * sys_menu updateManyAndReturn
   */
  export type sys_menuUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * The data used to update sys_menus.
     */
    data: XOR<sys_menuUpdateManyMutationInput, sys_menuUncheckedUpdateManyInput>
    /**
     * Filter which sys_menus to update
     */
    where?: sys_menuWhereInput
    /**
     * Limit how many sys_menus to update.
     */
    limit?: number
  }

  /**
   * sys_menu upsert
   */
  export type sys_menuUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_menu to update in case it exists.
     */
    where: sys_menuWhereUniqueInput
    /**
     * In case the sys_menu found by the `where` argument doesn't exist, create a new sys_menu with this data.
     */
    create: XOR<sys_menuCreateInput, sys_menuUncheckedCreateInput>
    /**
     * In case the sys_menu was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_menuUpdateInput, sys_menuUncheckedUpdateInput>
  }

  /**
   * sys_menu delete
   */
  export type sys_menuDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
    /**
     * Filter which sys_menu to delete.
     */
    where: sys_menuWhereUniqueInput
  }

  /**
   * sys_menu deleteMany
   */
  export type sys_menuDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_menus to delete
     */
    where?: sys_menuWhereInput
    /**
     * Limit how many sys_menus to delete.
     */
    limit?: number
  }

  /**
   * sys_menu without action
   */
  export type sys_menuDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_menu
     */
    select?: sys_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_menu
     */
    omit?: sys_menuOmit<ExtArgs> | null
  }


  /**
   * Model sys_permission
   */

  export type AggregateSys_permission = {
    _count: Sys_permissionCountAggregateOutputType | null
    _avg: Sys_permissionAvgAggregateOutputType | null
    _sum: Sys_permissionSumAggregateOutputType | null
    _min: Sys_permissionMinAggregateOutputType | null
    _max: Sys_permissionMaxAggregateOutputType | null
  }

  export type Sys_permissionAvgAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_permissionSumAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_permissionMinAggregateOutputType = {
    perm_id: string | null
    tenant_id: string | null
    perm_code: string | null
    perm_name: string | null
    resource_type: string | null
    action: string | null
    description: string | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_permissionMaxAggregateOutputType = {
    perm_id: string | null
    tenant_id: string | null
    perm_code: string | null
    perm_name: string | null
    resource_type: string | null
    action: string | null
    description: string | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_permissionCountAggregateOutputType = {
    perm_id: number
    tenant_id: number
    perm_code: number
    perm_name: number
    resource_type: number
    action: number
    description: number
    status: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_permissionAvgAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_permissionSumAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_permissionMinAggregateInputType = {
    perm_id?: true
    tenant_id?: true
    perm_code?: true
    perm_name?: true
    resource_type?: true
    action?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_permissionMaxAggregateInputType = {
    perm_id?: true
    tenant_id?: true
    perm_code?: true
    perm_name?: true
    resource_type?: true
    action?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_permissionCountAggregateInputType = {
    perm_id?: true
    tenant_id?: true
    perm_code?: true
    perm_name?: true
    resource_type?: true
    action?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_permissionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_permission to aggregate.
     */
    where?: sys_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_permissions to fetch.
     */
    orderBy?: sys_permissionOrderByWithRelationInput | sys_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_permissions
    **/
    _count?: true | Sys_permissionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_permissionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_permissionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_permissionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_permissionMaxAggregateInputType
  }

  export type GetSys_permissionAggregateType<T extends Sys_permissionAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_permission]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_permission[P]>
      : GetScalarType<T[P], AggregateSys_permission[P]>
  }




  export type sys_permissionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_permissionWhereInput
    orderBy?: sys_permissionOrderByWithAggregationInput | sys_permissionOrderByWithAggregationInput[]
    by: Sys_permissionScalarFieldEnum[] | Sys_permissionScalarFieldEnum
    having?: sys_permissionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_permissionCountAggregateInputType | true
    _avg?: Sys_permissionAvgAggregateInputType
    _sum?: Sys_permissionSumAggregateInputType
    _min?: Sys_permissionMinAggregateInputType
    _max?: Sys_permissionMaxAggregateInputType
  }

  export type Sys_permissionGroupByOutputType = {
    perm_id: string
    tenant_id: string
    perm_code: string
    perm_name: string
    resource_type: string
    action: string
    description: string | null
    status: number
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_permissionCountAggregateOutputType | null
    _avg: Sys_permissionAvgAggregateOutputType | null
    _sum: Sys_permissionSumAggregateOutputType | null
    _min: Sys_permissionMinAggregateOutputType | null
    _max: Sys_permissionMaxAggregateOutputType | null
  }

  type GetSys_permissionGroupByPayload<T extends sys_permissionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_permissionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_permissionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_permissionGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_permissionGroupByOutputType[P]>
        }
      >
    >


  export type sys_permissionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    perm_id?: boolean
    tenant_id?: boolean
    perm_code?: boolean
    perm_name?: boolean
    resource_type?: boolean
    action?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_permission"]>

  export type sys_permissionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    perm_id?: boolean
    tenant_id?: boolean
    perm_code?: boolean
    perm_name?: boolean
    resource_type?: boolean
    action?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_permission"]>

  export type sys_permissionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    perm_id?: boolean
    tenant_id?: boolean
    perm_code?: boolean
    perm_name?: boolean
    resource_type?: boolean
    action?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_permission"]>

  export type sys_permissionSelectScalar = {
    perm_id?: boolean
    tenant_id?: boolean
    perm_code?: boolean
    perm_name?: boolean
    resource_type?: boolean
    action?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_permissionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"perm_id" | "tenant_id" | "perm_code" | "perm_name" | "resource_type" | "action" | "description" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_permission"]>

  export type $sys_permissionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_permission"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      perm_id: string
      tenant_id: string
      perm_code: string
      perm_name: string
      resource_type: string
      action: string
      description: string | null
      status: number
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_permission"]>
    composites: {}
  }

  type sys_permissionGetPayload<S extends boolean | null | undefined | sys_permissionDefaultArgs> = $Result.GetResult<Prisma.$sys_permissionPayload, S>

  type sys_permissionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_permissionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_permissionCountAggregateInputType | true
    }

  export interface sys_permissionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_permission'], meta: { name: 'sys_permission' } }
    /**
     * Find zero or one Sys_permission that matches the filter.
     * @param {sys_permissionFindUniqueArgs} args - Arguments to find a Sys_permission
     * @example
     * // Get one Sys_permission
     * const sys_permission = await prisma.sys_permission.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_permissionFindUniqueArgs>(args: SelectSubset<T, sys_permissionFindUniqueArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_permission that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_permissionFindUniqueOrThrowArgs} args - Arguments to find a Sys_permission
     * @example
     * // Get one Sys_permission
     * const sys_permission = await prisma.sys_permission.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_permissionFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_permissionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_permission that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionFindFirstArgs} args - Arguments to find a Sys_permission
     * @example
     * // Get one Sys_permission
     * const sys_permission = await prisma.sys_permission.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_permissionFindFirstArgs>(args?: SelectSubset<T, sys_permissionFindFirstArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_permission that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionFindFirstOrThrowArgs} args - Arguments to find a Sys_permission
     * @example
     * // Get one Sys_permission
     * const sys_permission = await prisma.sys_permission.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_permissionFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_permissionFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_permissions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_permissions
     * const sys_permissions = await prisma.sys_permission.findMany()
     * 
     * // Get first 10 Sys_permissions
     * const sys_permissions = await prisma.sys_permission.findMany({ take: 10 })
     * 
     * // Only select the `perm_id`
     * const sys_permissionWithPerm_idOnly = await prisma.sys_permission.findMany({ select: { perm_id: true } })
     * 
     */
    findMany<T extends sys_permissionFindManyArgs>(args?: SelectSubset<T, sys_permissionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_permission.
     * @param {sys_permissionCreateArgs} args - Arguments to create a Sys_permission.
     * @example
     * // Create one Sys_permission
     * const Sys_permission = await prisma.sys_permission.create({
     *   data: {
     *     // ... data to create a Sys_permission
     *   }
     * })
     * 
     */
    create<T extends sys_permissionCreateArgs>(args: SelectSubset<T, sys_permissionCreateArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_permissions.
     * @param {sys_permissionCreateManyArgs} args - Arguments to create many Sys_permissions.
     * @example
     * // Create many Sys_permissions
     * const sys_permission = await prisma.sys_permission.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_permissionCreateManyArgs>(args?: SelectSubset<T, sys_permissionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_permissions and returns the data saved in the database.
     * @param {sys_permissionCreateManyAndReturnArgs} args - Arguments to create many Sys_permissions.
     * @example
     * // Create many Sys_permissions
     * const sys_permission = await prisma.sys_permission.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_permissions and only return the `perm_id`
     * const sys_permissionWithPerm_idOnly = await prisma.sys_permission.createManyAndReturn({
     *   select: { perm_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_permissionCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_permissionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_permission.
     * @param {sys_permissionDeleteArgs} args - Arguments to delete one Sys_permission.
     * @example
     * // Delete one Sys_permission
     * const Sys_permission = await prisma.sys_permission.delete({
     *   where: {
     *     // ... filter to delete one Sys_permission
     *   }
     * })
     * 
     */
    delete<T extends sys_permissionDeleteArgs>(args: SelectSubset<T, sys_permissionDeleteArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_permission.
     * @param {sys_permissionUpdateArgs} args - Arguments to update one Sys_permission.
     * @example
     * // Update one Sys_permission
     * const sys_permission = await prisma.sys_permission.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_permissionUpdateArgs>(args: SelectSubset<T, sys_permissionUpdateArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_permissions.
     * @param {sys_permissionDeleteManyArgs} args - Arguments to filter Sys_permissions to delete.
     * @example
     * // Delete a few Sys_permissions
     * const { count } = await prisma.sys_permission.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_permissionDeleteManyArgs>(args?: SelectSubset<T, sys_permissionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_permissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_permissions
     * const sys_permission = await prisma.sys_permission.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_permissionUpdateManyArgs>(args: SelectSubset<T, sys_permissionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_permissions and returns the data updated in the database.
     * @param {sys_permissionUpdateManyAndReturnArgs} args - Arguments to update many Sys_permissions.
     * @example
     * // Update many Sys_permissions
     * const sys_permission = await prisma.sys_permission.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_permissions and only return the `perm_id`
     * const sys_permissionWithPerm_idOnly = await prisma.sys_permission.updateManyAndReturn({
     *   select: { perm_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_permissionUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_permissionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_permission.
     * @param {sys_permissionUpsertArgs} args - Arguments to update or create a Sys_permission.
     * @example
     * // Update or create a Sys_permission
     * const sys_permission = await prisma.sys_permission.upsert({
     *   create: {
     *     // ... data to create a Sys_permission
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_permission we want to update
     *   }
     * })
     */
    upsert<T extends sys_permissionUpsertArgs>(args: SelectSubset<T, sys_permissionUpsertArgs<ExtArgs>>): Prisma__sys_permissionClient<$Result.GetResult<Prisma.$sys_permissionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_permissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionCountArgs} args - Arguments to filter Sys_permissions to count.
     * @example
     * // Count the number of Sys_permissions
     * const count = await prisma.sys_permission.count({
     *   where: {
     *     // ... the filter for the Sys_permissions we want to count
     *   }
     * })
    **/
    count<T extends sys_permissionCountArgs>(
      args?: Subset<T, sys_permissionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_permissionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_permission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_permissionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_permissionAggregateArgs>(args: Subset<T, Sys_permissionAggregateArgs>): Prisma.PrismaPromise<GetSys_permissionAggregateType<T>>

    /**
     * Group by Sys_permission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_permissionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_permissionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_permissionGroupByArgs['orderBy'] }
        : { orderBy?: sys_permissionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_permissionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_permissionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_permission model
   */
  readonly fields: sys_permissionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_permission.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_permissionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_permission model
   */
  interface sys_permissionFieldRefs {
    readonly perm_id: FieldRef<"sys_permission", 'String'>
    readonly tenant_id: FieldRef<"sys_permission", 'String'>
    readonly perm_code: FieldRef<"sys_permission", 'String'>
    readonly perm_name: FieldRef<"sys_permission", 'String'>
    readonly resource_type: FieldRef<"sys_permission", 'String'>
    readonly action: FieldRef<"sys_permission", 'String'>
    readonly description: FieldRef<"sys_permission", 'String'>
    readonly status: FieldRef<"sys_permission", 'Int'>
    readonly created_at: FieldRef<"sys_permission", 'DateTime'>
    readonly updated_at: FieldRef<"sys_permission", 'DateTime'>
    readonly created_by: FieldRef<"sys_permission", 'String'>
    readonly updated_by: FieldRef<"sys_permission", 'String'>
    readonly is_deleted: FieldRef<"sys_permission", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_permission findUnique
   */
  export type sys_permissionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_permission to fetch.
     */
    where: sys_permissionWhereUniqueInput
  }

  /**
   * sys_permission findUniqueOrThrow
   */
  export type sys_permissionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_permission to fetch.
     */
    where: sys_permissionWhereUniqueInput
  }

  /**
   * sys_permission findFirst
   */
  export type sys_permissionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_permission to fetch.
     */
    where?: sys_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_permissions to fetch.
     */
    orderBy?: sys_permissionOrderByWithRelationInput | sys_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_permissions.
     */
    cursor?: sys_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_permissions.
     */
    distinct?: Sys_permissionScalarFieldEnum | Sys_permissionScalarFieldEnum[]
  }

  /**
   * sys_permission findFirstOrThrow
   */
  export type sys_permissionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_permission to fetch.
     */
    where?: sys_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_permissions to fetch.
     */
    orderBy?: sys_permissionOrderByWithRelationInput | sys_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_permissions.
     */
    cursor?: sys_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_permissions.
     */
    distinct?: Sys_permissionScalarFieldEnum | Sys_permissionScalarFieldEnum[]
  }

  /**
   * sys_permission findMany
   */
  export type sys_permissionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_permissions to fetch.
     */
    where?: sys_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_permissions to fetch.
     */
    orderBy?: sys_permissionOrderByWithRelationInput | sys_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_permissions.
     */
    cursor?: sys_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_permissions.
     */
    distinct?: Sys_permissionScalarFieldEnum | Sys_permissionScalarFieldEnum[]
  }

  /**
   * sys_permission create
   */
  export type sys_permissionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_permission.
     */
    data: XOR<sys_permissionCreateInput, sys_permissionUncheckedCreateInput>
  }

  /**
   * sys_permission createMany
   */
  export type sys_permissionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_permissions.
     */
    data: sys_permissionCreateManyInput | sys_permissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_permission createManyAndReturn
   */
  export type sys_permissionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * The data used to create many sys_permissions.
     */
    data: sys_permissionCreateManyInput | sys_permissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_permission update
   */
  export type sys_permissionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_permission.
     */
    data: XOR<sys_permissionUpdateInput, sys_permissionUncheckedUpdateInput>
    /**
     * Choose, which sys_permission to update.
     */
    where: sys_permissionWhereUniqueInput
  }

  /**
   * sys_permission updateMany
   */
  export type sys_permissionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_permissions.
     */
    data: XOR<sys_permissionUpdateManyMutationInput, sys_permissionUncheckedUpdateManyInput>
    /**
     * Filter which sys_permissions to update
     */
    where?: sys_permissionWhereInput
    /**
     * Limit how many sys_permissions to update.
     */
    limit?: number
  }

  /**
   * sys_permission updateManyAndReturn
   */
  export type sys_permissionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * The data used to update sys_permissions.
     */
    data: XOR<sys_permissionUpdateManyMutationInput, sys_permissionUncheckedUpdateManyInput>
    /**
     * Filter which sys_permissions to update
     */
    where?: sys_permissionWhereInput
    /**
     * Limit how many sys_permissions to update.
     */
    limit?: number
  }

  /**
   * sys_permission upsert
   */
  export type sys_permissionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_permission to update in case it exists.
     */
    where: sys_permissionWhereUniqueInput
    /**
     * In case the sys_permission found by the `where` argument doesn't exist, create a new sys_permission with this data.
     */
    create: XOR<sys_permissionCreateInput, sys_permissionUncheckedCreateInput>
    /**
     * In case the sys_permission was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_permissionUpdateInput, sys_permissionUncheckedUpdateInput>
  }

  /**
   * sys_permission delete
   */
  export type sys_permissionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
    /**
     * Filter which sys_permission to delete.
     */
    where: sys_permissionWhereUniqueInput
  }

  /**
   * sys_permission deleteMany
   */
  export type sys_permissionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_permissions to delete
     */
    where?: sys_permissionWhereInput
    /**
     * Limit how many sys_permissions to delete.
     */
    limit?: number
  }

  /**
   * sys_permission without action
   */
  export type sys_permissionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_permission
     */
    select?: sys_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_permission
     */
    omit?: sys_permissionOmit<ExtArgs> | null
  }


  /**
   * Model sys_dict_type
   */

  export type AggregateSys_dict_type = {
    _count: Sys_dict_typeCountAggregateOutputType | null
    _avg: Sys_dict_typeAvgAggregateOutputType | null
    _sum: Sys_dict_typeSumAggregateOutputType | null
    _min: Sys_dict_typeMinAggregateOutputType | null
    _max: Sys_dict_typeMaxAggregateOutputType | null
  }

  export type Sys_dict_typeAvgAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_dict_typeSumAggregateOutputType = {
    status: number | null
    is_deleted: number | null
  }

  export type Sys_dict_typeMinAggregateOutputType = {
    dict_type_id: string | null
    tenant_id: string | null
    dict_code: string | null
    dict_name: string | null
    description: string | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_dict_typeMaxAggregateOutputType = {
    dict_type_id: string | null
    tenant_id: string | null
    dict_code: string | null
    dict_name: string | null
    description: string | null
    status: number | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_dict_typeCountAggregateOutputType = {
    dict_type_id: number
    tenant_id: number
    dict_code: number
    dict_name: number
    description: number
    status: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_dict_typeAvgAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_dict_typeSumAggregateInputType = {
    status?: true
    is_deleted?: true
  }

  export type Sys_dict_typeMinAggregateInputType = {
    dict_type_id?: true
    tenant_id?: true
    dict_code?: true
    dict_name?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_dict_typeMaxAggregateInputType = {
    dict_type_id?: true
    tenant_id?: true
    dict_code?: true
    dict_name?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_dict_typeCountAggregateInputType = {
    dict_type_id?: true
    tenant_id?: true
    dict_code?: true
    dict_name?: true
    description?: true
    status?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_dict_typeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_dict_type to aggregate.
     */
    where?: sys_dict_typeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_types to fetch.
     */
    orderBy?: sys_dict_typeOrderByWithRelationInput | sys_dict_typeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_dict_typeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_dict_types
    **/
    _count?: true | Sys_dict_typeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_dict_typeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_dict_typeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_dict_typeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_dict_typeMaxAggregateInputType
  }

  export type GetSys_dict_typeAggregateType<T extends Sys_dict_typeAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_dict_type]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_dict_type[P]>
      : GetScalarType<T[P], AggregateSys_dict_type[P]>
  }




  export type sys_dict_typeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_dict_typeWhereInput
    orderBy?: sys_dict_typeOrderByWithAggregationInput | sys_dict_typeOrderByWithAggregationInput[]
    by: Sys_dict_typeScalarFieldEnum[] | Sys_dict_typeScalarFieldEnum
    having?: sys_dict_typeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_dict_typeCountAggregateInputType | true
    _avg?: Sys_dict_typeAvgAggregateInputType
    _sum?: Sys_dict_typeSumAggregateInputType
    _min?: Sys_dict_typeMinAggregateInputType
    _max?: Sys_dict_typeMaxAggregateInputType
  }

  export type Sys_dict_typeGroupByOutputType = {
    dict_type_id: string
    tenant_id: string
    dict_code: string
    dict_name: string
    description: string | null
    status: number
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_dict_typeCountAggregateOutputType | null
    _avg: Sys_dict_typeAvgAggregateOutputType | null
    _sum: Sys_dict_typeSumAggregateOutputType | null
    _min: Sys_dict_typeMinAggregateOutputType | null
    _max: Sys_dict_typeMaxAggregateOutputType | null
  }

  type GetSys_dict_typeGroupByPayload<T extends sys_dict_typeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_dict_typeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_dict_typeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_dict_typeGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_dict_typeGroupByOutputType[P]>
        }
      >
    >


  export type sys_dict_typeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_type_id?: boolean
    tenant_id?: boolean
    dict_code?: boolean
    dict_name?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_type"]>

  export type sys_dict_typeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_type_id?: boolean
    tenant_id?: boolean
    dict_code?: boolean
    dict_name?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_type"]>

  export type sys_dict_typeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_type_id?: boolean
    tenant_id?: boolean
    dict_code?: boolean
    dict_name?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_type"]>

  export type sys_dict_typeSelectScalar = {
    dict_type_id?: boolean
    tenant_id?: boolean
    dict_code?: boolean
    dict_name?: boolean
    description?: boolean
    status?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_dict_typeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"dict_type_id" | "tenant_id" | "dict_code" | "dict_name" | "description" | "status" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_dict_type"]>

  export type $sys_dict_typePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_dict_type"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      dict_type_id: string
      tenant_id: string
      dict_code: string
      dict_name: string
      description: string | null
      status: number
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_dict_type"]>
    composites: {}
  }

  type sys_dict_typeGetPayload<S extends boolean | null | undefined | sys_dict_typeDefaultArgs> = $Result.GetResult<Prisma.$sys_dict_typePayload, S>

  type sys_dict_typeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_dict_typeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_dict_typeCountAggregateInputType | true
    }

  export interface sys_dict_typeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_dict_type'], meta: { name: 'sys_dict_type' } }
    /**
     * Find zero or one Sys_dict_type that matches the filter.
     * @param {sys_dict_typeFindUniqueArgs} args - Arguments to find a Sys_dict_type
     * @example
     * // Get one Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_dict_typeFindUniqueArgs>(args: SelectSubset<T, sys_dict_typeFindUniqueArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_dict_type that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_dict_typeFindUniqueOrThrowArgs} args - Arguments to find a Sys_dict_type
     * @example
     * // Get one Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_dict_typeFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_dict_typeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dict_type that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeFindFirstArgs} args - Arguments to find a Sys_dict_type
     * @example
     * // Get one Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_dict_typeFindFirstArgs>(args?: SelectSubset<T, sys_dict_typeFindFirstArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dict_type that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeFindFirstOrThrowArgs} args - Arguments to find a Sys_dict_type
     * @example
     * // Get one Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_dict_typeFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_dict_typeFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_dict_types that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_dict_types
     * const sys_dict_types = await prisma.sys_dict_type.findMany()
     * 
     * // Get first 10 Sys_dict_types
     * const sys_dict_types = await prisma.sys_dict_type.findMany({ take: 10 })
     * 
     * // Only select the `dict_type_id`
     * const sys_dict_typeWithDict_type_idOnly = await prisma.sys_dict_type.findMany({ select: { dict_type_id: true } })
     * 
     */
    findMany<T extends sys_dict_typeFindManyArgs>(args?: SelectSubset<T, sys_dict_typeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_dict_type.
     * @param {sys_dict_typeCreateArgs} args - Arguments to create a Sys_dict_type.
     * @example
     * // Create one Sys_dict_type
     * const Sys_dict_type = await prisma.sys_dict_type.create({
     *   data: {
     *     // ... data to create a Sys_dict_type
     *   }
     * })
     * 
     */
    create<T extends sys_dict_typeCreateArgs>(args: SelectSubset<T, sys_dict_typeCreateArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_dict_types.
     * @param {sys_dict_typeCreateManyArgs} args - Arguments to create many Sys_dict_types.
     * @example
     * // Create many Sys_dict_types
     * const sys_dict_type = await prisma.sys_dict_type.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_dict_typeCreateManyArgs>(args?: SelectSubset<T, sys_dict_typeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_dict_types and returns the data saved in the database.
     * @param {sys_dict_typeCreateManyAndReturnArgs} args - Arguments to create many Sys_dict_types.
     * @example
     * // Create many Sys_dict_types
     * const sys_dict_type = await prisma.sys_dict_type.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_dict_types and only return the `dict_type_id`
     * const sys_dict_typeWithDict_type_idOnly = await prisma.sys_dict_type.createManyAndReturn({
     *   select: { dict_type_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_dict_typeCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_dict_typeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_dict_type.
     * @param {sys_dict_typeDeleteArgs} args - Arguments to delete one Sys_dict_type.
     * @example
     * // Delete one Sys_dict_type
     * const Sys_dict_type = await prisma.sys_dict_type.delete({
     *   where: {
     *     // ... filter to delete one Sys_dict_type
     *   }
     * })
     * 
     */
    delete<T extends sys_dict_typeDeleteArgs>(args: SelectSubset<T, sys_dict_typeDeleteArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_dict_type.
     * @param {sys_dict_typeUpdateArgs} args - Arguments to update one Sys_dict_type.
     * @example
     * // Update one Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_dict_typeUpdateArgs>(args: SelectSubset<T, sys_dict_typeUpdateArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_dict_types.
     * @param {sys_dict_typeDeleteManyArgs} args - Arguments to filter Sys_dict_types to delete.
     * @example
     * // Delete a few Sys_dict_types
     * const { count } = await prisma.sys_dict_type.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_dict_typeDeleteManyArgs>(args?: SelectSubset<T, sys_dict_typeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_dict_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_dict_types
     * const sys_dict_type = await prisma.sys_dict_type.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_dict_typeUpdateManyArgs>(args: SelectSubset<T, sys_dict_typeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_dict_types and returns the data updated in the database.
     * @param {sys_dict_typeUpdateManyAndReturnArgs} args - Arguments to update many Sys_dict_types.
     * @example
     * // Update many Sys_dict_types
     * const sys_dict_type = await prisma.sys_dict_type.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_dict_types and only return the `dict_type_id`
     * const sys_dict_typeWithDict_type_idOnly = await prisma.sys_dict_type.updateManyAndReturn({
     *   select: { dict_type_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_dict_typeUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_dict_typeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_dict_type.
     * @param {sys_dict_typeUpsertArgs} args - Arguments to update or create a Sys_dict_type.
     * @example
     * // Update or create a Sys_dict_type
     * const sys_dict_type = await prisma.sys_dict_type.upsert({
     *   create: {
     *     // ... data to create a Sys_dict_type
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_dict_type we want to update
     *   }
     * })
     */
    upsert<T extends sys_dict_typeUpsertArgs>(args: SelectSubset<T, sys_dict_typeUpsertArgs<ExtArgs>>): Prisma__sys_dict_typeClient<$Result.GetResult<Prisma.$sys_dict_typePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_dict_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeCountArgs} args - Arguments to filter Sys_dict_types to count.
     * @example
     * // Count the number of Sys_dict_types
     * const count = await prisma.sys_dict_type.count({
     *   where: {
     *     // ... the filter for the Sys_dict_types we want to count
     *   }
     * })
    **/
    count<T extends sys_dict_typeCountArgs>(
      args?: Subset<T, sys_dict_typeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_dict_typeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_dict_type.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_dict_typeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_dict_typeAggregateArgs>(args: Subset<T, Sys_dict_typeAggregateArgs>): Prisma.PrismaPromise<GetSys_dict_typeAggregateType<T>>

    /**
     * Group by Sys_dict_type.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_typeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_dict_typeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_dict_typeGroupByArgs['orderBy'] }
        : { orderBy?: sys_dict_typeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_dict_typeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_dict_typeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_dict_type model
   */
  readonly fields: sys_dict_typeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_dict_type.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_dict_typeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_dict_type model
   */
  interface sys_dict_typeFieldRefs {
    readonly dict_type_id: FieldRef<"sys_dict_type", 'String'>
    readonly tenant_id: FieldRef<"sys_dict_type", 'String'>
    readonly dict_code: FieldRef<"sys_dict_type", 'String'>
    readonly dict_name: FieldRef<"sys_dict_type", 'String'>
    readonly description: FieldRef<"sys_dict_type", 'String'>
    readonly status: FieldRef<"sys_dict_type", 'Int'>
    readonly created_at: FieldRef<"sys_dict_type", 'DateTime'>
    readonly updated_at: FieldRef<"sys_dict_type", 'DateTime'>
    readonly created_by: FieldRef<"sys_dict_type", 'String'>
    readonly updated_by: FieldRef<"sys_dict_type", 'String'>
    readonly is_deleted: FieldRef<"sys_dict_type", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_dict_type findUnique
   */
  export type sys_dict_typeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_type to fetch.
     */
    where: sys_dict_typeWhereUniqueInput
  }

  /**
   * sys_dict_type findUniqueOrThrow
   */
  export type sys_dict_typeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_type to fetch.
     */
    where: sys_dict_typeWhereUniqueInput
  }

  /**
   * sys_dict_type findFirst
   */
  export type sys_dict_typeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_type to fetch.
     */
    where?: sys_dict_typeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_types to fetch.
     */
    orderBy?: sys_dict_typeOrderByWithRelationInput | sys_dict_typeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_dict_types.
     */
    cursor?: sys_dict_typeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_types.
     */
    distinct?: Sys_dict_typeScalarFieldEnum | Sys_dict_typeScalarFieldEnum[]
  }

  /**
   * sys_dict_type findFirstOrThrow
   */
  export type sys_dict_typeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_type to fetch.
     */
    where?: sys_dict_typeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_types to fetch.
     */
    orderBy?: sys_dict_typeOrderByWithRelationInput | sys_dict_typeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_dict_types.
     */
    cursor?: sys_dict_typeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_types.
     */
    distinct?: Sys_dict_typeScalarFieldEnum | Sys_dict_typeScalarFieldEnum[]
  }

  /**
   * sys_dict_type findMany
   */
  export type sys_dict_typeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_types to fetch.
     */
    where?: sys_dict_typeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_types to fetch.
     */
    orderBy?: sys_dict_typeOrderByWithRelationInput | sys_dict_typeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_dict_types.
     */
    cursor?: sys_dict_typeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_types.
     */
    distinct?: Sys_dict_typeScalarFieldEnum | Sys_dict_typeScalarFieldEnum[]
  }

  /**
   * sys_dict_type create
   */
  export type sys_dict_typeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_dict_type.
     */
    data: XOR<sys_dict_typeCreateInput, sys_dict_typeUncheckedCreateInput>
  }

  /**
   * sys_dict_type createMany
   */
  export type sys_dict_typeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_dict_types.
     */
    data: sys_dict_typeCreateManyInput | sys_dict_typeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dict_type createManyAndReturn
   */
  export type sys_dict_typeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * The data used to create many sys_dict_types.
     */
    data: sys_dict_typeCreateManyInput | sys_dict_typeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dict_type update
   */
  export type sys_dict_typeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_dict_type.
     */
    data: XOR<sys_dict_typeUpdateInput, sys_dict_typeUncheckedUpdateInput>
    /**
     * Choose, which sys_dict_type to update.
     */
    where: sys_dict_typeWhereUniqueInput
  }

  /**
   * sys_dict_type updateMany
   */
  export type sys_dict_typeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_dict_types.
     */
    data: XOR<sys_dict_typeUpdateManyMutationInput, sys_dict_typeUncheckedUpdateManyInput>
    /**
     * Filter which sys_dict_types to update
     */
    where?: sys_dict_typeWhereInput
    /**
     * Limit how many sys_dict_types to update.
     */
    limit?: number
  }

  /**
   * sys_dict_type updateManyAndReturn
   */
  export type sys_dict_typeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * The data used to update sys_dict_types.
     */
    data: XOR<sys_dict_typeUpdateManyMutationInput, sys_dict_typeUncheckedUpdateManyInput>
    /**
     * Filter which sys_dict_types to update
     */
    where?: sys_dict_typeWhereInput
    /**
     * Limit how many sys_dict_types to update.
     */
    limit?: number
  }

  /**
   * sys_dict_type upsert
   */
  export type sys_dict_typeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_dict_type to update in case it exists.
     */
    where: sys_dict_typeWhereUniqueInput
    /**
     * In case the sys_dict_type found by the `where` argument doesn't exist, create a new sys_dict_type with this data.
     */
    create: XOR<sys_dict_typeCreateInput, sys_dict_typeUncheckedCreateInput>
    /**
     * In case the sys_dict_type was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_dict_typeUpdateInput, sys_dict_typeUncheckedUpdateInput>
  }

  /**
   * sys_dict_type delete
   */
  export type sys_dict_typeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
    /**
     * Filter which sys_dict_type to delete.
     */
    where: sys_dict_typeWhereUniqueInput
  }

  /**
   * sys_dict_type deleteMany
   */
  export type sys_dict_typeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_dict_types to delete
     */
    where?: sys_dict_typeWhereInput
    /**
     * Limit how many sys_dict_types to delete.
     */
    limit?: number
  }

  /**
   * sys_dict_type without action
   */
  export type sys_dict_typeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_type
     */
    select?: sys_dict_typeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_type
     */
    omit?: sys_dict_typeOmit<ExtArgs> | null
  }


  /**
   * Model sys_dict_data
   */

  export type AggregateSys_dict_data = {
    _count: Sys_dict_dataCountAggregateOutputType | null
    _avg: Sys_dict_dataAvgAggregateOutputType | null
    _sum: Sys_dict_dataSumAggregateOutputType | null
    _min: Sys_dict_dataMinAggregateOutputType | null
    _max: Sys_dict_dataMaxAggregateOutputType | null
  }

  export type Sys_dict_dataAvgAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_dict_dataSumAggregateOutputType = {
    sort_order: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_dict_dataMinAggregateOutputType = {
    dict_data_id: string | null
    tenant_id: string | null
    dict_type_id: string | null
    dict_label: string | null
    dict_value: string | null
    sort_order: number | null
    status: number | null
    remark: string | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_dict_dataMaxAggregateOutputType = {
    dict_data_id: string | null
    tenant_id: string | null
    dict_type_id: string | null
    dict_label: string | null
    dict_value: string | null
    sort_order: number | null
    status: number | null
    remark: string | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_dict_dataCountAggregateOutputType = {
    dict_data_id: number
    tenant_id: number
    dict_type_id: number
    dict_label: number
    dict_value: number
    sort_order: number
    status: number
    remark: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_dict_dataAvgAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_dict_dataSumAggregateInputType = {
    sort_order?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_dict_dataMinAggregateInputType = {
    dict_data_id?: true
    tenant_id?: true
    dict_type_id?: true
    dict_label?: true
    dict_value?: true
    sort_order?: true
    status?: true
    remark?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_dict_dataMaxAggregateInputType = {
    dict_data_id?: true
    tenant_id?: true
    dict_type_id?: true
    dict_label?: true
    dict_value?: true
    sort_order?: true
    status?: true
    remark?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_dict_dataCountAggregateInputType = {
    dict_data_id?: true
    tenant_id?: true
    dict_type_id?: true
    dict_label?: true
    dict_value?: true
    sort_order?: true
    status?: true
    remark?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_dict_dataAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_dict_data to aggregate.
     */
    where?: sys_dict_dataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_data to fetch.
     */
    orderBy?: sys_dict_dataOrderByWithRelationInput | sys_dict_dataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_dict_dataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_data from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_data.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_dict_data
    **/
    _count?: true | Sys_dict_dataCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_dict_dataAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_dict_dataSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_dict_dataMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_dict_dataMaxAggregateInputType
  }

  export type GetSys_dict_dataAggregateType<T extends Sys_dict_dataAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_dict_data]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_dict_data[P]>
      : GetScalarType<T[P], AggregateSys_dict_data[P]>
  }




  export type sys_dict_dataGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_dict_dataWhereInput
    orderBy?: sys_dict_dataOrderByWithAggregationInput | sys_dict_dataOrderByWithAggregationInput[]
    by: Sys_dict_dataScalarFieldEnum[] | Sys_dict_dataScalarFieldEnum
    having?: sys_dict_dataScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_dict_dataCountAggregateInputType | true
    _avg?: Sys_dict_dataAvgAggregateInputType
    _sum?: Sys_dict_dataSumAggregateInputType
    _min?: Sys_dict_dataMinAggregateInputType
    _max?: Sys_dict_dataMaxAggregateInputType
  }

  export type Sys_dict_dataGroupByOutputType = {
    dict_data_id: string
    tenant_id: string
    dict_type_id: string
    dict_label: string
    dict_value: string
    sort_order: number
    status: number
    remark: string | null
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_dict_dataCountAggregateOutputType | null
    _avg: Sys_dict_dataAvgAggregateOutputType | null
    _sum: Sys_dict_dataSumAggregateOutputType | null
    _min: Sys_dict_dataMinAggregateOutputType | null
    _max: Sys_dict_dataMaxAggregateOutputType | null
  }

  type GetSys_dict_dataGroupByPayload<T extends sys_dict_dataGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_dict_dataGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_dict_dataGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_dict_dataGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_dict_dataGroupByOutputType[P]>
        }
      >
    >


  export type sys_dict_dataSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_data_id?: boolean
    tenant_id?: boolean
    dict_type_id?: boolean
    dict_label?: boolean
    dict_value?: boolean
    sort_order?: boolean
    status?: boolean
    remark?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_data"]>

  export type sys_dict_dataSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_data_id?: boolean
    tenant_id?: boolean
    dict_type_id?: boolean
    dict_label?: boolean
    dict_value?: boolean
    sort_order?: boolean
    status?: boolean
    remark?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_data"]>

  export type sys_dict_dataSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    dict_data_id?: boolean
    tenant_id?: boolean
    dict_type_id?: boolean
    dict_label?: boolean
    dict_value?: boolean
    sort_order?: boolean
    status?: boolean
    remark?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_dict_data"]>

  export type sys_dict_dataSelectScalar = {
    dict_data_id?: boolean
    tenant_id?: boolean
    dict_type_id?: boolean
    dict_label?: boolean
    dict_value?: boolean
    sort_order?: boolean
    status?: boolean
    remark?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_dict_dataOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"dict_data_id" | "tenant_id" | "dict_type_id" | "dict_label" | "dict_value" | "sort_order" | "status" | "remark" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_dict_data"]>

  export type $sys_dict_dataPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_dict_data"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      dict_data_id: string
      tenant_id: string
      dict_type_id: string
      dict_label: string
      dict_value: string
      sort_order: number
      status: number
      remark: string | null
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_dict_data"]>
    composites: {}
  }

  type sys_dict_dataGetPayload<S extends boolean | null | undefined | sys_dict_dataDefaultArgs> = $Result.GetResult<Prisma.$sys_dict_dataPayload, S>

  type sys_dict_dataCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_dict_dataFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_dict_dataCountAggregateInputType | true
    }

  export interface sys_dict_dataDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_dict_data'], meta: { name: 'sys_dict_data' } }
    /**
     * Find zero or one Sys_dict_data that matches the filter.
     * @param {sys_dict_dataFindUniqueArgs} args - Arguments to find a Sys_dict_data
     * @example
     * // Get one Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_dict_dataFindUniqueArgs>(args: SelectSubset<T, sys_dict_dataFindUniqueArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_dict_data that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_dict_dataFindUniqueOrThrowArgs} args - Arguments to find a Sys_dict_data
     * @example
     * // Get one Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_dict_dataFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_dict_dataFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dict_data that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataFindFirstArgs} args - Arguments to find a Sys_dict_data
     * @example
     * // Get one Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_dict_dataFindFirstArgs>(args?: SelectSubset<T, sys_dict_dataFindFirstArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_dict_data that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataFindFirstOrThrowArgs} args - Arguments to find a Sys_dict_data
     * @example
     * // Get one Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_dict_dataFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_dict_dataFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_dict_data that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findMany()
     * 
     * // Get first 10 Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.findMany({ take: 10 })
     * 
     * // Only select the `dict_data_id`
     * const sys_dict_dataWithDict_data_idOnly = await prisma.sys_dict_data.findMany({ select: { dict_data_id: true } })
     * 
     */
    findMany<T extends sys_dict_dataFindManyArgs>(args?: SelectSubset<T, sys_dict_dataFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_dict_data.
     * @param {sys_dict_dataCreateArgs} args - Arguments to create a Sys_dict_data.
     * @example
     * // Create one Sys_dict_data
     * const Sys_dict_data = await prisma.sys_dict_data.create({
     *   data: {
     *     // ... data to create a Sys_dict_data
     *   }
     * })
     * 
     */
    create<T extends sys_dict_dataCreateArgs>(args: SelectSubset<T, sys_dict_dataCreateArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_dict_data.
     * @param {sys_dict_dataCreateManyArgs} args - Arguments to create many Sys_dict_data.
     * @example
     * // Create many Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_dict_dataCreateManyArgs>(args?: SelectSubset<T, sys_dict_dataCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_dict_data and returns the data saved in the database.
     * @param {sys_dict_dataCreateManyAndReturnArgs} args - Arguments to create many Sys_dict_data.
     * @example
     * // Create many Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_dict_data and only return the `dict_data_id`
     * const sys_dict_dataWithDict_data_idOnly = await prisma.sys_dict_data.createManyAndReturn({
     *   select: { dict_data_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_dict_dataCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_dict_dataCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_dict_data.
     * @param {sys_dict_dataDeleteArgs} args - Arguments to delete one Sys_dict_data.
     * @example
     * // Delete one Sys_dict_data
     * const Sys_dict_data = await prisma.sys_dict_data.delete({
     *   where: {
     *     // ... filter to delete one Sys_dict_data
     *   }
     * })
     * 
     */
    delete<T extends sys_dict_dataDeleteArgs>(args: SelectSubset<T, sys_dict_dataDeleteArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_dict_data.
     * @param {sys_dict_dataUpdateArgs} args - Arguments to update one Sys_dict_data.
     * @example
     * // Update one Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_dict_dataUpdateArgs>(args: SelectSubset<T, sys_dict_dataUpdateArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_dict_data.
     * @param {sys_dict_dataDeleteManyArgs} args - Arguments to filter Sys_dict_data to delete.
     * @example
     * // Delete a few Sys_dict_data
     * const { count } = await prisma.sys_dict_data.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_dict_dataDeleteManyArgs>(args?: SelectSubset<T, sys_dict_dataDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_dict_data.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_dict_dataUpdateManyArgs>(args: SelectSubset<T, sys_dict_dataUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_dict_data and returns the data updated in the database.
     * @param {sys_dict_dataUpdateManyAndReturnArgs} args - Arguments to update many Sys_dict_data.
     * @example
     * // Update many Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_dict_data and only return the `dict_data_id`
     * const sys_dict_dataWithDict_data_idOnly = await prisma.sys_dict_data.updateManyAndReturn({
     *   select: { dict_data_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_dict_dataUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_dict_dataUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_dict_data.
     * @param {sys_dict_dataUpsertArgs} args - Arguments to update or create a Sys_dict_data.
     * @example
     * // Update or create a Sys_dict_data
     * const sys_dict_data = await prisma.sys_dict_data.upsert({
     *   create: {
     *     // ... data to create a Sys_dict_data
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_dict_data we want to update
     *   }
     * })
     */
    upsert<T extends sys_dict_dataUpsertArgs>(args: SelectSubset<T, sys_dict_dataUpsertArgs<ExtArgs>>): Prisma__sys_dict_dataClient<$Result.GetResult<Prisma.$sys_dict_dataPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_dict_data.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataCountArgs} args - Arguments to filter Sys_dict_data to count.
     * @example
     * // Count the number of Sys_dict_data
     * const count = await prisma.sys_dict_data.count({
     *   where: {
     *     // ... the filter for the Sys_dict_data we want to count
     *   }
     * })
    **/
    count<T extends sys_dict_dataCountArgs>(
      args?: Subset<T, sys_dict_dataCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_dict_dataCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_dict_data.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_dict_dataAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_dict_dataAggregateArgs>(args: Subset<T, Sys_dict_dataAggregateArgs>): Prisma.PrismaPromise<GetSys_dict_dataAggregateType<T>>

    /**
     * Group by Sys_dict_data.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_dict_dataGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_dict_dataGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_dict_dataGroupByArgs['orderBy'] }
        : { orderBy?: sys_dict_dataGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_dict_dataGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_dict_dataGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_dict_data model
   */
  readonly fields: sys_dict_dataFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_dict_data.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_dict_dataClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_dict_data model
   */
  interface sys_dict_dataFieldRefs {
    readonly dict_data_id: FieldRef<"sys_dict_data", 'String'>
    readonly tenant_id: FieldRef<"sys_dict_data", 'String'>
    readonly dict_type_id: FieldRef<"sys_dict_data", 'String'>
    readonly dict_label: FieldRef<"sys_dict_data", 'String'>
    readonly dict_value: FieldRef<"sys_dict_data", 'String'>
    readonly sort_order: FieldRef<"sys_dict_data", 'Int'>
    readonly status: FieldRef<"sys_dict_data", 'Int'>
    readonly remark: FieldRef<"sys_dict_data", 'String'>
    readonly created_at: FieldRef<"sys_dict_data", 'DateTime'>
    readonly updated_at: FieldRef<"sys_dict_data", 'DateTime'>
    readonly created_by: FieldRef<"sys_dict_data", 'String'>
    readonly updated_by: FieldRef<"sys_dict_data", 'String'>
    readonly is_deleted: FieldRef<"sys_dict_data", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_dict_data findUnique
   */
  export type sys_dict_dataFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_data to fetch.
     */
    where: sys_dict_dataWhereUniqueInput
  }

  /**
   * sys_dict_data findUniqueOrThrow
   */
  export type sys_dict_dataFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_data to fetch.
     */
    where: sys_dict_dataWhereUniqueInput
  }

  /**
   * sys_dict_data findFirst
   */
  export type sys_dict_dataFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_data to fetch.
     */
    where?: sys_dict_dataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_data to fetch.
     */
    orderBy?: sys_dict_dataOrderByWithRelationInput | sys_dict_dataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_dict_data.
     */
    cursor?: sys_dict_dataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_data from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_data.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_data.
     */
    distinct?: Sys_dict_dataScalarFieldEnum | Sys_dict_dataScalarFieldEnum[]
  }

  /**
   * sys_dict_data findFirstOrThrow
   */
  export type sys_dict_dataFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_data to fetch.
     */
    where?: sys_dict_dataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_data to fetch.
     */
    orderBy?: sys_dict_dataOrderByWithRelationInput | sys_dict_dataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_dict_data.
     */
    cursor?: sys_dict_dataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_data from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_data.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_data.
     */
    distinct?: Sys_dict_dataScalarFieldEnum | Sys_dict_dataScalarFieldEnum[]
  }

  /**
   * sys_dict_data findMany
   */
  export type sys_dict_dataFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter, which sys_dict_data to fetch.
     */
    where?: sys_dict_dataWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_dict_data to fetch.
     */
    orderBy?: sys_dict_dataOrderByWithRelationInput | sys_dict_dataOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_dict_data.
     */
    cursor?: sys_dict_dataWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_dict_data from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_dict_data.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_dict_data.
     */
    distinct?: Sys_dict_dataScalarFieldEnum | Sys_dict_dataScalarFieldEnum[]
  }

  /**
   * sys_dict_data create
   */
  export type sys_dict_dataCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_dict_data.
     */
    data: XOR<sys_dict_dataCreateInput, sys_dict_dataUncheckedCreateInput>
  }

  /**
   * sys_dict_data createMany
   */
  export type sys_dict_dataCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_dict_data.
     */
    data: sys_dict_dataCreateManyInput | sys_dict_dataCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dict_data createManyAndReturn
   */
  export type sys_dict_dataCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * The data used to create many sys_dict_data.
     */
    data: sys_dict_dataCreateManyInput | sys_dict_dataCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_dict_data update
   */
  export type sys_dict_dataUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_dict_data.
     */
    data: XOR<sys_dict_dataUpdateInput, sys_dict_dataUncheckedUpdateInput>
    /**
     * Choose, which sys_dict_data to update.
     */
    where: sys_dict_dataWhereUniqueInput
  }

  /**
   * sys_dict_data updateMany
   */
  export type sys_dict_dataUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_dict_data.
     */
    data: XOR<sys_dict_dataUpdateManyMutationInput, sys_dict_dataUncheckedUpdateManyInput>
    /**
     * Filter which sys_dict_data to update
     */
    where?: sys_dict_dataWhereInput
    /**
     * Limit how many sys_dict_data to update.
     */
    limit?: number
  }

  /**
   * sys_dict_data updateManyAndReturn
   */
  export type sys_dict_dataUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * The data used to update sys_dict_data.
     */
    data: XOR<sys_dict_dataUpdateManyMutationInput, sys_dict_dataUncheckedUpdateManyInput>
    /**
     * Filter which sys_dict_data to update
     */
    where?: sys_dict_dataWhereInput
    /**
     * Limit how many sys_dict_data to update.
     */
    limit?: number
  }

  /**
   * sys_dict_data upsert
   */
  export type sys_dict_dataUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_dict_data to update in case it exists.
     */
    where: sys_dict_dataWhereUniqueInput
    /**
     * In case the sys_dict_data found by the `where` argument doesn't exist, create a new sys_dict_data with this data.
     */
    create: XOR<sys_dict_dataCreateInput, sys_dict_dataUncheckedCreateInput>
    /**
     * In case the sys_dict_data was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_dict_dataUpdateInput, sys_dict_dataUncheckedUpdateInput>
  }

  /**
   * sys_dict_data delete
   */
  export type sys_dict_dataDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
    /**
     * Filter which sys_dict_data to delete.
     */
    where: sys_dict_dataWhereUniqueInput
  }

  /**
   * sys_dict_data deleteMany
   */
  export type sys_dict_dataDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_dict_data to delete
     */
    where?: sys_dict_dataWhereInput
    /**
     * Limit how many sys_dict_data to delete.
     */
    limit?: number
  }

  /**
   * sys_dict_data without action
   */
  export type sys_dict_dataDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_dict_data
     */
    select?: sys_dict_dataSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_dict_data
     */
    omit?: sys_dict_dataOmit<ExtArgs> | null
  }


  /**
   * Model sys_notice
   */

  export type AggregateSys_notice = {
    _count: Sys_noticeCountAggregateOutputType | null
    _avg: Sys_noticeAvgAggregateOutputType | null
    _sum: Sys_noticeSumAggregateOutputType | null
    _min: Sys_noticeMinAggregateOutputType | null
    _max: Sys_noticeMaxAggregateOutputType | null
  }

  export type Sys_noticeAvgAggregateOutputType = {
    notice_type: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_noticeSumAggregateOutputType = {
    notice_type: number | null
    status: number | null
    is_deleted: number | null
  }

  export type Sys_noticeMinAggregateOutputType = {
    notice_id: string | null
    tenant_id: string | null
    title: string | null
    content: string | null
    notice_type: number | null
    status: number | null
    publish_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_noticeMaxAggregateOutputType = {
    notice_id: string | null
    tenant_id: string | null
    title: string | null
    content: string | null
    notice_type: number | null
    status: number | null
    publish_time: Date | null
    created_at: Date | null
    updated_at: Date | null
    created_by: string | null
    updated_by: string | null
    is_deleted: number | null
  }

  export type Sys_noticeCountAggregateOutputType = {
    notice_id: number
    tenant_id: number
    title: number
    content: number
    notice_type: number
    status: number
    publish_time: number
    created_at: number
    updated_at: number
    created_by: number
    updated_by: number
    is_deleted: number
    _all: number
  }


  export type Sys_noticeAvgAggregateInputType = {
    notice_type?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_noticeSumAggregateInputType = {
    notice_type?: true
    status?: true
    is_deleted?: true
  }

  export type Sys_noticeMinAggregateInputType = {
    notice_id?: true
    tenant_id?: true
    title?: true
    content?: true
    notice_type?: true
    status?: true
    publish_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_noticeMaxAggregateInputType = {
    notice_id?: true
    tenant_id?: true
    title?: true
    content?: true
    notice_type?: true
    status?: true
    publish_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
  }

  export type Sys_noticeCountAggregateInputType = {
    notice_id?: true
    tenant_id?: true
    title?: true
    content?: true
    notice_type?: true
    status?: true
    publish_time?: true
    created_at?: true
    updated_at?: true
    created_by?: true
    updated_by?: true
    is_deleted?: true
    _all?: true
  }

  export type Sys_noticeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_notice to aggregate.
     */
    where?: sys_noticeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_notices to fetch.
     */
    orderBy?: sys_noticeOrderByWithRelationInput | sys_noticeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_noticeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_notices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_notices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_notices
    **/
    _count?: true | Sys_noticeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_noticeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_noticeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_noticeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_noticeMaxAggregateInputType
  }

  export type GetSys_noticeAggregateType<T extends Sys_noticeAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_notice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_notice[P]>
      : GetScalarType<T[P], AggregateSys_notice[P]>
  }




  export type sys_noticeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_noticeWhereInput
    orderBy?: sys_noticeOrderByWithAggregationInput | sys_noticeOrderByWithAggregationInput[]
    by: Sys_noticeScalarFieldEnum[] | Sys_noticeScalarFieldEnum
    having?: sys_noticeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_noticeCountAggregateInputType | true
    _avg?: Sys_noticeAvgAggregateInputType
    _sum?: Sys_noticeSumAggregateInputType
    _min?: Sys_noticeMinAggregateInputType
    _max?: Sys_noticeMaxAggregateInputType
  }

  export type Sys_noticeGroupByOutputType = {
    notice_id: string
    tenant_id: string
    title: string
    content: string | null
    notice_type: number
    status: number
    publish_time: Date | null
    created_at: Date
    updated_at: Date
    created_by: string | null
    updated_by: string | null
    is_deleted: number
    _count: Sys_noticeCountAggregateOutputType | null
    _avg: Sys_noticeAvgAggregateOutputType | null
    _sum: Sys_noticeSumAggregateOutputType | null
    _min: Sys_noticeMinAggregateOutputType | null
    _max: Sys_noticeMaxAggregateOutputType | null
  }

  type GetSys_noticeGroupByPayload<T extends sys_noticeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_noticeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_noticeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_noticeGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_noticeGroupByOutputType[P]>
        }
      >
    >


  export type sys_noticeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    notice_id?: boolean
    tenant_id?: boolean
    title?: boolean
    content?: boolean
    notice_type?: boolean
    status?: boolean
    publish_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_notice"]>

  export type sys_noticeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    notice_id?: boolean
    tenant_id?: boolean
    title?: boolean
    content?: boolean
    notice_type?: boolean
    status?: boolean
    publish_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_notice"]>

  export type sys_noticeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    notice_id?: boolean
    tenant_id?: boolean
    title?: boolean
    content?: boolean
    notice_type?: boolean
    status?: boolean
    publish_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }, ExtArgs["result"]["sys_notice"]>

  export type sys_noticeSelectScalar = {
    notice_id?: boolean
    tenant_id?: boolean
    title?: boolean
    content?: boolean
    notice_type?: boolean
    status?: boolean
    publish_time?: boolean
    created_at?: boolean
    updated_at?: boolean
    created_by?: boolean
    updated_by?: boolean
    is_deleted?: boolean
  }

  export type sys_noticeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"notice_id" | "tenant_id" | "title" | "content" | "notice_type" | "status" | "publish_time" | "created_at" | "updated_at" | "created_by" | "updated_by" | "is_deleted", ExtArgs["result"]["sys_notice"]>

  export type $sys_noticePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_notice"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      notice_id: string
      tenant_id: string
      title: string
      content: string | null
      notice_type: number
      status: number
      publish_time: Date | null
      created_at: Date
      updated_at: Date
      created_by: string | null
      updated_by: string | null
      is_deleted: number
    }, ExtArgs["result"]["sys_notice"]>
    composites: {}
  }

  type sys_noticeGetPayload<S extends boolean | null | undefined | sys_noticeDefaultArgs> = $Result.GetResult<Prisma.$sys_noticePayload, S>

  type sys_noticeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_noticeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_noticeCountAggregateInputType | true
    }

  export interface sys_noticeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_notice'], meta: { name: 'sys_notice' } }
    /**
     * Find zero or one Sys_notice that matches the filter.
     * @param {sys_noticeFindUniqueArgs} args - Arguments to find a Sys_notice
     * @example
     * // Get one Sys_notice
     * const sys_notice = await prisma.sys_notice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_noticeFindUniqueArgs>(args: SelectSubset<T, sys_noticeFindUniqueArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_notice that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_noticeFindUniqueOrThrowArgs} args - Arguments to find a Sys_notice
     * @example
     * // Get one Sys_notice
     * const sys_notice = await prisma.sys_notice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_noticeFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_noticeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_notice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeFindFirstArgs} args - Arguments to find a Sys_notice
     * @example
     * // Get one Sys_notice
     * const sys_notice = await prisma.sys_notice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_noticeFindFirstArgs>(args?: SelectSubset<T, sys_noticeFindFirstArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_notice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeFindFirstOrThrowArgs} args - Arguments to find a Sys_notice
     * @example
     * // Get one Sys_notice
     * const sys_notice = await prisma.sys_notice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_noticeFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_noticeFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_notices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_notices
     * const sys_notices = await prisma.sys_notice.findMany()
     * 
     * // Get first 10 Sys_notices
     * const sys_notices = await prisma.sys_notice.findMany({ take: 10 })
     * 
     * // Only select the `notice_id`
     * const sys_noticeWithNotice_idOnly = await prisma.sys_notice.findMany({ select: { notice_id: true } })
     * 
     */
    findMany<T extends sys_noticeFindManyArgs>(args?: SelectSubset<T, sys_noticeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_notice.
     * @param {sys_noticeCreateArgs} args - Arguments to create a Sys_notice.
     * @example
     * // Create one Sys_notice
     * const Sys_notice = await prisma.sys_notice.create({
     *   data: {
     *     // ... data to create a Sys_notice
     *   }
     * })
     * 
     */
    create<T extends sys_noticeCreateArgs>(args: SelectSubset<T, sys_noticeCreateArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_notices.
     * @param {sys_noticeCreateManyArgs} args - Arguments to create many Sys_notices.
     * @example
     * // Create many Sys_notices
     * const sys_notice = await prisma.sys_notice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_noticeCreateManyArgs>(args?: SelectSubset<T, sys_noticeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_notices and returns the data saved in the database.
     * @param {sys_noticeCreateManyAndReturnArgs} args - Arguments to create many Sys_notices.
     * @example
     * // Create many Sys_notices
     * const sys_notice = await prisma.sys_notice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_notices and only return the `notice_id`
     * const sys_noticeWithNotice_idOnly = await prisma.sys_notice.createManyAndReturn({
     *   select: { notice_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_noticeCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_noticeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_notice.
     * @param {sys_noticeDeleteArgs} args - Arguments to delete one Sys_notice.
     * @example
     * // Delete one Sys_notice
     * const Sys_notice = await prisma.sys_notice.delete({
     *   where: {
     *     // ... filter to delete one Sys_notice
     *   }
     * })
     * 
     */
    delete<T extends sys_noticeDeleteArgs>(args: SelectSubset<T, sys_noticeDeleteArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_notice.
     * @param {sys_noticeUpdateArgs} args - Arguments to update one Sys_notice.
     * @example
     * // Update one Sys_notice
     * const sys_notice = await prisma.sys_notice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_noticeUpdateArgs>(args: SelectSubset<T, sys_noticeUpdateArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_notices.
     * @param {sys_noticeDeleteManyArgs} args - Arguments to filter Sys_notices to delete.
     * @example
     * // Delete a few Sys_notices
     * const { count } = await prisma.sys_notice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_noticeDeleteManyArgs>(args?: SelectSubset<T, sys_noticeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_notices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_notices
     * const sys_notice = await prisma.sys_notice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_noticeUpdateManyArgs>(args: SelectSubset<T, sys_noticeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_notices and returns the data updated in the database.
     * @param {sys_noticeUpdateManyAndReturnArgs} args - Arguments to update many Sys_notices.
     * @example
     * // Update many Sys_notices
     * const sys_notice = await prisma.sys_notice.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_notices and only return the `notice_id`
     * const sys_noticeWithNotice_idOnly = await prisma.sys_notice.updateManyAndReturn({
     *   select: { notice_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_noticeUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_noticeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_notice.
     * @param {sys_noticeUpsertArgs} args - Arguments to update or create a Sys_notice.
     * @example
     * // Update or create a Sys_notice
     * const sys_notice = await prisma.sys_notice.upsert({
     *   create: {
     *     // ... data to create a Sys_notice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_notice we want to update
     *   }
     * })
     */
    upsert<T extends sys_noticeUpsertArgs>(args: SelectSubset<T, sys_noticeUpsertArgs<ExtArgs>>): Prisma__sys_noticeClient<$Result.GetResult<Prisma.$sys_noticePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_notices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeCountArgs} args - Arguments to filter Sys_notices to count.
     * @example
     * // Count the number of Sys_notices
     * const count = await prisma.sys_notice.count({
     *   where: {
     *     // ... the filter for the Sys_notices we want to count
     *   }
     * })
    **/
    count<T extends sys_noticeCountArgs>(
      args?: Subset<T, sys_noticeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_noticeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_notice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_noticeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_noticeAggregateArgs>(args: Subset<T, Sys_noticeAggregateArgs>): Prisma.PrismaPromise<GetSys_noticeAggregateType<T>>

    /**
     * Group by Sys_notice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_noticeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_noticeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_noticeGroupByArgs['orderBy'] }
        : { orderBy?: sys_noticeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_noticeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_noticeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_notice model
   */
  readonly fields: sys_noticeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_notice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_noticeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_notice model
   */
  interface sys_noticeFieldRefs {
    readonly notice_id: FieldRef<"sys_notice", 'String'>
    readonly tenant_id: FieldRef<"sys_notice", 'String'>
    readonly title: FieldRef<"sys_notice", 'String'>
    readonly content: FieldRef<"sys_notice", 'String'>
    readonly notice_type: FieldRef<"sys_notice", 'Int'>
    readonly status: FieldRef<"sys_notice", 'Int'>
    readonly publish_time: FieldRef<"sys_notice", 'DateTime'>
    readonly created_at: FieldRef<"sys_notice", 'DateTime'>
    readonly updated_at: FieldRef<"sys_notice", 'DateTime'>
    readonly created_by: FieldRef<"sys_notice", 'String'>
    readonly updated_by: FieldRef<"sys_notice", 'String'>
    readonly is_deleted: FieldRef<"sys_notice", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * sys_notice findUnique
   */
  export type sys_noticeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter, which sys_notice to fetch.
     */
    where: sys_noticeWhereUniqueInput
  }

  /**
   * sys_notice findUniqueOrThrow
   */
  export type sys_noticeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter, which sys_notice to fetch.
     */
    where: sys_noticeWhereUniqueInput
  }

  /**
   * sys_notice findFirst
   */
  export type sys_noticeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter, which sys_notice to fetch.
     */
    where?: sys_noticeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_notices to fetch.
     */
    orderBy?: sys_noticeOrderByWithRelationInput | sys_noticeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_notices.
     */
    cursor?: sys_noticeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_notices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_notices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_notices.
     */
    distinct?: Sys_noticeScalarFieldEnum | Sys_noticeScalarFieldEnum[]
  }

  /**
   * sys_notice findFirstOrThrow
   */
  export type sys_noticeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter, which sys_notice to fetch.
     */
    where?: sys_noticeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_notices to fetch.
     */
    orderBy?: sys_noticeOrderByWithRelationInput | sys_noticeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_notices.
     */
    cursor?: sys_noticeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_notices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_notices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_notices.
     */
    distinct?: Sys_noticeScalarFieldEnum | Sys_noticeScalarFieldEnum[]
  }

  /**
   * sys_notice findMany
   */
  export type sys_noticeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter, which sys_notices to fetch.
     */
    where?: sys_noticeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_notices to fetch.
     */
    orderBy?: sys_noticeOrderByWithRelationInput | sys_noticeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_notices.
     */
    cursor?: sys_noticeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_notices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_notices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_notices.
     */
    distinct?: Sys_noticeScalarFieldEnum | Sys_noticeScalarFieldEnum[]
  }

  /**
   * sys_notice create
   */
  export type sys_noticeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_notice.
     */
    data: XOR<sys_noticeCreateInput, sys_noticeUncheckedCreateInput>
  }

  /**
   * sys_notice createMany
   */
  export type sys_noticeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_notices.
     */
    data: sys_noticeCreateManyInput | sys_noticeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_notice createManyAndReturn
   */
  export type sys_noticeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * The data used to create many sys_notices.
     */
    data: sys_noticeCreateManyInput | sys_noticeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_notice update
   */
  export type sys_noticeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_notice.
     */
    data: XOR<sys_noticeUpdateInput, sys_noticeUncheckedUpdateInput>
    /**
     * Choose, which sys_notice to update.
     */
    where: sys_noticeWhereUniqueInput
  }

  /**
   * sys_notice updateMany
   */
  export type sys_noticeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_notices.
     */
    data: XOR<sys_noticeUpdateManyMutationInput, sys_noticeUncheckedUpdateManyInput>
    /**
     * Filter which sys_notices to update
     */
    where?: sys_noticeWhereInput
    /**
     * Limit how many sys_notices to update.
     */
    limit?: number
  }

  /**
   * sys_notice updateManyAndReturn
   */
  export type sys_noticeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * The data used to update sys_notices.
     */
    data: XOR<sys_noticeUpdateManyMutationInput, sys_noticeUncheckedUpdateManyInput>
    /**
     * Filter which sys_notices to update
     */
    where?: sys_noticeWhereInput
    /**
     * Limit how many sys_notices to update.
     */
    limit?: number
  }

  /**
   * sys_notice upsert
   */
  export type sys_noticeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_notice to update in case it exists.
     */
    where: sys_noticeWhereUniqueInput
    /**
     * In case the sys_notice found by the `where` argument doesn't exist, create a new sys_notice with this data.
     */
    create: XOR<sys_noticeCreateInput, sys_noticeUncheckedCreateInput>
    /**
     * In case the sys_notice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_noticeUpdateInput, sys_noticeUncheckedUpdateInput>
  }

  /**
   * sys_notice delete
   */
  export type sys_noticeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
    /**
     * Filter which sys_notice to delete.
     */
    where: sys_noticeWhereUniqueInput
  }

  /**
   * sys_notice deleteMany
   */
  export type sys_noticeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_notices to delete
     */
    where?: sys_noticeWhereInput
    /**
     * Limit how many sys_notices to delete.
     */
    limit?: number
  }

  /**
   * sys_notice without action
   */
  export type sys_noticeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_notice
     */
    select?: sys_noticeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_notice
     */
    omit?: sys_noticeOmit<ExtArgs> | null
  }


  /**
   * Model sys_audit_log
   */

  export type AggregateSys_audit_log = {
    _count: Sys_audit_logCountAggregateOutputType | null
    _avg: Sys_audit_logAvgAggregateOutputType | null
    _sum: Sys_audit_logSumAggregateOutputType | null
    _min: Sys_audit_logMinAggregateOutputType | null
    _max: Sys_audit_logMaxAggregateOutputType | null
  }

  export type Sys_audit_logAvgAggregateOutputType = {
    execute_time: number | null
    status: number | null
  }

  export type Sys_audit_logSumAggregateOutputType = {
    execute_time: number | null
    status: number | null
  }

  export type Sys_audit_logMinAggregateOutputType = {
    log_id: string | null
    tenant_id: string | null
    user_id: string | null
    username: string | null
    operation: string | null
    method: string | null
    request_url: string | null
    request_params: string | null
    response_data: string | null
    ip_address: string | null
    user_agent: string | null
    execute_time: number | null
    status: number | null
    error_msg: string | null
    created_at: Date | null
  }

  export type Sys_audit_logMaxAggregateOutputType = {
    log_id: string | null
    tenant_id: string | null
    user_id: string | null
    username: string | null
    operation: string | null
    method: string | null
    request_url: string | null
    request_params: string | null
    response_data: string | null
    ip_address: string | null
    user_agent: string | null
    execute_time: number | null
    status: number | null
    error_msg: string | null
    created_at: Date | null
  }

  export type Sys_audit_logCountAggregateOutputType = {
    log_id: number
    tenant_id: number
    user_id: number
    username: number
    operation: number
    method: number
    request_url: number
    request_params: number
    response_data: number
    ip_address: number
    user_agent: number
    execute_time: number
    status: number
    error_msg: number
    created_at: number
    _all: number
  }


  export type Sys_audit_logAvgAggregateInputType = {
    execute_time?: true
    status?: true
  }

  export type Sys_audit_logSumAggregateInputType = {
    execute_time?: true
    status?: true
  }

  export type Sys_audit_logMinAggregateInputType = {
    log_id?: true
    tenant_id?: true
    user_id?: true
    username?: true
    operation?: true
    method?: true
    request_url?: true
    request_params?: true
    response_data?: true
    ip_address?: true
    user_agent?: true
    execute_time?: true
    status?: true
    error_msg?: true
    created_at?: true
  }

  export type Sys_audit_logMaxAggregateInputType = {
    log_id?: true
    tenant_id?: true
    user_id?: true
    username?: true
    operation?: true
    method?: true
    request_url?: true
    request_params?: true
    response_data?: true
    ip_address?: true
    user_agent?: true
    execute_time?: true
    status?: true
    error_msg?: true
    created_at?: true
  }

  export type Sys_audit_logCountAggregateInputType = {
    log_id?: true
    tenant_id?: true
    user_id?: true
    username?: true
    operation?: true
    method?: true
    request_url?: true
    request_params?: true
    response_data?: true
    ip_address?: true
    user_agent?: true
    execute_time?: true
    status?: true
    error_msg?: true
    created_at?: true
    _all?: true
  }

  export type Sys_audit_logAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_audit_log to aggregate.
     */
    where?: sys_audit_logWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_audit_logs to fetch.
     */
    orderBy?: sys_audit_logOrderByWithRelationInput | sys_audit_logOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_audit_logWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_audit_logs
    **/
    _count?: true | Sys_audit_logCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_audit_logAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_audit_logSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_audit_logMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_audit_logMaxAggregateInputType
  }

  export type GetSys_audit_logAggregateType<T extends Sys_audit_logAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_audit_log]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_audit_log[P]>
      : GetScalarType<T[P], AggregateSys_audit_log[P]>
  }




  export type sys_audit_logGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_audit_logWhereInput
    orderBy?: sys_audit_logOrderByWithAggregationInput | sys_audit_logOrderByWithAggregationInput[]
    by: Sys_audit_logScalarFieldEnum[] | Sys_audit_logScalarFieldEnum
    having?: sys_audit_logScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_audit_logCountAggregateInputType | true
    _avg?: Sys_audit_logAvgAggregateInputType
    _sum?: Sys_audit_logSumAggregateInputType
    _min?: Sys_audit_logMinAggregateInputType
    _max?: Sys_audit_logMaxAggregateInputType
  }

  export type Sys_audit_logGroupByOutputType = {
    log_id: string
    tenant_id: string
    user_id: string | null
    username: string | null
    operation: string
    method: string
    request_url: string
    request_params: string | null
    response_data: string | null
    ip_address: string
    user_agent: string | null
    execute_time: number
    status: number
    error_msg: string | null
    created_at: Date
    _count: Sys_audit_logCountAggregateOutputType | null
    _avg: Sys_audit_logAvgAggregateOutputType | null
    _sum: Sys_audit_logSumAggregateOutputType | null
    _min: Sys_audit_logMinAggregateOutputType | null
    _max: Sys_audit_logMaxAggregateOutputType | null
  }

  type GetSys_audit_logGroupByPayload<T extends sys_audit_logGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_audit_logGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_audit_logGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_audit_logGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_audit_logGroupByOutputType[P]>
        }
      >
    >


  export type sys_audit_logSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    log_id?: boolean
    tenant_id?: boolean
    user_id?: boolean
    username?: boolean
    operation?: boolean
    method?: boolean
    request_url?: boolean
    request_params?: boolean
    response_data?: boolean
    ip_address?: boolean
    user_agent?: boolean
    execute_time?: boolean
    status?: boolean
    error_msg?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_audit_log"]>

  export type sys_audit_logSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    log_id?: boolean
    tenant_id?: boolean
    user_id?: boolean
    username?: boolean
    operation?: boolean
    method?: boolean
    request_url?: boolean
    request_params?: boolean
    response_data?: boolean
    ip_address?: boolean
    user_agent?: boolean
    execute_time?: boolean
    status?: boolean
    error_msg?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_audit_log"]>

  export type sys_audit_logSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    log_id?: boolean
    tenant_id?: boolean
    user_id?: boolean
    username?: boolean
    operation?: boolean
    method?: boolean
    request_url?: boolean
    request_params?: boolean
    response_data?: boolean
    ip_address?: boolean
    user_agent?: boolean
    execute_time?: boolean
    status?: boolean
    error_msg?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_audit_log"]>

  export type sys_audit_logSelectScalar = {
    log_id?: boolean
    tenant_id?: boolean
    user_id?: boolean
    username?: boolean
    operation?: boolean
    method?: boolean
    request_url?: boolean
    request_params?: boolean
    response_data?: boolean
    ip_address?: boolean
    user_agent?: boolean
    execute_time?: boolean
    status?: boolean
    error_msg?: boolean
    created_at?: boolean
  }

  export type sys_audit_logOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"log_id" | "tenant_id" | "user_id" | "username" | "operation" | "method" | "request_url" | "request_params" | "response_data" | "ip_address" | "user_agent" | "execute_time" | "status" | "error_msg" | "created_at", ExtArgs["result"]["sys_audit_log"]>

  export type $sys_audit_logPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_audit_log"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      log_id: string
      tenant_id: string
      user_id: string | null
      username: string | null
      operation: string
      method: string
      request_url: string
      request_params: string | null
      response_data: string | null
      ip_address: string
      user_agent: string | null
      execute_time: number
      status: number
      error_msg: string | null
      created_at: Date
    }, ExtArgs["result"]["sys_audit_log"]>
    composites: {}
  }

  type sys_audit_logGetPayload<S extends boolean | null | undefined | sys_audit_logDefaultArgs> = $Result.GetResult<Prisma.$sys_audit_logPayload, S>

  type sys_audit_logCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_audit_logFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_audit_logCountAggregateInputType | true
    }

  export interface sys_audit_logDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_audit_log'], meta: { name: 'sys_audit_log' } }
    /**
     * Find zero or one Sys_audit_log that matches the filter.
     * @param {sys_audit_logFindUniqueArgs} args - Arguments to find a Sys_audit_log
     * @example
     * // Get one Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_audit_logFindUniqueArgs>(args: SelectSubset<T, sys_audit_logFindUniqueArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_audit_log that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_audit_logFindUniqueOrThrowArgs} args - Arguments to find a Sys_audit_log
     * @example
     * // Get one Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_audit_logFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_audit_logFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_audit_log that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logFindFirstArgs} args - Arguments to find a Sys_audit_log
     * @example
     * // Get one Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_audit_logFindFirstArgs>(args?: SelectSubset<T, sys_audit_logFindFirstArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_audit_log that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logFindFirstOrThrowArgs} args - Arguments to find a Sys_audit_log
     * @example
     * // Get one Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_audit_logFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_audit_logFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_audit_logs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_audit_logs
     * const sys_audit_logs = await prisma.sys_audit_log.findMany()
     * 
     * // Get first 10 Sys_audit_logs
     * const sys_audit_logs = await prisma.sys_audit_log.findMany({ take: 10 })
     * 
     * // Only select the `log_id`
     * const sys_audit_logWithLog_idOnly = await prisma.sys_audit_log.findMany({ select: { log_id: true } })
     * 
     */
    findMany<T extends sys_audit_logFindManyArgs>(args?: SelectSubset<T, sys_audit_logFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_audit_log.
     * @param {sys_audit_logCreateArgs} args - Arguments to create a Sys_audit_log.
     * @example
     * // Create one Sys_audit_log
     * const Sys_audit_log = await prisma.sys_audit_log.create({
     *   data: {
     *     // ... data to create a Sys_audit_log
     *   }
     * })
     * 
     */
    create<T extends sys_audit_logCreateArgs>(args: SelectSubset<T, sys_audit_logCreateArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_audit_logs.
     * @param {sys_audit_logCreateManyArgs} args - Arguments to create many Sys_audit_logs.
     * @example
     * // Create many Sys_audit_logs
     * const sys_audit_log = await prisma.sys_audit_log.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_audit_logCreateManyArgs>(args?: SelectSubset<T, sys_audit_logCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_audit_logs and returns the data saved in the database.
     * @param {sys_audit_logCreateManyAndReturnArgs} args - Arguments to create many Sys_audit_logs.
     * @example
     * // Create many Sys_audit_logs
     * const sys_audit_log = await prisma.sys_audit_log.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_audit_logs and only return the `log_id`
     * const sys_audit_logWithLog_idOnly = await prisma.sys_audit_log.createManyAndReturn({
     *   select: { log_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_audit_logCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_audit_logCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_audit_log.
     * @param {sys_audit_logDeleteArgs} args - Arguments to delete one Sys_audit_log.
     * @example
     * // Delete one Sys_audit_log
     * const Sys_audit_log = await prisma.sys_audit_log.delete({
     *   where: {
     *     // ... filter to delete one Sys_audit_log
     *   }
     * })
     * 
     */
    delete<T extends sys_audit_logDeleteArgs>(args: SelectSubset<T, sys_audit_logDeleteArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_audit_log.
     * @param {sys_audit_logUpdateArgs} args - Arguments to update one Sys_audit_log.
     * @example
     * // Update one Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_audit_logUpdateArgs>(args: SelectSubset<T, sys_audit_logUpdateArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_audit_logs.
     * @param {sys_audit_logDeleteManyArgs} args - Arguments to filter Sys_audit_logs to delete.
     * @example
     * // Delete a few Sys_audit_logs
     * const { count } = await prisma.sys_audit_log.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_audit_logDeleteManyArgs>(args?: SelectSubset<T, sys_audit_logDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_audit_logs
     * const sys_audit_log = await prisma.sys_audit_log.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_audit_logUpdateManyArgs>(args: SelectSubset<T, sys_audit_logUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_audit_logs and returns the data updated in the database.
     * @param {sys_audit_logUpdateManyAndReturnArgs} args - Arguments to update many Sys_audit_logs.
     * @example
     * // Update many Sys_audit_logs
     * const sys_audit_log = await prisma.sys_audit_log.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_audit_logs and only return the `log_id`
     * const sys_audit_logWithLog_idOnly = await prisma.sys_audit_log.updateManyAndReturn({
     *   select: { log_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_audit_logUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_audit_logUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_audit_log.
     * @param {sys_audit_logUpsertArgs} args - Arguments to update or create a Sys_audit_log.
     * @example
     * // Update or create a Sys_audit_log
     * const sys_audit_log = await prisma.sys_audit_log.upsert({
     *   create: {
     *     // ... data to create a Sys_audit_log
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_audit_log we want to update
     *   }
     * })
     */
    upsert<T extends sys_audit_logUpsertArgs>(args: SelectSubset<T, sys_audit_logUpsertArgs<ExtArgs>>): Prisma__sys_audit_logClient<$Result.GetResult<Prisma.$sys_audit_logPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logCountArgs} args - Arguments to filter Sys_audit_logs to count.
     * @example
     * // Count the number of Sys_audit_logs
     * const count = await prisma.sys_audit_log.count({
     *   where: {
     *     // ... the filter for the Sys_audit_logs we want to count
     *   }
     * })
    **/
    count<T extends sys_audit_logCountArgs>(
      args?: Subset<T, sys_audit_logCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_audit_logCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_audit_log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_audit_logAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_audit_logAggregateArgs>(args: Subset<T, Sys_audit_logAggregateArgs>): Prisma.PrismaPromise<GetSys_audit_logAggregateType<T>>

    /**
     * Group by Sys_audit_log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_audit_logGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_audit_logGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_audit_logGroupByArgs['orderBy'] }
        : { orderBy?: sys_audit_logGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_audit_logGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_audit_logGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_audit_log model
   */
  readonly fields: sys_audit_logFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_audit_log.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_audit_logClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_audit_log model
   */
  interface sys_audit_logFieldRefs {
    readonly log_id: FieldRef<"sys_audit_log", 'String'>
    readonly tenant_id: FieldRef<"sys_audit_log", 'String'>
    readonly user_id: FieldRef<"sys_audit_log", 'String'>
    readonly username: FieldRef<"sys_audit_log", 'String'>
    readonly operation: FieldRef<"sys_audit_log", 'String'>
    readonly method: FieldRef<"sys_audit_log", 'String'>
    readonly request_url: FieldRef<"sys_audit_log", 'String'>
    readonly request_params: FieldRef<"sys_audit_log", 'String'>
    readonly response_data: FieldRef<"sys_audit_log", 'String'>
    readonly ip_address: FieldRef<"sys_audit_log", 'String'>
    readonly user_agent: FieldRef<"sys_audit_log", 'String'>
    readonly execute_time: FieldRef<"sys_audit_log", 'Int'>
    readonly status: FieldRef<"sys_audit_log", 'Int'>
    readonly error_msg: FieldRef<"sys_audit_log", 'String'>
    readonly created_at: FieldRef<"sys_audit_log", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_audit_log findUnique
   */
  export type sys_audit_logFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter, which sys_audit_log to fetch.
     */
    where: sys_audit_logWhereUniqueInput
  }

  /**
   * sys_audit_log findUniqueOrThrow
   */
  export type sys_audit_logFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter, which sys_audit_log to fetch.
     */
    where: sys_audit_logWhereUniqueInput
  }

  /**
   * sys_audit_log findFirst
   */
  export type sys_audit_logFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter, which sys_audit_log to fetch.
     */
    where?: sys_audit_logWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_audit_logs to fetch.
     */
    orderBy?: sys_audit_logOrderByWithRelationInput | sys_audit_logOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_audit_logs.
     */
    cursor?: sys_audit_logWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_audit_logs.
     */
    distinct?: Sys_audit_logScalarFieldEnum | Sys_audit_logScalarFieldEnum[]
  }

  /**
   * sys_audit_log findFirstOrThrow
   */
  export type sys_audit_logFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter, which sys_audit_log to fetch.
     */
    where?: sys_audit_logWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_audit_logs to fetch.
     */
    orderBy?: sys_audit_logOrderByWithRelationInput | sys_audit_logOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_audit_logs.
     */
    cursor?: sys_audit_logWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_audit_logs.
     */
    distinct?: Sys_audit_logScalarFieldEnum | Sys_audit_logScalarFieldEnum[]
  }

  /**
   * sys_audit_log findMany
   */
  export type sys_audit_logFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter, which sys_audit_logs to fetch.
     */
    where?: sys_audit_logWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_audit_logs to fetch.
     */
    orderBy?: sys_audit_logOrderByWithRelationInput | sys_audit_logOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_audit_logs.
     */
    cursor?: sys_audit_logWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_audit_logs.
     */
    distinct?: Sys_audit_logScalarFieldEnum | Sys_audit_logScalarFieldEnum[]
  }

  /**
   * sys_audit_log create
   */
  export type sys_audit_logCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_audit_log.
     */
    data: XOR<sys_audit_logCreateInput, sys_audit_logUncheckedCreateInput>
  }

  /**
   * sys_audit_log createMany
   */
  export type sys_audit_logCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_audit_logs.
     */
    data: sys_audit_logCreateManyInput | sys_audit_logCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_audit_log createManyAndReturn
   */
  export type sys_audit_logCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * The data used to create many sys_audit_logs.
     */
    data: sys_audit_logCreateManyInput | sys_audit_logCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_audit_log update
   */
  export type sys_audit_logUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_audit_log.
     */
    data: XOR<sys_audit_logUpdateInput, sys_audit_logUncheckedUpdateInput>
    /**
     * Choose, which sys_audit_log to update.
     */
    where: sys_audit_logWhereUniqueInput
  }

  /**
   * sys_audit_log updateMany
   */
  export type sys_audit_logUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_audit_logs.
     */
    data: XOR<sys_audit_logUpdateManyMutationInput, sys_audit_logUncheckedUpdateManyInput>
    /**
     * Filter which sys_audit_logs to update
     */
    where?: sys_audit_logWhereInput
    /**
     * Limit how many sys_audit_logs to update.
     */
    limit?: number
  }

  /**
   * sys_audit_log updateManyAndReturn
   */
  export type sys_audit_logUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * The data used to update sys_audit_logs.
     */
    data: XOR<sys_audit_logUpdateManyMutationInput, sys_audit_logUncheckedUpdateManyInput>
    /**
     * Filter which sys_audit_logs to update
     */
    where?: sys_audit_logWhereInput
    /**
     * Limit how many sys_audit_logs to update.
     */
    limit?: number
  }

  /**
   * sys_audit_log upsert
   */
  export type sys_audit_logUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_audit_log to update in case it exists.
     */
    where: sys_audit_logWhereUniqueInput
    /**
     * In case the sys_audit_log found by the `where` argument doesn't exist, create a new sys_audit_log with this data.
     */
    create: XOR<sys_audit_logCreateInput, sys_audit_logUncheckedCreateInput>
    /**
     * In case the sys_audit_log was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_audit_logUpdateInput, sys_audit_logUncheckedUpdateInput>
  }

  /**
   * sys_audit_log delete
   */
  export type sys_audit_logDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
    /**
     * Filter which sys_audit_log to delete.
     */
    where: sys_audit_logWhereUniqueInput
  }

  /**
   * sys_audit_log deleteMany
   */
  export type sys_audit_logDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_audit_logs to delete
     */
    where?: sys_audit_logWhereInput
    /**
     * Limit how many sys_audit_logs to delete.
     */
    limit?: number
  }

  /**
   * sys_audit_log without action
   */
  export type sys_audit_logDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_audit_log
     */
    select?: sys_audit_logSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_audit_log
     */
    omit?: sys_audit_logOmit<ExtArgs> | null
  }


  /**
   * Model sys_user_role
   */

  export type AggregateSys_user_role = {
    _count: Sys_user_roleCountAggregateOutputType | null
    _min: Sys_user_roleMinAggregateOutputType | null
    _max: Sys_user_roleMaxAggregateOutputType | null
  }

  export type Sys_user_roleMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    role_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_user_roleMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    role_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_user_roleCountAggregateOutputType = {
    id: number
    user_id: number
    role_id: number
    tenant_id: number
    created_at: number
    _all: number
  }


  export type Sys_user_roleMinAggregateInputType = {
    id?: true
    user_id?: true
    role_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_user_roleMaxAggregateInputType = {
    id?: true
    user_id?: true
    role_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_user_roleCountAggregateInputType = {
    id?: true
    user_id?: true
    role_id?: true
    tenant_id?: true
    created_at?: true
    _all?: true
  }

  export type Sys_user_roleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_user_role to aggregate.
     */
    where?: sys_user_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_roles to fetch.
     */
    orderBy?: sys_user_roleOrderByWithRelationInput | sys_user_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_user_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_user_roles
    **/
    _count?: true | Sys_user_roleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_user_roleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_user_roleMaxAggregateInputType
  }

  export type GetSys_user_roleAggregateType<T extends Sys_user_roleAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_user_role]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_user_role[P]>
      : GetScalarType<T[P], AggregateSys_user_role[P]>
  }




  export type sys_user_roleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_user_roleWhereInput
    orderBy?: sys_user_roleOrderByWithAggregationInput | sys_user_roleOrderByWithAggregationInput[]
    by: Sys_user_roleScalarFieldEnum[] | Sys_user_roleScalarFieldEnum
    having?: sys_user_roleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_user_roleCountAggregateInputType | true
    _min?: Sys_user_roleMinAggregateInputType
    _max?: Sys_user_roleMaxAggregateInputType
  }

  export type Sys_user_roleGroupByOutputType = {
    id: string
    user_id: string
    role_id: string
    tenant_id: string
    created_at: Date
    _count: Sys_user_roleCountAggregateOutputType | null
    _min: Sys_user_roleMinAggregateOutputType | null
    _max: Sys_user_roleMaxAggregateOutputType | null
  }

  type GetSys_user_roleGroupByPayload<T extends sys_user_roleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_user_roleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_user_roleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_user_roleGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_user_roleGroupByOutputType[P]>
        }
      >
    >


  export type sys_user_roleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    role_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_role"]>

  export type sys_user_roleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    role_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_role"]>

  export type sys_user_roleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    role_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_role"]>

  export type sys_user_roleSelectScalar = {
    id?: boolean
    user_id?: boolean
    role_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }

  export type sys_user_roleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "role_id" | "tenant_id" | "created_at", ExtArgs["result"]["sys_user_role"]>

  export type $sys_user_rolePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_user_role"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      role_id: string
      tenant_id: string
      created_at: Date
    }, ExtArgs["result"]["sys_user_role"]>
    composites: {}
  }

  type sys_user_roleGetPayload<S extends boolean | null | undefined | sys_user_roleDefaultArgs> = $Result.GetResult<Prisma.$sys_user_rolePayload, S>

  type sys_user_roleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_user_roleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_user_roleCountAggregateInputType | true
    }

  export interface sys_user_roleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_user_role'], meta: { name: 'sys_user_role' } }
    /**
     * Find zero or one Sys_user_role that matches the filter.
     * @param {sys_user_roleFindUniqueArgs} args - Arguments to find a Sys_user_role
     * @example
     * // Get one Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_user_roleFindUniqueArgs>(args: SelectSubset<T, sys_user_roleFindUniqueArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_user_role that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_user_roleFindUniqueOrThrowArgs} args - Arguments to find a Sys_user_role
     * @example
     * // Get one Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_user_roleFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_user_roleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user_role that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleFindFirstArgs} args - Arguments to find a Sys_user_role
     * @example
     * // Get one Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_user_roleFindFirstArgs>(args?: SelectSubset<T, sys_user_roleFindFirstArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user_role that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleFindFirstOrThrowArgs} args - Arguments to find a Sys_user_role
     * @example
     * // Get one Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_user_roleFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_user_roleFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_user_roles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_user_roles
     * const sys_user_roles = await prisma.sys_user_role.findMany()
     * 
     * // Get first 10 Sys_user_roles
     * const sys_user_roles = await prisma.sys_user_role.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sys_user_roleWithIdOnly = await prisma.sys_user_role.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sys_user_roleFindManyArgs>(args?: SelectSubset<T, sys_user_roleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_user_role.
     * @param {sys_user_roleCreateArgs} args - Arguments to create a Sys_user_role.
     * @example
     * // Create one Sys_user_role
     * const Sys_user_role = await prisma.sys_user_role.create({
     *   data: {
     *     // ... data to create a Sys_user_role
     *   }
     * })
     * 
     */
    create<T extends sys_user_roleCreateArgs>(args: SelectSubset<T, sys_user_roleCreateArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_user_roles.
     * @param {sys_user_roleCreateManyArgs} args - Arguments to create many Sys_user_roles.
     * @example
     * // Create many Sys_user_roles
     * const sys_user_role = await prisma.sys_user_role.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_user_roleCreateManyArgs>(args?: SelectSubset<T, sys_user_roleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_user_roles and returns the data saved in the database.
     * @param {sys_user_roleCreateManyAndReturnArgs} args - Arguments to create many Sys_user_roles.
     * @example
     * // Create many Sys_user_roles
     * const sys_user_role = await prisma.sys_user_role.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_user_roles and only return the `id`
     * const sys_user_roleWithIdOnly = await prisma.sys_user_role.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_user_roleCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_user_roleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_user_role.
     * @param {sys_user_roleDeleteArgs} args - Arguments to delete one Sys_user_role.
     * @example
     * // Delete one Sys_user_role
     * const Sys_user_role = await prisma.sys_user_role.delete({
     *   where: {
     *     // ... filter to delete one Sys_user_role
     *   }
     * })
     * 
     */
    delete<T extends sys_user_roleDeleteArgs>(args: SelectSubset<T, sys_user_roleDeleteArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_user_role.
     * @param {sys_user_roleUpdateArgs} args - Arguments to update one Sys_user_role.
     * @example
     * // Update one Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_user_roleUpdateArgs>(args: SelectSubset<T, sys_user_roleUpdateArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_user_roles.
     * @param {sys_user_roleDeleteManyArgs} args - Arguments to filter Sys_user_roles to delete.
     * @example
     * // Delete a few Sys_user_roles
     * const { count } = await prisma.sys_user_role.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_user_roleDeleteManyArgs>(args?: SelectSubset<T, sys_user_roleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_user_roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_user_roles
     * const sys_user_role = await prisma.sys_user_role.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_user_roleUpdateManyArgs>(args: SelectSubset<T, sys_user_roleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_user_roles and returns the data updated in the database.
     * @param {sys_user_roleUpdateManyAndReturnArgs} args - Arguments to update many Sys_user_roles.
     * @example
     * // Update many Sys_user_roles
     * const sys_user_role = await prisma.sys_user_role.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_user_roles and only return the `id`
     * const sys_user_roleWithIdOnly = await prisma.sys_user_role.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_user_roleUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_user_roleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_user_role.
     * @param {sys_user_roleUpsertArgs} args - Arguments to update or create a Sys_user_role.
     * @example
     * // Update or create a Sys_user_role
     * const sys_user_role = await prisma.sys_user_role.upsert({
     *   create: {
     *     // ... data to create a Sys_user_role
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_user_role we want to update
     *   }
     * })
     */
    upsert<T extends sys_user_roleUpsertArgs>(args: SelectSubset<T, sys_user_roleUpsertArgs<ExtArgs>>): Prisma__sys_user_roleClient<$Result.GetResult<Prisma.$sys_user_rolePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_user_roles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleCountArgs} args - Arguments to filter Sys_user_roles to count.
     * @example
     * // Count the number of Sys_user_roles
     * const count = await prisma.sys_user_role.count({
     *   where: {
     *     // ... the filter for the Sys_user_roles we want to count
     *   }
     * })
    **/
    count<T extends sys_user_roleCountArgs>(
      args?: Subset<T, sys_user_roleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_user_roleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_user_role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_user_roleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_user_roleAggregateArgs>(args: Subset<T, Sys_user_roleAggregateArgs>): Prisma.PrismaPromise<GetSys_user_roleAggregateType<T>>

    /**
     * Group by Sys_user_role.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_roleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_user_roleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_user_roleGroupByArgs['orderBy'] }
        : { orderBy?: sys_user_roleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_user_roleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_user_roleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_user_role model
   */
  readonly fields: sys_user_roleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_user_role.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_user_roleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_user_role model
   */
  interface sys_user_roleFieldRefs {
    readonly id: FieldRef<"sys_user_role", 'String'>
    readonly user_id: FieldRef<"sys_user_role", 'String'>
    readonly role_id: FieldRef<"sys_user_role", 'String'>
    readonly tenant_id: FieldRef<"sys_user_role", 'String'>
    readonly created_at: FieldRef<"sys_user_role", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_user_role findUnique
   */
  export type sys_user_roleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_role to fetch.
     */
    where: sys_user_roleWhereUniqueInput
  }

  /**
   * sys_user_role findUniqueOrThrow
   */
  export type sys_user_roleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_role to fetch.
     */
    where: sys_user_roleWhereUniqueInput
  }

  /**
   * sys_user_role findFirst
   */
  export type sys_user_roleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_role to fetch.
     */
    where?: sys_user_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_roles to fetch.
     */
    orderBy?: sys_user_roleOrderByWithRelationInput | sys_user_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_user_roles.
     */
    cursor?: sys_user_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_roles.
     */
    distinct?: Sys_user_roleScalarFieldEnum | Sys_user_roleScalarFieldEnum[]
  }

  /**
   * sys_user_role findFirstOrThrow
   */
  export type sys_user_roleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_role to fetch.
     */
    where?: sys_user_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_roles to fetch.
     */
    orderBy?: sys_user_roleOrderByWithRelationInput | sys_user_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_user_roles.
     */
    cursor?: sys_user_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_roles.
     */
    distinct?: Sys_user_roleScalarFieldEnum | Sys_user_roleScalarFieldEnum[]
  }

  /**
   * sys_user_role findMany
   */
  export type sys_user_roleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_roles to fetch.
     */
    where?: sys_user_roleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_roles to fetch.
     */
    orderBy?: sys_user_roleOrderByWithRelationInput | sys_user_roleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_user_roles.
     */
    cursor?: sys_user_roleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_roles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_roles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_roles.
     */
    distinct?: Sys_user_roleScalarFieldEnum | Sys_user_roleScalarFieldEnum[]
  }

  /**
   * sys_user_role create
   */
  export type sys_user_roleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_user_role.
     */
    data: XOR<sys_user_roleCreateInput, sys_user_roleUncheckedCreateInput>
  }

  /**
   * sys_user_role createMany
   */
  export type sys_user_roleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_user_roles.
     */
    data: sys_user_roleCreateManyInput | sys_user_roleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user_role createManyAndReturn
   */
  export type sys_user_roleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * The data used to create many sys_user_roles.
     */
    data: sys_user_roleCreateManyInput | sys_user_roleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user_role update
   */
  export type sys_user_roleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_user_role.
     */
    data: XOR<sys_user_roleUpdateInput, sys_user_roleUncheckedUpdateInput>
    /**
     * Choose, which sys_user_role to update.
     */
    where: sys_user_roleWhereUniqueInput
  }

  /**
   * sys_user_role updateMany
   */
  export type sys_user_roleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_user_roles.
     */
    data: XOR<sys_user_roleUpdateManyMutationInput, sys_user_roleUncheckedUpdateManyInput>
    /**
     * Filter which sys_user_roles to update
     */
    where?: sys_user_roleWhereInput
    /**
     * Limit how many sys_user_roles to update.
     */
    limit?: number
  }

  /**
   * sys_user_role updateManyAndReturn
   */
  export type sys_user_roleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * The data used to update sys_user_roles.
     */
    data: XOR<sys_user_roleUpdateManyMutationInput, sys_user_roleUncheckedUpdateManyInput>
    /**
     * Filter which sys_user_roles to update
     */
    where?: sys_user_roleWhereInput
    /**
     * Limit how many sys_user_roles to update.
     */
    limit?: number
  }

  /**
   * sys_user_role upsert
   */
  export type sys_user_roleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_user_role to update in case it exists.
     */
    where: sys_user_roleWhereUniqueInput
    /**
     * In case the sys_user_role found by the `where` argument doesn't exist, create a new sys_user_role with this data.
     */
    create: XOR<sys_user_roleCreateInput, sys_user_roleUncheckedCreateInput>
    /**
     * In case the sys_user_role was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_user_roleUpdateInput, sys_user_roleUncheckedUpdateInput>
  }

  /**
   * sys_user_role delete
   */
  export type sys_user_roleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
    /**
     * Filter which sys_user_role to delete.
     */
    where: sys_user_roleWhereUniqueInput
  }

  /**
   * sys_user_role deleteMany
   */
  export type sys_user_roleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_user_roles to delete
     */
    where?: sys_user_roleWhereInput
    /**
     * Limit how many sys_user_roles to delete.
     */
    limit?: number
  }

  /**
   * sys_user_role without action
   */
  export type sys_user_roleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_role
     */
    select?: sys_user_roleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_role
     */
    omit?: sys_user_roleOmit<ExtArgs> | null
  }


  /**
   * Model sys_user_dept
   */

  export type AggregateSys_user_dept = {
    _count: Sys_user_deptCountAggregateOutputType | null
    _avg: Sys_user_deptAvgAggregateOutputType | null
    _sum: Sys_user_deptSumAggregateOutputType | null
    _min: Sys_user_deptMinAggregateOutputType | null
    _max: Sys_user_deptMaxAggregateOutputType | null
  }

  export type Sys_user_deptAvgAggregateOutputType = {
    is_primary: number | null
  }

  export type Sys_user_deptSumAggregateOutputType = {
    is_primary: number | null
  }

  export type Sys_user_deptMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    dept_id: string | null
    tenant_id: string | null
    is_primary: number | null
    created_at: Date | null
  }

  export type Sys_user_deptMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    dept_id: string | null
    tenant_id: string | null
    is_primary: number | null
    created_at: Date | null
  }

  export type Sys_user_deptCountAggregateOutputType = {
    id: number
    user_id: number
    dept_id: number
    tenant_id: number
    is_primary: number
    created_at: number
    _all: number
  }


  export type Sys_user_deptAvgAggregateInputType = {
    is_primary?: true
  }

  export type Sys_user_deptSumAggregateInputType = {
    is_primary?: true
  }

  export type Sys_user_deptMinAggregateInputType = {
    id?: true
    user_id?: true
    dept_id?: true
    tenant_id?: true
    is_primary?: true
    created_at?: true
  }

  export type Sys_user_deptMaxAggregateInputType = {
    id?: true
    user_id?: true
    dept_id?: true
    tenant_id?: true
    is_primary?: true
    created_at?: true
  }

  export type Sys_user_deptCountAggregateInputType = {
    id?: true
    user_id?: true
    dept_id?: true
    tenant_id?: true
    is_primary?: true
    created_at?: true
    _all?: true
  }

  export type Sys_user_deptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_user_dept to aggregate.
     */
    where?: sys_user_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_depts to fetch.
     */
    orderBy?: sys_user_deptOrderByWithRelationInput | sys_user_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_user_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_user_depts
    **/
    _count?: true | Sys_user_deptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_user_deptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_user_deptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_user_deptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_user_deptMaxAggregateInputType
  }

  export type GetSys_user_deptAggregateType<T extends Sys_user_deptAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_user_dept]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_user_dept[P]>
      : GetScalarType<T[P], AggregateSys_user_dept[P]>
  }




  export type sys_user_deptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_user_deptWhereInput
    orderBy?: sys_user_deptOrderByWithAggregationInput | sys_user_deptOrderByWithAggregationInput[]
    by: Sys_user_deptScalarFieldEnum[] | Sys_user_deptScalarFieldEnum
    having?: sys_user_deptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_user_deptCountAggregateInputType | true
    _avg?: Sys_user_deptAvgAggregateInputType
    _sum?: Sys_user_deptSumAggregateInputType
    _min?: Sys_user_deptMinAggregateInputType
    _max?: Sys_user_deptMaxAggregateInputType
  }

  export type Sys_user_deptGroupByOutputType = {
    id: string
    user_id: string
    dept_id: string
    tenant_id: string
    is_primary: number
    created_at: Date
    _count: Sys_user_deptCountAggregateOutputType | null
    _avg: Sys_user_deptAvgAggregateOutputType | null
    _sum: Sys_user_deptSumAggregateOutputType | null
    _min: Sys_user_deptMinAggregateOutputType | null
    _max: Sys_user_deptMaxAggregateOutputType | null
  }

  type GetSys_user_deptGroupByPayload<T extends sys_user_deptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_user_deptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_user_deptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_user_deptGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_user_deptGroupByOutputType[P]>
        }
      >
    >


  export type sys_user_deptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    dept_id?: boolean
    tenant_id?: boolean
    is_primary?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_dept"]>

  export type sys_user_deptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    dept_id?: boolean
    tenant_id?: boolean
    is_primary?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_dept"]>

  export type sys_user_deptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    dept_id?: boolean
    tenant_id?: boolean
    is_primary?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_user_dept"]>

  export type sys_user_deptSelectScalar = {
    id?: boolean
    user_id?: boolean
    dept_id?: boolean
    tenant_id?: boolean
    is_primary?: boolean
    created_at?: boolean
  }

  export type sys_user_deptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "dept_id" | "tenant_id" | "is_primary" | "created_at", ExtArgs["result"]["sys_user_dept"]>

  export type $sys_user_deptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_user_dept"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      dept_id: string
      tenant_id: string
      is_primary: number
      created_at: Date
    }, ExtArgs["result"]["sys_user_dept"]>
    composites: {}
  }

  type sys_user_deptGetPayload<S extends boolean | null | undefined | sys_user_deptDefaultArgs> = $Result.GetResult<Prisma.$sys_user_deptPayload, S>

  type sys_user_deptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_user_deptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_user_deptCountAggregateInputType | true
    }

  export interface sys_user_deptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_user_dept'], meta: { name: 'sys_user_dept' } }
    /**
     * Find zero or one Sys_user_dept that matches the filter.
     * @param {sys_user_deptFindUniqueArgs} args - Arguments to find a Sys_user_dept
     * @example
     * // Get one Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_user_deptFindUniqueArgs>(args: SelectSubset<T, sys_user_deptFindUniqueArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_user_dept that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_user_deptFindUniqueOrThrowArgs} args - Arguments to find a Sys_user_dept
     * @example
     * // Get one Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_user_deptFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_user_deptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user_dept that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptFindFirstArgs} args - Arguments to find a Sys_user_dept
     * @example
     * // Get one Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_user_deptFindFirstArgs>(args?: SelectSubset<T, sys_user_deptFindFirstArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_user_dept that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptFindFirstOrThrowArgs} args - Arguments to find a Sys_user_dept
     * @example
     * // Get one Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_user_deptFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_user_deptFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_user_depts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_user_depts
     * const sys_user_depts = await prisma.sys_user_dept.findMany()
     * 
     * // Get first 10 Sys_user_depts
     * const sys_user_depts = await prisma.sys_user_dept.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sys_user_deptWithIdOnly = await prisma.sys_user_dept.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sys_user_deptFindManyArgs>(args?: SelectSubset<T, sys_user_deptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_user_dept.
     * @param {sys_user_deptCreateArgs} args - Arguments to create a Sys_user_dept.
     * @example
     * // Create one Sys_user_dept
     * const Sys_user_dept = await prisma.sys_user_dept.create({
     *   data: {
     *     // ... data to create a Sys_user_dept
     *   }
     * })
     * 
     */
    create<T extends sys_user_deptCreateArgs>(args: SelectSubset<T, sys_user_deptCreateArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_user_depts.
     * @param {sys_user_deptCreateManyArgs} args - Arguments to create many Sys_user_depts.
     * @example
     * // Create many Sys_user_depts
     * const sys_user_dept = await prisma.sys_user_dept.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_user_deptCreateManyArgs>(args?: SelectSubset<T, sys_user_deptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_user_depts and returns the data saved in the database.
     * @param {sys_user_deptCreateManyAndReturnArgs} args - Arguments to create many Sys_user_depts.
     * @example
     * // Create many Sys_user_depts
     * const sys_user_dept = await prisma.sys_user_dept.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_user_depts and only return the `id`
     * const sys_user_deptWithIdOnly = await prisma.sys_user_dept.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_user_deptCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_user_deptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_user_dept.
     * @param {sys_user_deptDeleteArgs} args - Arguments to delete one Sys_user_dept.
     * @example
     * // Delete one Sys_user_dept
     * const Sys_user_dept = await prisma.sys_user_dept.delete({
     *   where: {
     *     // ... filter to delete one Sys_user_dept
     *   }
     * })
     * 
     */
    delete<T extends sys_user_deptDeleteArgs>(args: SelectSubset<T, sys_user_deptDeleteArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_user_dept.
     * @param {sys_user_deptUpdateArgs} args - Arguments to update one Sys_user_dept.
     * @example
     * // Update one Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_user_deptUpdateArgs>(args: SelectSubset<T, sys_user_deptUpdateArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_user_depts.
     * @param {sys_user_deptDeleteManyArgs} args - Arguments to filter Sys_user_depts to delete.
     * @example
     * // Delete a few Sys_user_depts
     * const { count } = await prisma.sys_user_dept.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_user_deptDeleteManyArgs>(args?: SelectSubset<T, sys_user_deptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_user_depts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_user_depts
     * const sys_user_dept = await prisma.sys_user_dept.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_user_deptUpdateManyArgs>(args: SelectSubset<T, sys_user_deptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_user_depts and returns the data updated in the database.
     * @param {sys_user_deptUpdateManyAndReturnArgs} args - Arguments to update many Sys_user_depts.
     * @example
     * // Update many Sys_user_depts
     * const sys_user_dept = await prisma.sys_user_dept.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_user_depts and only return the `id`
     * const sys_user_deptWithIdOnly = await prisma.sys_user_dept.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_user_deptUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_user_deptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_user_dept.
     * @param {sys_user_deptUpsertArgs} args - Arguments to update or create a Sys_user_dept.
     * @example
     * // Update or create a Sys_user_dept
     * const sys_user_dept = await prisma.sys_user_dept.upsert({
     *   create: {
     *     // ... data to create a Sys_user_dept
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_user_dept we want to update
     *   }
     * })
     */
    upsert<T extends sys_user_deptUpsertArgs>(args: SelectSubset<T, sys_user_deptUpsertArgs<ExtArgs>>): Prisma__sys_user_deptClient<$Result.GetResult<Prisma.$sys_user_deptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_user_depts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptCountArgs} args - Arguments to filter Sys_user_depts to count.
     * @example
     * // Count the number of Sys_user_depts
     * const count = await prisma.sys_user_dept.count({
     *   where: {
     *     // ... the filter for the Sys_user_depts we want to count
     *   }
     * })
    **/
    count<T extends sys_user_deptCountArgs>(
      args?: Subset<T, sys_user_deptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_user_deptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_user_dept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_user_deptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_user_deptAggregateArgs>(args: Subset<T, Sys_user_deptAggregateArgs>): Prisma.PrismaPromise<GetSys_user_deptAggregateType<T>>

    /**
     * Group by Sys_user_dept.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_user_deptGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_user_deptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_user_deptGroupByArgs['orderBy'] }
        : { orderBy?: sys_user_deptGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_user_deptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_user_deptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_user_dept model
   */
  readonly fields: sys_user_deptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_user_dept.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_user_deptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_user_dept model
   */
  interface sys_user_deptFieldRefs {
    readonly id: FieldRef<"sys_user_dept", 'String'>
    readonly user_id: FieldRef<"sys_user_dept", 'String'>
    readonly dept_id: FieldRef<"sys_user_dept", 'String'>
    readonly tenant_id: FieldRef<"sys_user_dept", 'String'>
    readonly is_primary: FieldRef<"sys_user_dept", 'Int'>
    readonly created_at: FieldRef<"sys_user_dept", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_user_dept findUnique
   */
  export type sys_user_deptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_dept to fetch.
     */
    where: sys_user_deptWhereUniqueInput
  }

  /**
   * sys_user_dept findUniqueOrThrow
   */
  export type sys_user_deptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_dept to fetch.
     */
    where: sys_user_deptWhereUniqueInput
  }

  /**
   * sys_user_dept findFirst
   */
  export type sys_user_deptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_dept to fetch.
     */
    where?: sys_user_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_depts to fetch.
     */
    orderBy?: sys_user_deptOrderByWithRelationInput | sys_user_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_user_depts.
     */
    cursor?: sys_user_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_depts.
     */
    distinct?: Sys_user_deptScalarFieldEnum | Sys_user_deptScalarFieldEnum[]
  }

  /**
   * sys_user_dept findFirstOrThrow
   */
  export type sys_user_deptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_dept to fetch.
     */
    where?: sys_user_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_depts to fetch.
     */
    orderBy?: sys_user_deptOrderByWithRelationInput | sys_user_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_user_depts.
     */
    cursor?: sys_user_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_depts.
     */
    distinct?: Sys_user_deptScalarFieldEnum | Sys_user_deptScalarFieldEnum[]
  }

  /**
   * sys_user_dept findMany
   */
  export type sys_user_deptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter, which sys_user_depts to fetch.
     */
    where?: sys_user_deptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_user_depts to fetch.
     */
    orderBy?: sys_user_deptOrderByWithRelationInput | sys_user_deptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_user_depts.
     */
    cursor?: sys_user_deptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_user_depts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_user_depts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_user_depts.
     */
    distinct?: Sys_user_deptScalarFieldEnum | Sys_user_deptScalarFieldEnum[]
  }

  /**
   * sys_user_dept create
   */
  export type sys_user_deptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_user_dept.
     */
    data: XOR<sys_user_deptCreateInput, sys_user_deptUncheckedCreateInput>
  }

  /**
   * sys_user_dept createMany
   */
  export type sys_user_deptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_user_depts.
     */
    data: sys_user_deptCreateManyInput | sys_user_deptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user_dept createManyAndReturn
   */
  export type sys_user_deptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * The data used to create many sys_user_depts.
     */
    data: sys_user_deptCreateManyInput | sys_user_deptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_user_dept update
   */
  export type sys_user_deptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_user_dept.
     */
    data: XOR<sys_user_deptUpdateInput, sys_user_deptUncheckedUpdateInput>
    /**
     * Choose, which sys_user_dept to update.
     */
    where: sys_user_deptWhereUniqueInput
  }

  /**
   * sys_user_dept updateMany
   */
  export type sys_user_deptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_user_depts.
     */
    data: XOR<sys_user_deptUpdateManyMutationInput, sys_user_deptUncheckedUpdateManyInput>
    /**
     * Filter which sys_user_depts to update
     */
    where?: sys_user_deptWhereInput
    /**
     * Limit how many sys_user_depts to update.
     */
    limit?: number
  }

  /**
   * sys_user_dept updateManyAndReturn
   */
  export type sys_user_deptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * The data used to update sys_user_depts.
     */
    data: XOR<sys_user_deptUpdateManyMutationInput, sys_user_deptUncheckedUpdateManyInput>
    /**
     * Filter which sys_user_depts to update
     */
    where?: sys_user_deptWhereInput
    /**
     * Limit how many sys_user_depts to update.
     */
    limit?: number
  }

  /**
   * sys_user_dept upsert
   */
  export type sys_user_deptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_user_dept to update in case it exists.
     */
    where: sys_user_deptWhereUniqueInput
    /**
     * In case the sys_user_dept found by the `where` argument doesn't exist, create a new sys_user_dept with this data.
     */
    create: XOR<sys_user_deptCreateInput, sys_user_deptUncheckedCreateInput>
    /**
     * In case the sys_user_dept was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_user_deptUpdateInput, sys_user_deptUncheckedUpdateInput>
  }

  /**
   * sys_user_dept delete
   */
  export type sys_user_deptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
    /**
     * Filter which sys_user_dept to delete.
     */
    where: sys_user_deptWhereUniqueInput
  }

  /**
   * sys_user_dept deleteMany
   */
  export type sys_user_deptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_user_depts to delete
     */
    where?: sys_user_deptWhereInput
    /**
     * Limit how many sys_user_depts to delete.
     */
    limit?: number
  }

  /**
   * sys_user_dept without action
   */
  export type sys_user_deptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_user_dept
     */
    select?: sys_user_deptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_user_dept
     */
    omit?: sys_user_deptOmit<ExtArgs> | null
  }


  /**
   * Model sys_role_menu
   */

  export type AggregateSys_role_menu = {
    _count: Sys_role_menuCountAggregateOutputType | null
    _min: Sys_role_menuMinAggregateOutputType | null
    _max: Sys_role_menuMaxAggregateOutputType | null
  }

  export type Sys_role_menuMinAggregateOutputType = {
    id: string | null
    role_id: string | null
    menu_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_role_menuMaxAggregateOutputType = {
    id: string | null
    role_id: string | null
    menu_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_role_menuCountAggregateOutputType = {
    id: number
    role_id: number
    menu_id: number
    tenant_id: number
    created_at: number
    _all: number
  }


  export type Sys_role_menuMinAggregateInputType = {
    id?: true
    role_id?: true
    menu_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_role_menuMaxAggregateInputType = {
    id?: true
    role_id?: true
    menu_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_role_menuCountAggregateInputType = {
    id?: true
    role_id?: true
    menu_id?: true
    tenant_id?: true
    created_at?: true
    _all?: true
  }

  export type Sys_role_menuAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_role_menu to aggregate.
     */
    where?: sys_role_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_menus to fetch.
     */
    orderBy?: sys_role_menuOrderByWithRelationInput | sys_role_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_role_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_role_menus
    **/
    _count?: true | Sys_role_menuCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_role_menuMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_role_menuMaxAggregateInputType
  }

  export type GetSys_role_menuAggregateType<T extends Sys_role_menuAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_role_menu]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_role_menu[P]>
      : GetScalarType<T[P], AggregateSys_role_menu[P]>
  }




  export type sys_role_menuGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_role_menuWhereInput
    orderBy?: sys_role_menuOrderByWithAggregationInput | sys_role_menuOrderByWithAggregationInput[]
    by: Sys_role_menuScalarFieldEnum[] | Sys_role_menuScalarFieldEnum
    having?: sys_role_menuScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_role_menuCountAggregateInputType | true
    _min?: Sys_role_menuMinAggregateInputType
    _max?: Sys_role_menuMaxAggregateInputType
  }

  export type Sys_role_menuGroupByOutputType = {
    id: string
    role_id: string
    menu_id: string
    tenant_id: string
    created_at: Date
    _count: Sys_role_menuCountAggregateOutputType | null
    _min: Sys_role_menuMinAggregateOutputType | null
    _max: Sys_role_menuMaxAggregateOutputType | null
  }

  type GetSys_role_menuGroupByPayload<T extends sys_role_menuGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_role_menuGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_role_menuGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_role_menuGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_role_menuGroupByOutputType[P]>
        }
      >
    >


  export type sys_role_menuSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    menu_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_menu"]>

  export type sys_role_menuSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    menu_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_menu"]>

  export type sys_role_menuSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    menu_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_menu"]>

  export type sys_role_menuSelectScalar = {
    id?: boolean
    role_id?: boolean
    menu_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }

  export type sys_role_menuOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "role_id" | "menu_id" | "tenant_id" | "created_at", ExtArgs["result"]["sys_role_menu"]>

  export type $sys_role_menuPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_role_menu"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      role_id: string
      menu_id: string
      tenant_id: string
      created_at: Date
    }, ExtArgs["result"]["sys_role_menu"]>
    composites: {}
  }

  type sys_role_menuGetPayload<S extends boolean | null | undefined | sys_role_menuDefaultArgs> = $Result.GetResult<Prisma.$sys_role_menuPayload, S>

  type sys_role_menuCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_role_menuFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_role_menuCountAggregateInputType | true
    }

  export interface sys_role_menuDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_role_menu'], meta: { name: 'sys_role_menu' } }
    /**
     * Find zero or one Sys_role_menu that matches the filter.
     * @param {sys_role_menuFindUniqueArgs} args - Arguments to find a Sys_role_menu
     * @example
     * // Get one Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_role_menuFindUniqueArgs>(args: SelectSubset<T, sys_role_menuFindUniqueArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_role_menu that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_role_menuFindUniqueOrThrowArgs} args - Arguments to find a Sys_role_menu
     * @example
     * // Get one Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_role_menuFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_role_menuFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role_menu that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuFindFirstArgs} args - Arguments to find a Sys_role_menu
     * @example
     * // Get one Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_role_menuFindFirstArgs>(args?: SelectSubset<T, sys_role_menuFindFirstArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role_menu that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuFindFirstOrThrowArgs} args - Arguments to find a Sys_role_menu
     * @example
     * // Get one Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_role_menuFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_role_menuFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_role_menus that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_role_menus
     * const sys_role_menus = await prisma.sys_role_menu.findMany()
     * 
     * // Get first 10 Sys_role_menus
     * const sys_role_menus = await prisma.sys_role_menu.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sys_role_menuWithIdOnly = await prisma.sys_role_menu.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sys_role_menuFindManyArgs>(args?: SelectSubset<T, sys_role_menuFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_role_menu.
     * @param {sys_role_menuCreateArgs} args - Arguments to create a Sys_role_menu.
     * @example
     * // Create one Sys_role_menu
     * const Sys_role_menu = await prisma.sys_role_menu.create({
     *   data: {
     *     // ... data to create a Sys_role_menu
     *   }
     * })
     * 
     */
    create<T extends sys_role_menuCreateArgs>(args: SelectSubset<T, sys_role_menuCreateArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_role_menus.
     * @param {sys_role_menuCreateManyArgs} args - Arguments to create many Sys_role_menus.
     * @example
     * // Create many Sys_role_menus
     * const sys_role_menu = await prisma.sys_role_menu.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_role_menuCreateManyArgs>(args?: SelectSubset<T, sys_role_menuCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_role_menus and returns the data saved in the database.
     * @param {sys_role_menuCreateManyAndReturnArgs} args - Arguments to create many Sys_role_menus.
     * @example
     * // Create many Sys_role_menus
     * const sys_role_menu = await prisma.sys_role_menu.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_role_menus and only return the `id`
     * const sys_role_menuWithIdOnly = await prisma.sys_role_menu.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_role_menuCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_role_menuCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_role_menu.
     * @param {sys_role_menuDeleteArgs} args - Arguments to delete one Sys_role_menu.
     * @example
     * // Delete one Sys_role_menu
     * const Sys_role_menu = await prisma.sys_role_menu.delete({
     *   where: {
     *     // ... filter to delete one Sys_role_menu
     *   }
     * })
     * 
     */
    delete<T extends sys_role_menuDeleteArgs>(args: SelectSubset<T, sys_role_menuDeleteArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_role_menu.
     * @param {sys_role_menuUpdateArgs} args - Arguments to update one Sys_role_menu.
     * @example
     * // Update one Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_role_menuUpdateArgs>(args: SelectSubset<T, sys_role_menuUpdateArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_role_menus.
     * @param {sys_role_menuDeleteManyArgs} args - Arguments to filter Sys_role_menus to delete.
     * @example
     * // Delete a few Sys_role_menus
     * const { count } = await prisma.sys_role_menu.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_role_menuDeleteManyArgs>(args?: SelectSubset<T, sys_role_menuDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_role_menus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_role_menus
     * const sys_role_menu = await prisma.sys_role_menu.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_role_menuUpdateManyArgs>(args: SelectSubset<T, sys_role_menuUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_role_menus and returns the data updated in the database.
     * @param {sys_role_menuUpdateManyAndReturnArgs} args - Arguments to update many Sys_role_menus.
     * @example
     * // Update many Sys_role_menus
     * const sys_role_menu = await prisma.sys_role_menu.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_role_menus and only return the `id`
     * const sys_role_menuWithIdOnly = await prisma.sys_role_menu.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_role_menuUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_role_menuUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_role_menu.
     * @param {sys_role_menuUpsertArgs} args - Arguments to update or create a Sys_role_menu.
     * @example
     * // Update or create a Sys_role_menu
     * const sys_role_menu = await prisma.sys_role_menu.upsert({
     *   create: {
     *     // ... data to create a Sys_role_menu
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_role_menu we want to update
     *   }
     * })
     */
    upsert<T extends sys_role_menuUpsertArgs>(args: SelectSubset<T, sys_role_menuUpsertArgs<ExtArgs>>): Prisma__sys_role_menuClient<$Result.GetResult<Prisma.$sys_role_menuPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_role_menus.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuCountArgs} args - Arguments to filter Sys_role_menus to count.
     * @example
     * // Count the number of Sys_role_menus
     * const count = await prisma.sys_role_menu.count({
     *   where: {
     *     // ... the filter for the Sys_role_menus we want to count
     *   }
     * })
    **/
    count<T extends sys_role_menuCountArgs>(
      args?: Subset<T, sys_role_menuCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_role_menuCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_role_menu.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_role_menuAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_role_menuAggregateArgs>(args: Subset<T, Sys_role_menuAggregateArgs>): Prisma.PrismaPromise<GetSys_role_menuAggregateType<T>>

    /**
     * Group by Sys_role_menu.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_menuGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_role_menuGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_role_menuGroupByArgs['orderBy'] }
        : { orderBy?: sys_role_menuGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_role_menuGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_role_menuGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_role_menu model
   */
  readonly fields: sys_role_menuFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_role_menu.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_role_menuClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_role_menu model
   */
  interface sys_role_menuFieldRefs {
    readonly id: FieldRef<"sys_role_menu", 'String'>
    readonly role_id: FieldRef<"sys_role_menu", 'String'>
    readonly menu_id: FieldRef<"sys_role_menu", 'String'>
    readonly tenant_id: FieldRef<"sys_role_menu", 'String'>
    readonly created_at: FieldRef<"sys_role_menu", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_role_menu findUnique
   */
  export type sys_role_menuFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_menu to fetch.
     */
    where: sys_role_menuWhereUniqueInput
  }

  /**
   * sys_role_menu findUniqueOrThrow
   */
  export type sys_role_menuFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_menu to fetch.
     */
    where: sys_role_menuWhereUniqueInput
  }

  /**
   * sys_role_menu findFirst
   */
  export type sys_role_menuFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_menu to fetch.
     */
    where?: sys_role_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_menus to fetch.
     */
    orderBy?: sys_role_menuOrderByWithRelationInput | sys_role_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_role_menus.
     */
    cursor?: sys_role_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_menus.
     */
    distinct?: Sys_role_menuScalarFieldEnum | Sys_role_menuScalarFieldEnum[]
  }

  /**
   * sys_role_menu findFirstOrThrow
   */
  export type sys_role_menuFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_menu to fetch.
     */
    where?: sys_role_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_menus to fetch.
     */
    orderBy?: sys_role_menuOrderByWithRelationInput | sys_role_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_role_menus.
     */
    cursor?: sys_role_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_menus.
     */
    distinct?: Sys_role_menuScalarFieldEnum | Sys_role_menuScalarFieldEnum[]
  }

  /**
   * sys_role_menu findMany
   */
  export type sys_role_menuFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_menus to fetch.
     */
    where?: sys_role_menuWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_menus to fetch.
     */
    orderBy?: sys_role_menuOrderByWithRelationInput | sys_role_menuOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_role_menus.
     */
    cursor?: sys_role_menuWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_menus from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_menus.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_menus.
     */
    distinct?: Sys_role_menuScalarFieldEnum | Sys_role_menuScalarFieldEnum[]
  }

  /**
   * sys_role_menu create
   */
  export type sys_role_menuCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_role_menu.
     */
    data: XOR<sys_role_menuCreateInput, sys_role_menuUncheckedCreateInput>
  }

  /**
   * sys_role_menu createMany
   */
  export type sys_role_menuCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_role_menus.
     */
    data: sys_role_menuCreateManyInput | sys_role_menuCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role_menu createManyAndReturn
   */
  export type sys_role_menuCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * The data used to create many sys_role_menus.
     */
    data: sys_role_menuCreateManyInput | sys_role_menuCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role_menu update
   */
  export type sys_role_menuUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_role_menu.
     */
    data: XOR<sys_role_menuUpdateInput, sys_role_menuUncheckedUpdateInput>
    /**
     * Choose, which sys_role_menu to update.
     */
    where: sys_role_menuWhereUniqueInput
  }

  /**
   * sys_role_menu updateMany
   */
  export type sys_role_menuUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_role_menus.
     */
    data: XOR<sys_role_menuUpdateManyMutationInput, sys_role_menuUncheckedUpdateManyInput>
    /**
     * Filter which sys_role_menus to update
     */
    where?: sys_role_menuWhereInput
    /**
     * Limit how many sys_role_menus to update.
     */
    limit?: number
  }

  /**
   * sys_role_menu updateManyAndReturn
   */
  export type sys_role_menuUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * The data used to update sys_role_menus.
     */
    data: XOR<sys_role_menuUpdateManyMutationInput, sys_role_menuUncheckedUpdateManyInput>
    /**
     * Filter which sys_role_menus to update
     */
    where?: sys_role_menuWhereInput
    /**
     * Limit how many sys_role_menus to update.
     */
    limit?: number
  }

  /**
   * sys_role_menu upsert
   */
  export type sys_role_menuUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_role_menu to update in case it exists.
     */
    where: sys_role_menuWhereUniqueInput
    /**
     * In case the sys_role_menu found by the `where` argument doesn't exist, create a new sys_role_menu with this data.
     */
    create: XOR<sys_role_menuCreateInput, sys_role_menuUncheckedCreateInput>
    /**
     * In case the sys_role_menu was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_role_menuUpdateInput, sys_role_menuUncheckedUpdateInput>
  }

  /**
   * sys_role_menu delete
   */
  export type sys_role_menuDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
    /**
     * Filter which sys_role_menu to delete.
     */
    where: sys_role_menuWhereUniqueInput
  }

  /**
   * sys_role_menu deleteMany
   */
  export type sys_role_menuDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_role_menus to delete
     */
    where?: sys_role_menuWhereInput
    /**
     * Limit how many sys_role_menus to delete.
     */
    limit?: number
  }

  /**
   * sys_role_menu without action
   */
  export type sys_role_menuDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_menu
     */
    select?: sys_role_menuSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_menu
     */
    omit?: sys_role_menuOmit<ExtArgs> | null
  }


  /**
   * Model sys_role_permission
   */

  export type AggregateSys_role_permission = {
    _count: Sys_role_permissionCountAggregateOutputType | null
    _min: Sys_role_permissionMinAggregateOutputType | null
    _max: Sys_role_permissionMaxAggregateOutputType | null
  }

  export type Sys_role_permissionMinAggregateOutputType = {
    id: string | null
    role_id: string | null
    perm_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_role_permissionMaxAggregateOutputType = {
    id: string | null
    role_id: string | null
    perm_id: string | null
    tenant_id: string | null
    created_at: Date | null
  }

  export type Sys_role_permissionCountAggregateOutputType = {
    id: number
    role_id: number
    perm_id: number
    tenant_id: number
    created_at: number
    _all: number
  }


  export type Sys_role_permissionMinAggregateInputType = {
    id?: true
    role_id?: true
    perm_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_role_permissionMaxAggregateInputType = {
    id?: true
    role_id?: true
    perm_id?: true
    tenant_id?: true
    created_at?: true
  }

  export type Sys_role_permissionCountAggregateInputType = {
    id?: true
    role_id?: true
    perm_id?: true
    tenant_id?: true
    created_at?: true
    _all?: true
  }

  export type Sys_role_permissionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_role_permission to aggregate.
     */
    where?: sys_role_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_permissions to fetch.
     */
    orderBy?: sys_role_permissionOrderByWithRelationInput | sys_role_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_role_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_role_permissions
    **/
    _count?: true | Sys_role_permissionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_role_permissionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_role_permissionMaxAggregateInputType
  }

  export type GetSys_role_permissionAggregateType<T extends Sys_role_permissionAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_role_permission]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_role_permission[P]>
      : GetScalarType<T[P], AggregateSys_role_permission[P]>
  }




  export type sys_role_permissionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_role_permissionWhereInput
    orderBy?: sys_role_permissionOrderByWithAggregationInput | sys_role_permissionOrderByWithAggregationInput[]
    by: Sys_role_permissionScalarFieldEnum[] | Sys_role_permissionScalarFieldEnum
    having?: sys_role_permissionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_role_permissionCountAggregateInputType | true
    _min?: Sys_role_permissionMinAggregateInputType
    _max?: Sys_role_permissionMaxAggregateInputType
  }

  export type Sys_role_permissionGroupByOutputType = {
    id: string
    role_id: string
    perm_id: string
    tenant_id: string
    created_at: Date
    _count: Sys_role_permissionCountAggregateOutputType | null
    _min: Sys_role_permissionMinAggregateOutputType | null
    _max: Sys_role_permissionMaxAggregateOutputType | null
  }

  type GetSys_role_permissionGroupByPayload<T extends sys_role_permissionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_role_permissionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_role_permissionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_role_permissionGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_role_permissionGroupByOutputType[P]>
        }
      >
    >


  export type sys_role_permissionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    perm_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_permission"]>

  export type sys_role_permissionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    perm_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_permission"]>

  export type sys_role_permissionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    role_id?: boolean
    perm_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["sys_role_permission"]>

  export type sys_role_permissionSelectScalar = {
    id?: boolean
    role_id?: boolean
    perm_id?: boolean
    tenant_id?: boolean
    created_at?: boolean
  }

  export type sys_role_permissionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "role_id" | "perm_id" | "tenant_id" | "created_at", ExtArgs["result"]["sys_role_permission"]>

  export type $sys_role_permissionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_role_permission"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      role_id: string
      perm_id: string
      tenant_id: string
      created_at: Date
    }, ExtArgs["result"]["sys_role_permission"]>
    composites: {}
  }

  type sys_role_permissionGetPayload<S extends boolean | null | undefined | sys_role_permissionDefaultArgs> = $Result.GetResult<Prisma.$sys_role_permissionPayload, S>

  type sys_role_permissionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_role_permissionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_role_permissionCountAggregateInputType | true
    }

  export interface sys_role_permissionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_role_permission'], meta: { name: 'sys_role_permission' } }
    /**
     * Find zero or one Sys_role_permission that matches the filter.
     * @param {sys_role_permissionFindUniqueArgs} args - Arguments to find a Sys_role_permission
     * @example
     * // Get one Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_role_permissionFindUniqueArgs>(args: SelectSubset<T, sys_role_permissionFindUniqueArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_role_permission that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_role_permissionFindUniqueOrThrowArgs} args - Arguments to find a Sys_role_permission
     * @example
     * // Get one Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_role_permissionFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_role_permissionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role_permission that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionFindFirstArgs} args - Arguments to find a Sys_role_permission
     * @example
     * // Get one Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_role_permissionFindFirstArgs>(args?: SelectSubset<T, sys_role_permissionFindFirstArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_role_permission that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionFindFirstOrThrowArgs} args - Arguments to find a Sys_role_permission
     * @example
     * // Get one Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_role_permissionFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_role_permissionFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_role_permissions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_role_permissions
     * const sys_role_permissions = await prisma.sys_role_permission.findMany()
     * 
     * // Get first 10 Sys_role_permissions
     * const sys_role_permissions = await prisma.sys_role_permission.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sys_role_permissionWithIdOnly = await prisma.sys_role_permission.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends sys_role_permissionFindManyArgs>(args?: SelectSubset<T, sys_role_permissionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_role_permission.
     * @param {sys_role_permissionCreateArgs} args - Arguments to create a Sys_role_permission.
     * @example
     * // Create one Sys_role_permission
     * const Sys_role_permission = await prisma.sys_role_permission.create({
     *   data: {
     *     // ... data to create a Sys_role_permission
     *   }
     * })
     * 
     */
    create<T extends sys_role_permissionCreateArgs>(args: SelectSubset<T, sys_role_permissionCreateArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_role_permissions.
     * @param {sys_role_permissionCreateManyArgs} args - Arguments to create many Sys_role_permissions.
     * @example
     * // Create many Sys_role_permissions
     * const sys_role_permission = await prisma.sys_role_permission.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_role_permissionCreateManyArgs>(args?: SelectSubset<T, sys_role_permissionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_role_permissions and returns the data saved in the database.
     * @param {sys_role_permissionCreateManyAndReturnArgs} args - Arguments to create many Sys_role_permissions.
     * @example
     * // Create many Sys_role_permissions
     * const sys_role_permission = await prisma.sys_role_permission.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_role_permissions and only return the `id`
     * const sys_role_permissionWithIdOnly = await prisma.sys_role_permission.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_role_permissionCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_role_permissionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_role_permission.
     * @param {sys_role_permissionDeleteArgs} args - Arguments to delete one Sys_role_permission.
     * @example
     * // Delete one Sys_role_permission
     * const Sys_role_permission = await prisma.sys_role_permission.delete({
     *   where: {
     *     // ... filter to delete one Sys_role_permission
     *   }
     * })
     * 
     */
    delete<T extends sys_role_permissionDeleteArgs>(args: SelectSubset<T, sys_role_permissionDeleteArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_role_permission.
     * @param {sys_role_permissionUpdateArgs} args - Arguments to update one Sys_role_permission.
     * @example
     * // Update one Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_role_permissionUpdateArgs>(args: SelectSubset<T, sys_role_permissionUpdateArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_role_permissions.
     * @param {sys_role_permissionDeleteManyArgs} args - Arguments to filter Sys_role_permissions to delete.
     * @example
     * // Delete a few Sys_role_permissions
     * const { count } = await prisma.sys_role_permission.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_role_permissionDeleteManyArgs>(args?: SelectSubset<T, sys_role_permissionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_role_permissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_role_permissions
     * const sys_role_permission = await prisma.sys_role_permission.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_role_permissionUpdateManyArgs>(args: SelectSubset<T, sys_role_permissionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_role_permissions and returns the data updated in the database.
     * @param {sys_role_permissionUpdateManyAndReturnArgs} args - Arguments to update many Sys_role_permissions.
     * @example
     * // Update many Sys_role_permissions
     * const sys_role_permission = await prisma.sys_role_permission.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_role_permissions and only return the `id`
     * const sys_role_permissionWithIdOnly = await prisma.sys_role_permission.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_role_permissionUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_role_permissionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_role_permission.
     * @param {sys_role_permissionUpsertArgs} args - Arguments to update or create a Sys_role_permission.
     * @example
     * // Update or create a Sys_role_permission
     * const sys_role_permission = await prisma.sys_role_permission.upsert({
     *   create: {
     *     // ... data to create a Sys_role_permission
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_role_permission we want to update
     *   }
     * })
     */
    upsert<T extends sys_role_permissionUpsertArgs>(args: SelectSubset<T, sys_role_permissionUpsertArgs<ExtArgs>>): Prisma__sys_role_permissionClient<$Result.GetResult<Prisma.$sys_role_permissionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_role_permissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionCountArgs} args - Arguments to filter Sys_role_permissions to count.
     * @example
     * // Count the number of Sys_role_permissions
     * const count = await prisma.sys_role_permission.count({
     *   where: {
     *     // ... the filter for the Sys_role_permissions we want to count
     *   }
     * })
    **/
    count<T extends sys_role_permissionCountArgs>(
      args?: Subset<T, sys_role_permissionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_role_permissionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_role_permission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_role_permissionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_role_permissionAggregateArgs>(args: Subset<T, Sys_role_permissionAggregateArgs>): Prisma.PrismaPromise<GetSys_role_permissionAggregateType<T>>

    /**
     * Group by Sys_role_permission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_role_permissionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_role_permissionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_role_permissionGroupByArgs['orderBy'] }
        : { orderBy?: sys_role_permissionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_role_permissionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_role_permissionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_role_permission model
   */
  readonly fields: sys_role_permissionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_role_permission.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_role_permissionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_role_permission model
   */
  interface sys_role_permissionFieldRefs {
    readonly id: FieldRef<"sys_role_permission", 'String'>
    readonly role_id: FieldRef<"sys_role_permission", 'String'>
    readonly perm_id: FieldRef<"sys_role_permission", 'String'>
    readonly tenant_id: FieldRef<"sys_role_permission", 'String'>
    readonly created_at: FieldRef<"sys_role_permission", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_role_permission findUnique
   */
  export type sys_role_permissionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_permission to fetch.
     */
    where: sys_role_permissionWhereUniqueInput
  }

  /**
   * sys_role_permission findUniqueOrThrow
   */
  export type sys_role_permissionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_permission to fetch.
     */
    where: sys_role_permissionWhereUniqueInput
  }

  /**
   * sys_role_permission findFirst
   */
  export type sys_role_permissionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_permission to fetch.
     */
    where?: sys_role_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_permissions to fetch.
     */
    orderBy?: sys_role_permissionOrderByWithRelationInput | sys_role_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_role_permissions.
     */
    cursor?: sys_role_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_permissions.
     */
    distinct?: Sys_role_permissionScalarFieldEnum | Sys_role_permissionScalarFieldEnum[]
  }

  /**
   * sys_role_permission findFirstOrThrow
   */
  export type sys_role_permissionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_permission to fetch.
     */
    where?: sys_role_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_permissions to fetch.
     */
    orderBy?: sys_role_permissionOrderByWithRelationInput | sys_role_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_role_permissions.
     */
    cursor?: sys_role_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_permissions.
     */
    distinct?: Sys_role_permissionScalarFieldEnum | Sys_role_permissionScalarFieldEnum[]
  }

  /**
   * sys_role_permission findMany
   */
  export type sys_role_permissionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter, which sys_role_permissions to fetch.
     */
    where?: sys_role_permissionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_role_permissions to fetch.
     */
    orderBy?: sys_role_permissionOrderByWithRelationInput | sys_role_permissionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_role_permissions.
     */
    cursor?: sys_role_permissionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_role_permissions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_role_permissions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_role_permissions.
     */
    distinct?: Sys_role_permissionScalarFieldEnum | Sys_role_permissionScalarFieldEnum[]
  }

  /**
   * sys_role_permission create
   */
  export type sys_role_permissionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_role_permission.
     */
    data: XOR<sys_role_permissionCreateInput, sys_role_permissionUncheckedCreateInput>
  }

  /**
   * sys_role_permission createMany
   */
  export type sys_role_permissionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_role_permissions.
     */
    data: sys_role_permissionCreateManyInput | sys_role_permissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role_permission createManyAndReturn
   */
  export type sys_role_permissionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * The data used to create many sys_role_permissions.
     */
    data: sys_role_permissionCreateManyInput | sys_role_permissionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_role_permission update
   */
  export type sys_role_permissionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_role_permission.
     */
    data: XOR<sys_role_permissionUpdateInput, sys_role_permissionUncheckedUpdateInput>
    /**
     * Choose, which sys_role_permission to update.
     */
    where: sys_role_permissionWhereUniqueInput
  }

  /**
   * sys_role_permission updateMany
   */
  export type sys_role_permissionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_role_permissions.
     */
    data: XOR<sys_role_permissionUpdateManyMutationInput, sys_role_permissionUncheckedUpdateManyInput>
    /**
     * Filter which sys_role_permissions to update
     */
    where?: sys_role_permissionWhereInput
    /**
     * Limit how many sys_role_permissions to update.
     */
    limit?: number
  }

  /**
   * sys_role_permission updateManyAndReturn
   */
  export type sys_role_permissionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * The data used to update sys_role_permissions.
     */
    data: XOR<sys_role_permissionUpdateManyMutationInput, sys_role_permissionUncheckedUpdateManyInput>
    /**
     * Filter which sys_role_permissions to update
     */
    where?: sys_role_permissionWhereInput
    /**
     * Limit how many sys_role_permissions to update.
     */
    limit?: number
  }

  /**
   * sys_role_permission upsert
   */
  export type sys_role_permissionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_role_permission to update in case it exists.
     */
    where: sys_role_permissionWhereUniqueInput
    /**
     * In case the sys_role_permission found by the `where` argument doesn't exist, create a new sys_role_permission with this data.
     */
    create: XOR<sys_role_permissionCreateInput, sys_role_permissionUncheckedCreateInput>
    /**
     * In case the sys_role_permission was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_role_permissionUpdateInput, sys_role_permissionUncheckedUpdateInput>
  }

  /**
   * sys_role_permission delete
   */
  export type sys_role_permissionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
    /**
     * Filter which sys_role_permission to delete.
     */
    where: sys_role_permissionWhereUniqueInput
  }

  /**
   * sys_role_permission deleteMany
   */
  export type sys_role_permissionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_role_permissions to delete
     */
    where?: sys_role_permissionWhereInput
    /**
     * Limit how many sys_role_permissions to delete.
     */
    limit?: number
  }

  /**
   * sys_role_permission without action
   */
  export type sys_role_permissionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_role_permission
     */
    select?: sys_role_permissionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_role_permission
     */
    omit?: sys_role_permissionOmit<ExtArgs> | null
  }


  /**
   * Model sys_mfa_config
   */

  export type AggregateSys_mfa_config = {
    _count: Sys_mfa_configCountAggregateOutputType | null
    _avg: Sys_mfa_configAvgAggregateOutputType | null
    _sum: Sys_mfa_configSumAggregateOutputType | null
    _min: Sys_mfa_configMinAggregateOutputType | null
    _max: Sys_mfa_configMaxAggregateOutputType | null
  }

  export type Sys_mfa_configAvgAggregateOutputType = {
    enabled: number | null
  }

  export type Sys_mfa_configSumAggregateOutputType = {
    enabled: number | null
  }

  export type Sys_mfa_configMinAggregateOutputType = {
    mfa_id: string | null
    user_id: string | null
    secret: string | null
    enabled: number | null
    backup_codes: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Sys_mfa_configMaxAggregateOutputType = {
    mfa_id: string | null
    user_id: string | null
    secret: string | null
    enabled: number | null
    backup_codes: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Sys_mfa_configCountAggregateOutputType = {
    mfa_id: number
    user_id: number
    secret: number
    enabled: number
    backup_codes: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Sys_mfa_configAvgAggregateInputType = {
    enabled?: true
  }

  export type Sys_mfa_configSumAggregateInputType = {
    enabled?: true
  }

  export type Sys_mfa_configMinAggregateInputType = {
    mfa_id?: true
    user_id?: true
    secret?: true
    enabled?: true
    backup_codes?: true
    created_at?: true
    updated_at?: true
  }

  export type Sys_mfa_configMaxAggregateInputType = {
    mfa_id?: true
    user_id?: true
    secret?: true
    enabled?: true
    backup_codes?: true
    created_at?: true
    updated_at?: true
  }

  export type Sys_mfa_configCountAggregateInputType = {
    mfa_id?: true
    user_id?: true
    secret?: true
    enabled?: true
    backup_codes?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Sys_mfa_configAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_mfa_config to aggregate.
     */
    where?: sys_mfa_configWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_mfa_configs to fetch.
     */
    orderBy?: sys_mfa_configOrderByWithRelationInput | sys_mfa_configOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: sys_mfa_configWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_mfa_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_mfa_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned sys_mfa_configs
    **/
    _count?: true | Sys_mfa_configCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Sys_mfa_configAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Sys_mfa_configSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Sys_mfa_configMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Sys_mfa_configMaxAggregateInputType
  }

  export type GetSys_mfa_configAggregateType<T extends Sys_mfa_configAggregateArgs> = {
        [P in keyof T & keyof AggregateSys_mfa_config]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSys_mfa_config[P]>
      : GetScalarType<T[P], AggregateSys_mfa_config[P]>
  }




  export type sys_mfa_configGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: sys_mfa_configWhereInput
    orderBy?: sys_mfa_configOrderByWithAggregationInput | sys_mfa_configOrderByWithAggregationInput[]
    by: Sys_mfa_configScalarFieldEnum[] | Sys_mfa_configScalarFieldEnum
    having?: sys_mfa_configScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Sys_mfa_configCountAggregateInputType | true
    _avg?: Sys_mfa_configAvgAggregateInputType
    _sum?: Sys_mfa_configSumAggregateInputType
    _min?: Sys_mfa_configMinAggregateInputType
    _max?: Sys_mfa_configMaxAggregateInputType
  }

  export type Sys_mfa_configGroupByOutputType = {
    mfa_id: string
    user_id: string
    secret: string
    enabled: number
    backup_codes: string | null
    created_at: Date
    updated_at: Date
    _count: Sys_mfa_configCountAggregateOutputType | null
    _avg: Sys_mfa_configAvgAggregateOutputType | null
    _sum: Sys_mfa_configSumAggregateOutputType | null
    _min: Sys_mfa_configMinAggregateOutputType | null
    _max: Sys_mfa_configMaxAggregateOutputType | null
  }

  type GetSys_mfa_configGroupByPayload<T extends sys_mfa_configGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Sys_mfa_configGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Sys_mfa_configGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Sys_mfa_configGroupByOutputType[P]>
            : GetScalarType<T[P], Sys_mfa_configGroupByOutputType[P]>
        }
      >
    >


  export type sys_mfa_configSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    mfa_id?: boolean
    user_id?: boolean
    secret?: boolean
    enabled?: boolean
    backup_codes?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["sys_mfa_config"]>

  export type sys_mfa_configSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    mfa_id?: boolean
    user_id?: boolean
    secret?: boolean
    enabled?: boolean
    backup_codes?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["sys_mfa_config"]>

  export type sys_mfa_configSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    mfa_id?: boolean
    user_id?: boolean
    secret?: boolean
    enabled?: boolean
    backup_codes?: boolean
    created_at?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["sys_mfa_config"]>

  export type sys_mfa_configSelectScalar = {
    mfa_id?: boolean
    user_id?: boolean
    secret?: boolean
    enabled?: boolean
    backup_codes?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type sys_mfa_configOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"mfa_id" | "user_id" | "secret" | "enabled" | "backup_codes" | "created_at" | "updated_at", ExtArgs["result"]["sys_mfa_config"]>

  export type $sys_mfa_configPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "sys_mfa_config"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      mfa_id: string
      user_id: string
      secret: string
      enabled: number
      backup_codes: string | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["sys_mfa_config"]>
    composites: {}
  }

  type sys_mfa_configGetPayload<S extends boolean | null | undefined | sys_mfa_configDefaultArgs> = $Result.GetResult<Prisma.$sys_mfa_configPayload, S>

  type sys_mfa_configCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<sys_mfa_configFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Sys_mfa_configCountAggregateInputType | true
    }

  export interface sys_mfa_configDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['sys_mfa_config'], meta: { name: 'sys_mfa_config' } }
    /**
     * Find zero or one Sys_mfa_config that matches the filter.
     * @param {sys_mfa_configFindUniqueArgs} args - Arguments to find a Sys_mfa_config
     * @example
     * // Get one Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends sys_mfa_configFindUniqueArgs>(args: SelectSubset<T, sys_mfa_configFindUniqueArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Sys_mfa_config that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {sys_mfa_configFindUniqueOrThrowArgs} args - Arguments to find a Sys_mfa_config
     * @example
     * // Get one Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends sys_mfa_configFindUniqueOrThrowArgs>(args: SelectSubset<T, sys_mfa_configFindUniqueOrThrowArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_mfa_config that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configFindFirstArgs} args - Arguments to find a Sys_mfa_config
     * @example
     * // Get one Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends sys_mfa_configFindFirstArgs>(args?: SelectSubset<T, sys_mfa_configFindFirstArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Sys_mfa_config that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configFindFirstOrThrowArgs} args - Arguments to find a Sys_mfa_config
     * @example
     * // Get one Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends sys_mfa_configFindFirstOrThrowArgs>(args?: SelectSubset<T, sys_mfa_configFindFirstOrThrowArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sys_mfa_configs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sys_mfa_configs
     * const sys_mfa_configs = await prisma.sys_mfa_config.findMany()
     * 
     * // Get first 10 Sys_mfa_configs
     * const sys_mfa_configs = await prisma.sys_mfa_config.findMany({ take: 10 })
     * 
     * // Only select the `mfa_id`
     * const sys_mfa_configWithMfa_idOnly = await prisma.sys_mfa_config.findMany({ select: { mfa_id: true } })
     * 
     */
    findMany<T extends sys_mfa_configFindManyArgs>(args?: SelectSubset<T, sys_mfa_configFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Sys_mfa_config.
     * @param {sys_mfa_configCreateArgs} args - Arguments to create a Sys_mfa_config.
     * @example
     * // Create one Sys_mfa_config
     * const Sys_mfa_config = await prisma.sys_mfa_config.create({
     *   data: {
     *     // ... data to create a Sys_mfa_config
     *   }
     * })
     * 
     */
    create<T extends sys_mfa_configCreateArgs>(args: SelectSubset<T, sys_mfa_configCreateArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sys_mfa_configs.
     * @param {sys_mfa_configCreateManyArgs} args - Arguments to create many Sys_mfa_configs.
     * @example
     * // Create many Sys_mfa_configs
     * const sys_mfa_config = await prisma.sys_mfa_config.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends sys_mfa_configCreateManyArgs>(args?: SelectSubset<T, sys_mfa_configCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sys_mfa_configs and returns the data saved in the database.
     * @param {sys_mfa_configCreateManyAndReturnArgs} args - Arguments to create many Sys_mfa_configs.
     * @example
     * // Create many Sys_mfa_configs
     * const sys_mfa_config = await prisma.sys_mfa_config.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sys_mfa_configs and only return the `mfa_id`
     * const sys_mfa_configWithMfa_idOnly = await prisma.sys_mfa_config.createManyAndReturn({
     *   select: { mfa_id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends sys_mfa_configCreateManyAndReturnArgs>(args?: SelectSubset<T, sys_mfa_configCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Sys_mfa_config.
     * @param {sys_mfa_configDeleteArgs} args - Arguments to delete one Sys_mfa_config.
     * @example
     * // Delete one Sys_mfa_config
     * const Sys_mfa_config = await prisma.sys_mfa_config.delete({
     *   where: {
     *     // ... filter to delete one Sys_mfa_config
     *   }
     * })
     * 
     */
    delete<T extends sys_mfa_configDeleteArgs>(args: SelectSubset<T, sys_mfa_configDeleteArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Sys_mfa_config.
     * @param {sys_mfa_configUpdateArgs} args - Arguments to update one Sys_mfa_config.
     * @example
     * // Update one Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends sys_mfa_configUpdateArgs>(args: SelectSubset<T, sys_mfa_configUpdateArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sys_mfa_configs.
     * @param {sys_mfa_configDeleteManyArgs} args - Arguments to filter Sys_mfa_configs to delete.
     * @example
     * // Delete a few Sys_mfa_configs
     * const { count } = await prisma.sys_mfa_config.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends sys_mfa_configDeleteManyArgs>(args?: SelectSubset<T, sys_mfa_configDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_mfa_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sys_mfa_configs
     * const sys_mfa_config = await prisma.sys_mfa_config.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends sys_mfa_configUpdateManyArgs>(args: SelectSubset<T, sys_mfa_configUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sys_mfa_configs and returns the data updated in the database.
     * @param {sys_mfa_configUpdateManyAndReturnArgs} args - Arguments to update many Sys_mfa_configs.
     * @example
     * // Update many Sys_mfa_configs
     * const sys_mfa_config = await prisma.sys_mfa_config.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sys_mfa_configs and only return the `mfa_id`
     * const sys_mfa_configWithMfa_idOnly = await prisma.sys_mfa_config.updateManyAndReturn({
     *   select: { mfa_id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends sys_mfa_configUpdateManyAndReturnArgs>(args: SelectSubset<T, sys_mfa_configUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Sys_mfa_config.
     * @param {sys_mfa_configUpsertArgs} args - Arguments to update or create a Sys_mfa_config.
     * @example
     * // Update or create a Sys_mfa_config
     * const sys_mfa_config = await prisma.sys_mfa_config.upsert({
     *   create: {
     *     // ... data to create a Sys_mfa_config
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Sys_mfa_config we want to update
     *   }
     * })
     */
    upsert<T extends sys_mfa_configUpsertArgs>(args: SelectSubset<T, sys_mfa_configUpsertArgs<ExtArgs>>): Prisma__sys_mfa_configClient<$Result.GetResult<Prisma.$sys_mfa_configPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sys_mfa_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configCountArgs} args - Arguments to filter Sys_mfa_configs to count.
     * @example
     * // Count the number of Sys_mfa_configs
     * const count = await prisma.sys_mfa_config.count({
     *   where: {
     *     // ... the filter for the Sys_mfa_configs we want to count
     *   }
     * })
    **/
    count<T extends sys_mfa_configCountArgs>(
      args?: Subset<T, sys_mfa_configCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Sys_mfa_configCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Sys_mfa_config.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Sys_mfa_configAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Sys_mfa_configAggregateArgs>(args: Subset<T, Sys_mfa_configAggregateArgs>): Prisma.PrismaPromise<GetSys_mfa_configAggregateType<T>>

    /**
     * Group by Sys_mfa_config.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {sys_mfa_configGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends sys_mfa_configGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: sys_mfa_configGroupByArgs['orderBy'] }
        : { orderBy?: sys_mfa_configGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, sys_mfa_configGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSys_mfa_configGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the sys_mfa_config model
   */
  readonly fields: sys_mfa_configFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for sys_mfa_config.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__sys_mfa_configClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the sys_mfa_config model
   */
  interface sys_mfa_configFieldRefs {
    readonly mfa_id: FieldRef<"sys_mfa_config", 'String'>
    readonly user_id: FieldRef<"sys_mfa_config", 'String'>
    readonly secret: FieldRef<"sys_mfa_config", 'String'>
    readonly enabled: FieldRef<"sys_mfa_config", 'Int'>
    readonly backup_codes: FieldRef<"sys_mfa_config", 'String'>
    readonly created_at: FieldRef<"sys_mfa_config", 'DateTime'>
    readonly updated_at: FieldRef<"sys_mfa_config", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * sys_mfa_config findUnique
   */
  export type sys_mfa_configFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter, which sys_mfa_config to fetch.
     */
    where: sys_mfa_configWhereUniqueInput
  }

  /**
   * sys_mfa_config findUniqueOrThrow
   */
  export type sys_mfa_configFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter, which sys_mfa_config to fetch.
     */
    where: sys_mfa_configWhereUniqueInput
  }

  /**
   * sys_mfa_config findFirst
   */
  export type sys_mfa_configFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter, which sys_mfa_config to fetch.
     */
    where?: sys_mfa_configWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_mfa_configs to fetch.
     */
    orderBy?: sys_mfa_configOrderByWithRelationInput | sys_mfa_configOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_mfa_configs.
     */
    cursor?: sys_mfa_configWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_mfa_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_mfa_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_mfa_configs.
     */
    distinct?: Sys_mfa_configScalarFieldEnum | Sys_mfa_configScalarFieldEnum[]
  }

  /**
   * sys_mfa_config findFirstOrThrow
   */
  export type sys_mfa_configFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter, which sys_mfa_config to fetch.
     */
    where?: sys_mfa_configWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_mfa_configs to fetch.
     */
    orderBy?: sys_mfa_configOrderByWithRelationInput | sys_mfa_configOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for sys_mfa_configs.
     */
    cursor?: sys_mfa_configWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_mfa_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_mfa_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_mfa_configs.
     */
    distinct?: Sys_mfa_configScalarFieldEnum | Sys_mfa_configScalarFieldEnum[]
  }

  /**
   * sys_mfa_config findMany
   */
  export type sys_mfa_configFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter, which sys_mfa_configs to fetch.
     */
    where?: sys_mfa_configWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of sys_mfa_configs to fetch.
     */
    orderBy?: sys_mfa_configOrderByWithRelationInput | sys_mfa_configOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing sys_mfa_configs.
     */
    cursor?: sys_mfa_configWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` sys_mfa_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` sys_mfa_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of sys_mfa_configs.
     */
    distinct?: Sys_mfa_configScalarFieldEnum | Sys_mfa_configScalarFieldEnum[]
  }

  /**
   * sys_mfa_config create
   */
  export type sys_mfa_configCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * The data needed to create a sys_mfa_config.
     */
    data: XOR<sys_mfa_configCreateInput, sys_mfa_configUncheckedCreateInput>
  }

  /**
   * sys_mfa_config createMany
   */
  export type sys_mfa_configCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many sys_mfa_configs.
     */
    data: sys_mfa_configCreateManyInput | sys_mfa_configCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_mfa_config createManyAndReturn
   */
  export type sys_mfa_configCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * The data used to create many sys_mfa_configs.
     */
    data: sys_mfa_configCreateManyInput | sys_mfa_configCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * sys_mfa_config update
   */
  export type sys_mfa_configUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * The data needed to update a sys_mfa_config.
     */
    data: XOR<sys_mfa_configUpdateInput, sys_mfa_configUncheckedUpdateInput>
    /**
     * Choose, which sys_mfa_config to update.
     */
    where: sys_mfa_configWhereUniqueInput
  }

  /**
   * sys_mfa_config updateMany
   */
  export type sys_mfa_configUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update sys_mfa_configs.
     */
    data: XOR<sys_mfa_configUpdateManyMutationInput, sys_mfa_configUncheckedUpdateManyInput>
    /**
     * Filter which sys_mfa_configs to update
     */
    where?: sys_mfa_configWhereInput
    /**
     * Limit how many sys_mfa_configs to update.
     */
    limit?: number
  }

  /**
   * sys_mfa_config updateManyAndReturn
   */
  export type sys_mfa_configUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * The data used to update sys_mfa_configs.
     */
    data: XOR<sys_mfa_configUpdateManyMutationInput, sys_mfa_configUncheckedUpdateManyInput>
    /**
     * Filter which sys_mfa_configs to update
     */
    where?: sys_mfa_configWhereInput
    /**
     * Limit how many sys_mfa_configs to update.
     */
    limit?: number
  }

  /**
   * sys_mfa_config upsert
   */
  export type sys_mfa_configUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * The filter to search for the sys_mfa_config to update in case it exists.
     */
    where: sys_mfa_configWhereUniqueInput
    /**
     * In case the sys_mfa_config found by the `where` argument doesn't exist, create a new sys_mfa_config with this data.
     */
    create: XOR<sys_mfa_configCreateInput, sys_mfa_configUncheckedCreateInput>
    /**
     * In case the sys_mfa_config was found with the provided `where` argument, update it with this data.
     */
    update: XOR<sys_mfa_configUpdateInput, sys_mfa_configUncheckedUpdateInput>
  }

  /**
   * sys_mfa_config delete
   */
  export type sys_mfa_configDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
    /**
     * Filter which sys_mfa_config to delete.
     */
    where: sys_mfa_configWhereUniqueInput
  }

  /**
   * sys_mfa_config deleteMany
   */
  export type sys_mfa_configDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which sys_mfa_configs to delete
     */
    where?: sys_mfa_configWhereInput
    /**
     * Limit how many sys_mfa_configs to delete.
     */
    limit?: number
  }

  /**
   * sys_mfa_config without action
   */
  export type sys_mfa_configDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the sys_mfa_config
     */
    select?: sys_mfa_configSelect<ExtArgs> | null
    /**
     * Omit specific fields from the sys_mfa_config
     */
    omit?: sys_mfa_configOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const Sys_tenantScalarFieldEnum: {
    tenant_id: 'tenant_id',
    tenant_code: 'tenant_code',
    tenant_name: 'tenant_name',
    contact_name: 'contact_name',
    contact_phone: 'contact_phone',
    contact_email: 'contact_email',
    status: 'status',
    expire_time: 'expire_time',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_tenantScalarFieldEnum = (typeof Sys_tenantScalarFieldEnum)[keyof typeof Sys_tenantScalarFieldEnum]


  export const Sys_userScalarFieldEnum: {
    user_id: 'user_id',
    tenant_id: 'tenant_id',
    username: 'username',
    password: 'password',
    real_name: 'real_name',
    phone: 'phone',
    email: 'email',
    avatar: 'avatar',
    gender: 'gender',
    status: 'status',
    last_login_ip: 'last_login_ip',
    last_login_time: 'last_login_time',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_userScalarFieldEnum = (typeof Sys_userScalarFieldEnum)[keyof typeof Sys_userScalarFieldEnum]


  export const Sys_roleScalarFieldEnum: {
    role_id: 'role_id',
    tenant_id: 'tenant_id',
    role_code: 'role_code',
    role_name: 'role_name',
    description: 'description',
    sort_order: 'sort_order',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_roleScalarFieldEnum = (typeof Sys_roleScalarFieldEnum)[keyof typeof Sys_roleScalarFieldEnum]


  export const Sys_deptScalarFieldEnum: {
    dept_id: 'dept_id',
    tenant_id: 'tenant_id',
    parent_id: 'parent_id',
    dept_code: 'dept_code',
    dept_name: 'dept_name',
    leader: 'leader',
    phone: 'phone',
    email: 'email',
    sort_order: 'sort_order',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_deptScalarFieldEnum = (typeof Sys_deptScalarFieldEnum)[keyof typeof Sys_deptScalarFieldEnum]


  export const Sys_menuScalarFieldEnum: {
    menu_id: 'menu_id',
    tenant_id: 'tenant_id',
    parent_id: 'parent_id',
    menu_name: 'menu_name',
    menu_type: 'menu_type',
    icon: 'icon',
    path: 'path',
    component: 'component',
    permission: 'permission',
    sort_order: 'sort_order',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_menuScalarFieldEnum = (typeof Sys_menuScalarFieldEnum)[keyof typeof Sys_menuScalarFieldEnum]


  export const Sys_permissionScalarFieldEnum: {
    perm_id: 'perm_id',
    tenant_id: 'tenant_id',
    perm_code: 'perm_code',
    perm_name: 'perm_name',
    resource_type: 'resource_type',
    action: 'action',
    description: 'description',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_permissionScalarFieldEnum = (typeof Sys_permissionScalarFieldEnum)[keyof typeof Sys_permissionScalarFieldEnum]


  export const Sys_dict_typeScalarFieldEnum: {
    dict_type_id: 'dict_type_id',
    tenant_id: 'tenant_id',
    dict_code: 'dict_code',
    dict_name: 'dict_name',
    description: 'description',
    status: 'status',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_dict_typeScalarFieldEnum = (typeof Sys_dict_typeScalarFieldEnum)[keyof typeof Sys_dict_typeScalarFieldEnum]


  export const Sys_dict_dataScalarFieldEnum: {
    dict_data_id: 'dict_data_id',
    tenant_id: 'tenant_id',
    dict_type_id: 'dict_type_id',
    dict_label: 'dict_label',
    dict_value: 'dict_value',
    sort_order: 'sort_order',
    status: 'status',
    remark: 'remark',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_dict_dataScalarFieldEnum = (typeof Sys_dict_dataScalarFieldEnum)[keyof typeof Sys_dict_dataScalarFieldEnum]


  export const Sys_noticeScalarFieldEnum: {
    notice_id: 'notice_id',
    tenant_id: 'tenant_id',
    title: 'title',
    content: 'content',
    notice_type: 'notice_type',
    status: 'status',
    publish_time: 'publish_time',
    created_at: 'created_at',
    updated_at: 'updated_at',
    created_by: 'created_by',
    updated_by: 'updated_by',
    is_deleted: 'is_deleted'
  };

  export type Sys_noticeScalarFieldEnum = (typeof Sys_noticeScalarFieldEnum)[keyof typeof Sys_noticeScalarFieldEnum]


  export const Sys_audit_logScalarFieldEnum: {
    log_id: 'log_id',
    tenant_id: 'tenant_id',
    user_id: 'user_id',
    username: 'username',
    operation: 'operation',
    method: 'method',
    request_url: 'request_url',
    request_params: 'request_params',
    response_data: 'response_data',
    ip_address: 'ip_address',
    user_agent: 'user_agent',
    execute_time: 'execute_time',
    status: 'status',
    error_msg: 'error_msg',
    created_at: 'created_at'
  };

  export type Sys_audit_logScalarFieldEnum = (typeof Sys_audit_logScalarFieldEnum)[keyof typeof Sys_audit_logScalarFieldEnum]


  export const Sys_user_roleScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    role_id: 'role_id',
    tenant_id: 'tenant_id',
    created_at: 'created_at'
  };

  export type Sys_user_roleScalarFieldEnum = (typeof Sys_user_roleScalarFieldEnum)[keyof typeof Sys_user_roleScalarFieldEnum]


  export const Sys_user_deptScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    dept_id: 'dept_id',
    tenant_id: 'tenant_id',
    is_primary: 'is_primary',
    created_at: 'created_at'
  };

  export type Sys_user_deptScalarFieldEnum = (typeof Sys_user_deptScalarFieldEnum)[keyof typeof Sys_user_deptScalarFieldEnum]


  export const Sys_role_menuScalarFieldEnum: {
    id: 'id',
    role_id: 'role_id',
    menu_id: 'menu_id',
    tenant_id: 'tenant_id',
    created_at: 'created_at'
  };

  export type Sys_role_menuScalarFieldEnum = (typeof Sys_role_menuScalarFieldEnum)[keyof typeof Sys_role_menuScalarFieldEnum]


  export const Sys_role_permissionScalarFieldEnum: {
    id: 'id',
    role_id: 'role_id',
    perm_id: 'perm_id',
    tenant_id: 'tenant_id',
    created_at: 'created_at'
  };

  export type Sys_role_permissionScalarFieldEnum = (typeof Sys_role_permissionScalarFieldEnum)[keyof typeof Sys_role_permissionScalarFieldEnum]


  export const Sys_mfa_configScalarFieldEnum: {
    mfa_id: 'mfa_id',
    user_id: 'user_id',
    secret: 'secret',
    enabled: 'enabled',
    backup_codes: 'backup_codes',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Sys_mfa_configScalarFieldEnum = (typeof Sys_mfa_configScalarFieldEnum)[keyof typeof Sys_mfa_configScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type sys_tenantWhereInput = {
    AND?: sys_tenantWhereInput | sys_tenantWhereInput[]
    OR?: sys_tenantWhereInput[]
    NOT?: sys_tenantWhereInput | sys_tenantWhereInput[]
    tenant_id?: UuidFilter<"sys_tenant"> | string
    tenant_code?: StringFilter<"sys_tenant"> | string
    tenant_name?: StringFilter<"sys_tenant"> | string
    contact_name?: StringNullableFilter<"sys_tenant"> | string | null
    contact_phone?: StringNullableFilter<"sys_tenant"> | string | null
    contact_email?: StringNullableFilter<"sys_tenant"> | string | null
    status?: IntFilter<"sys_tenant"> | number
    expire_time?: DateTimeNullableFilter<"sys_tenant"> | Date | string | null
    created_at?: DateTimeFilter<"sys_tenant"> | Date | string
    updated_at?: DateTimeFilter<"sys_tenant"> | Date | string
    created_by?: UuidNullableFilter<"sys_tenant"> | string | null
    updated_by?: UuidNullableFilter<"sys_tenant"> | string | null
    is_deleted?: IntFilter<"sys_tenant"> | number
  }

  export type sys_tenantOrderByWithRelationInput = {
    tenant_id?: SortOrder
    tenant_code?: SortOrder
    tenant_name?: SortOrder
    contact_name?: SortOrderInput | SortOrder
    contact_phone?: SortOrderInput | SortOrder
    contact_email?: SortOrderInput | SortOrder
    status?: SortOrder
    expire_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_tenantWhereUniqueInput = Prisma.AtLeast<{
    tenant_id?: string
    tenant_code?: string
    AND?: sys_tenantWhereInput | sys_tenantWhereInput[]
    OR?: sys_tenantWhereInput[]
    NOT?: sys_tenantWhereInput | sys_tenantWhereInput[]
    tenant_name?: StringFilter<"sys_tenant"> | string
    contact_name?: StringNullableFilter<"sys_tenant"> | string | null
    contact_phone?: StringNullableFilter<"sys_tenant"> | string | null
    contact_email?: StringNullableFilter<"sys_tenant"> | string | null
    status?: IntFilter<"sys_tenant"> | number
    expire_time?: DateTimeNullableFilter<"sys_tenant"> | Date | string | null
    created_at?: DateTimeFilter<"sys_tenant"> | Date | string
    updated_at?: DateTimeFilter<"sys_tenant"> | Date | string
    created_by?: UuidNullableFilter<"sys_tenant"> | string | null
    updated_by?: UuidNullableFilter<"sys_tenant"> | string | null
    is_deleted?: IntFilter<"sys_tenant"> | number
  }, "tenant_id" | "tenant_code">

  export type sys_tenantOrderByWithAggregationInput = {
    tenant_id?: SortOrder
    tenant_code?: SortOrder
    tenant_name?: SortOrder
    contact_name?: SortOrderInput | SortOrder
    contact_phone?: SortOrderInput | SortOrder
    contact_email?: SortOrderInput | SortOrder
    status?: SortOrder
    expire_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_tenantCountOrderByAggregateInput
    _avg?: sys_tenantAvgOrderByAggregateInput
    _max?: sys_tenantMaxOrderByAggregateInput
    _min?: sys_tenantMinOrderByAggregateInput
    _sum?: sys_tenantSumOrderByAggregateInput
  }

  export type sys_tenantScalarWhereWithAggregatesInput = {
    AND?: sys_tenantScalarWhereWithAggregatesInput | sys_tenantScalarWhereWithAggregatesInput[]
    OR?: sys_tenantScalarWhereWithAggregatesInput[]
    NOT?: sys_tenantScalarWhereWithAggregatesInput | sys_tenantScalarWhereWithAggregatesInput[]
    tenant_id?: UuidWithAggregatesFilter<"sys_tenant"> | string
    tenant_code?: StringWithAggregatesFilter<"sys_tenant"> | string
    tenant_name?: StringWithAggregatesFilter<"sys_tenant"> | string
    contact_name?: StringNullableWithAggregatesFilter<"sys_tenant"> | string | null
    contact_phone?: StringNullableWithAggregatesFilter<"sys_tenant"> | string | null
    contact_email?: StringNullableWithAggregatesFilter<"sys_tenant"> | string | null
    status?: IntWithAggregatesFilter<"sys_tenant"> | number
    expire_time?: DateTimeNullableWithAggregatesFilter<"sys_tenant"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_tenant"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_tenant"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_tenant"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_tenant"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_tenant"> | number
  }

  export type sys_userWhereInput = {
    AND?: sys_userWhereInput | sys_userWhereInput[]
    OR?: sys_userWhereInput[]
    NOT?: sys_userWhereInput | sys_userWhereInput[]
    user_id?: UuidFilter<"sys_user"> | string
    tenant_id?: UuidFilter<"sys_user"> | string
    username?: StringFilter<"sys_user"> | string
    password?: StringFilter<"sys_user"> | string
    real_name?: StringNullableFilter<"sys_user"> | string | null
    phone?: StringNullableFilter<"sys_user"> | string | null
    email?: StringNullableFilter<"sys_user"> | string | null
    avatar?: StringNullableFilter<"sys_user"> | string | null
    gender?: IntNullableFilter<"sys_user"> | number | null
    status?: IntFilter<"sys_user"> | number
    last_login_ip?: StringNullableFilter<"sys_user"> | string | null
    last_login_time?: DateTimeNullableFilter<"sys_user"> | Date | string | null
    created_at?: DateTimeFilter<"sys_user"> | Date | string
    updated_at?: DateTimeFilter<"sys_user"> | Date | string
    created_by?: UuidNullableFilter<"sys_user"> | string | null
    updated_by?: UuidNullableFilter<"sys_user"> | string | null
    is_deleted?: IntFilter<"sys_user"> | number
  }

  export type sys_userOrderByWithRelationInput = {
    user_id?: SortOrder
    tenant_id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    real_name?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    status?: SortOrder
    last_login_ip?: SortOrderInput | SortOrder
    last_login_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_userWhereUniqueInput = Prisma.AtLeast<{
    user_id?: string
    tenant_id_username?: sys_userTenant_idUsernameCompoundUniqueInput
    AND?: sys_userWhereInput | sys_userWhereInput[]
    OR?: sys_userWhereInput[]
    NOT?: sys_userWhereInput | sys_userWhereInput[]
    tenant_id?: UuidFilter<"sys_user"> | string
    username?: StringFilter<"sys_user"> | string
    password?: StringFilter<"sys_user"> | string
    real_name?: StringNullableFilter<"sys_user"> | string | null
    phone?: StringNullableFilter<"sys_user"> | string | null
    email?: StringNullableFilter<"sys_user"> | string | null
    avatar?: StringNullableFilter<"sys_user"> | string | null
    gender?: IntNullableFilter<"sys_user"> | number | null
    status?: IntFilter<"sys_user"> | number
    last_login_ip?: StringNullableFilter<"sys_user"> | string | null
    last_login_time?: DateTimeNullableFilter<"sys_user"> | Date | string | null
    created_at?: DateTimeFilter<"sys_user"> | Date | string
    updated_at?: DateTimeFilter<"sys_user"> | Date | string
    created_by?: UuidNullableFilter<"sys_user"> | string | null
    updated_by?: UuidNullableFilter<"sys_user"> | string | null
    is_deleted?: IntFilter<"sys_user"> | number
  }, "user_id" | "tenant_id_username">

  export type sys_userOrderByWithAggregationInput = {
    user_id?: SortOrder
    tenant_id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    real_name?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    status?: SortOrder
    last_login_ip?: SortOrderInput | SortOrder
    last_login_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_userCountOrderByAggregateInput
    _avg?: sys_userAvgOrderByAggregateInput
    _max?: sys_userMaxOrderByAggregateInput
    _min?: sys_userMinOrderByAggregateInput
    _sum?: sys_userSumOrderByAggregateInput
  }

  export type sys_userScalarWhereWithAggregatesInput = {
    AND?: sys_userScalarWhereWithAggregatesInput | sys_userScalarWhereWithAggregatesInput[]
    OR?: sys_userScalarWhereWithAggregatesInput[]
    NOT?: sys_userScalarWhereWithAggregatesInput | sys_userScalarWhereWithAggregatesInput[]
    user_id?: UuidWithAggregatesFilter<"sys_user"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_user"> | string
    username?: StringWithAggregatesFilter<"sys_user"> | string
    password?: StringWithAggregatesFilter<"sys_user"> | string
    real_name?: StringNullableWithAggregatesFilter<"sys_user"> | string | null
    phone?: StringNullableWithAggregatesFilter<"sys_user"> | string | null
    email?: StringNullableWithAggregatesFilter<"sys_user"> | string | null
    avatar?: StringNullableWithAggregatesFilter<"sys_user"> | string | null
    gender?: IntNullableWithAggregatesFilter<"sys_user"> | number | null
    status?: IntWithAggregatesFilter<"sys_user"> | number
    last_login_ip?: StringNullableWithAggregatesFilter<"sys_user"> | string | null
    last_login_time?: DateTimeNullableWithAggregatesFilter<"sys_user"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_user"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_user"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_user"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_user"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_user"> | number
  }

  export type sys_roleWhereInput = {
    AND?: sys_roleWhereInput | sys_roleWhereInput[]
    OR?: sys_roleWhereInput[]
    NOT?: sys_roleWhereInput | sys_roleWhereInput[]
    role_id?: UuidFilter<"sys_role"> | string
    tenant_id?: UuidFilter<"sys_role"> | string
    role_code?: StringFilter<"sys_role"> | string
    role_name?: StringFilter<"sys_role"> | string
    description?: StringNullableFilter<"sys_role"> | string | null
    sort_order?: IntFilter<"sys_role"> | number
    status?: IntFilter<"sys_role"> | number
    created_at?: DateTimeFilter<"sys_role"> | Date | string
    updated_at?: DateTimeFilter<"sys_role"> | Date | string
    created_by?: UuidNullableFilter<"sys_role"> | string | null
    updated_by?: UuidNullableFilter<"sys_role"> | string | null
    is_deleted?: IntFilter<"sys_role"> | number
  }

  export type sys_roleOrderByWithRelationInput = {
    role_id?: SortOrder
    tenant_id?: SortOrder
    role_code?: SortOrder
    role_name?: SortOrder
    description?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_roleWhereUniqueInput = Prisma.AtLeast<{
    role_id?: string
    tenant_id_role_code?: sys_roleTenant_idRole_codeCompoundUniqueInput
    AND?: sys_roleWhereInput | sys_roleWhereInput[]
    OR?: sys_roleWhereInput[]
    NOT?: sys_roleWhereInput | sys_roleWhereInput[]
    tenant_id?: UuidFilter<"sys_role"> | string
    role_code?: StringFilter<"sys_role"> | string
    role_name?: StringFilter<"sys_role"> | string
    description?: StringNullableFilter<"sys_role"> | string | null
    sort_order?: IntFilter<"sys_role"> | number
    status?: IntFilter<"sys_role"> | number
    created_at?: DateTimeFilter<"sys_role"> | Date | string
    updated_at?: DateTimeFilter<"sys_role"> | Date | string
    created_by?: UuidNullableFilter<"sys_role"> | string | null
    updated_by?: UuidNullableFilter<"sys_role"> | string | null
    is_deleted?: IntFilter<"sys_role"> | number
  }, "role_id" | "tenant_id_role_code">

  export type sys_roleOrderByWithAggregationInput = {
    role_id?: SortOrder
    tenant_id?: SortOrder
    role_code?: SortOrder
    role_name?: SortOrder
    description?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_roleCountOrderByAggregateInput
    _avg?: sys_roleAvgOrderByAggregateInput
    _max?: sys_roleMaxOrderByAggregateInput
    _min?: sys_roleMinOrderByAggregateInput
    _sum?: sys_roleSumOrderByAggregateInput
  }

  export type sys_roleScalarWhereWithAggregatesInput = {
    AND?: sys_roleScalarWhereWithAggregatesInput | sys_roleScalarWhereWithAggregatesInput[]
    OR?: sys_roleScalarWhereWithAggregatesInput[]
    NOT?: sys_roleScalarWhereWithAggregatesInput | sys_roleScalarWhereWithAggregatesInput[]
    role_id?: UuidWithAggregatesFilter<"sys_role"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_role"> | string
    role_code?: StringWithAggregatesFilter<"sys_role"> | string
    role_name?: StringWithAggregatesFilter<"sys_role"> | string
    description?: StringNullableWithAggregatesFilter<"sys_role"> | string | null
    sort_order?: IntWithAggregatesFilter<"sys_role"> | number
    status?: IntWithAggregatesFilter<"sys_role"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_role"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_role"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_role"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_role"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_role"> | number
  }

  export type sys_deptWhereInput = {
    AND?: sys_deptWhereInput | sys_deptWhereInput[]
    OR?: sys_deptWhereInput[]
    NOT?: sys_deptWhereInput | sys_deptWhereInput[]
    dept_id?: UuidFilter<"sys_dept"> | string
    tenant_id?: UuidFilter<"sys_dept"> | string
    parent_id?: UuidFilter<"sys_dept"> | string
    dept_code?: StringFilter<"sys_dept"> | string
    dept_name?: StringFilter<"sys_dept"> | string
    leader?: StringNullableFilter<"sys_dept"> | string | null
    phone?: StringNullableFilter<"sys_dept"> | string | null
    email?: StringNullableFilter<"sys_dept"> | string | null
    sort_order?: IntFilter<"sys_dept"> | number
    status?: IntFilter<"sys_dept"> | number
    created_at?: DateTimeFilter<"sys_dept"> | Date | string
    updated_at?: DateTimeFilter<"sys_dept"> | Date | string
    created_by?: UuidNullableFilter<"sys_dept"> | string | null
    updated_by?: UuidNullableFilter<"sys_dept"> | string | null
    is_deleted?: IntFilter<"sys_dept"> | number
  }

  export type sys_deptOrderByWithRelationInput = {
    dept_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    dept_code?: SortOrder
    dept_name?: SortOrder
    leader?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptWhereUniqueInput = Prisma.AtLeast<{
    dept_id?: string
    tenant_id_dept_code?: sys_deptTenant_idDept_codeCompoundUniqueInput
    AND?: sys_deptWhereInput | sys_deptWhereInput[]
    OR?: sys_deptWhereInput[]
    NOT?: sys_deptWhereInput | sys_deptWhereInput[]
    tenant_id?: UuidFilter<"sys_dept"> | string
    parent_id?: UuidFilter<"sys_dept"> | string
    dept_code?: StringFilter<"sys_dept"> | string
    dept_name?: StringFilter<"sys_dept"> | string
    leader?: StringNullableFilter<"sys_dept"> | string | null
    phone?: StringNullableFilter<"sys_dept"> | string | null
    email?: StringNullableFilter<"sys_dept"> | string | null
    sort_order?: IntFilter<"sys_dept"> | number
    status?: IntFilter<"sys_dept"> | number
    created_at?: DateTimeFilter<"sys_dept"> | Date | string
    updated_at?: DateTimeFilter<"sys_dept"> | Date | string
    created_by?: UuidNullableFilter<"sys_dept"> | string | null
    updated_by?: UuidNullableFilter<"sys_dept"> | string | null
    is_deleted?: IntFilter<"sys_dept"> | number
  }, "dept_id" | "tenant_id_dept_code">

  export type sys_deptOrderByWithAggregationInput = {
    dept_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    dept_code?: SortOrder
    dept_name?: SortOrder
    leader?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_deptCountOrderByAggregateInput
    _avg?: sys_deptAvgOrderByAggregateInput
    _max?: sys_deptMaxOrderByAggregateInput
    _min?: sys_deptMinOrderByAggregateInput
    _sum?: sys_deptSumOrderByAggregateInput
  }

  export type sys_deptScalarWhereWithAggregatesInput = {
    AND?: sys_deptScalarWhereWithAggregatesInput | sys_deptScalarWhereWithAggregatesInput[]
    OR?: sys_deptScalarWhereWithAggregatesInput[]
    NOT?: sys_deptScalarWhereWithAggregatesInput | sys_deptScalarWhereWithAggregatesInput[]
    dept_id?: UuidWithAggregatesFilter<"sys_dept"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_dept"> | string
    parent_id?: UuidWithAggregatesFilter<"sys_dept"> | string
    dept_code?: StringWithAggregatesFilter<"sys_dept"> | string
    dept_name?: StringWithAggregatesFilter<"sys_dept"> | string
    leader?: StringNullableWithAggregatesFilter<"sys_dept"> | string | null
    phone?: StringNullableWithAggregatesFilter<"sys_dept"> | string | null
    email?: StringNullableWithAggregatesFilter<"sys_dept"> | string | null
    sort_order?: IntWithAggregatesFilter<"sys_dept"> | number
    status?: IntWithAggregatesFilter<"sys_dept"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_dept"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_dept"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_dept"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_dept"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_dept"> | number
  }

  export type sys_menuWhereInput = {
    AND?: sys_menuWhereInput | sys_menuWhereInput[]
    OR?: sys_menuWhereInput[]
    NOT?: sys_menuWhereInput | sys_menuWhereInput[]
    menu_id?: UuidFilter<"sys_menu"> | string
    tenant_id?: UuidFilter<"sys_menu"> | string
    parent_id?: UuidFilter<"sys_menu"> | string
    menu_name?: StringFilter<"sys_menu"> | string
    menu_type?: IntFilter<"sys_menu"> | number
    icon?: StringNullableFilter<"sys_menu"> | string | null
    path?: StringNullableFilter<"sys_menu"> | string | null
    component?: StringNullableFilter<"sys_menu"> | string | null
    permission?: StringNullableFilter<"sys_menu"> | string | null
    sort_order?: IntFilter<"sys_menu"> | number
    status?: IntFilter<"sys_menu"> | number
    created_at?: DateTimeFilter<"sys_menu"> | Date | string
    updated_at?: DateTimeFilter<"sys_menu"> | Date | string
    created_by?: UuidNullableFilter<"sys_menu"> | string | null
    updated_by?: UuidNullableFilter<"sys_menu"> | string | null
    is_deleted?: IntFilter<"sys_menu"> | number
  }

  export type sys_menuOrderByWithRelationInput = {
    menu_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    menu_name?: SortOrder
    menu_type?: SortOrder
    icon?: SortOrderInput | SortOrder
    path?: SortOrderInput | SortOrder
    component?: SortOrderInput | SortOrder
    permission?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuWhereUniqueInput = Prisma.AtLeast<{
    menu_id?: string
    AND?: sys_menuWhereInput | sys_menuWhereInput[]
    OR?: sys_menuWhereInput[]
    NOT?: sys_menuWhereInput | sys_menuWhereInput[]
    tenant_id?: UuidFilter<"sys_menu"> | string
    parent_id?: UuidFilter<"sys_menu"> | string
    menu_name?: StringFilter<"sys_menu"> | string
    menu_type?: IntFilter<"sys_menu"> | number
    icon?: StringNullableFilter<"sys_menu"> | string | null
    path?: StringNullableFilter<"sys_menu"> | string | null
    component?: StringNullableFilter<"sys_menu"> | string | null
    permission?: StringNullableFilter<"sys_menu"> | string | null
    sort_order?: IntFilter<"sys_menu"> | number
    status?: IntFilter<"sys_menu"> | number
    created_at?: DateTimeFilter<"sys_menu"> | Date | string
    updated_at?: DateTimeFilter<"sys_menu"> | Date | string
    created_by?: UuidNullableFilter<"sys_menu"> | string | null
    updated_by?: UuidNullableFilter<"sys_menu"> | string | null
    is_deleted?: IntFilter<"sys_menu"> | number
  }, "menu_id">

  export type sys_menuOrderByWithAggregationInput = {
    menu_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    menu_name?: SortOrder
    menu_type?: SortOrder
    icon?: SortOrderInput | SortOrder
    path?: SortOrderInput | SortOrder
    component?: SortOrderInput | SortOrder
    permission?: SortOrderInput | SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_menuCountOrderByAggregateInput
    _avg?: sys_menuAvgOrderByAggregateInput
    _max?: sys_menuMaxOrderByAggregateInput
    _min?: sys_menuMinOrderByAggregateInput
    _sum?: sys_menuSumOrderByAggregateInput
  }

  export type sys_menuScalarWhereWithAggregatesInput = {
    AND?: sys_menuScalarWhereWithAggregatesInput | sys_menuScalarWhereWithAggregatesInput[]
    OR?: sys_menuScalarWhereWithAggregatesInput[]
    NOT?: sys_menuScalarWhereWithAggregatesInput | sys_menuScalarWhereWithAggregatesInput[]
    menu_id?: UuidWithAggregatesFilter<"sys_menu"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_menu"> | string
    parent_id?: UuidWithAggregatesFilter<"sys_menu"> | string
    menu_name?: StringWithAggregatesFilter<"sys_menu"> | string
    menu_type?: IntWithAggregatesFilter<"sys_menu"> | number
    icon?: StringNullableWithAggregatesFilter<"sys_menu"> | string | null
    path?: StringNullableWithAggregatesFilter<"sys_menu"> | string | null
    component?: StringNullableWithAggregatesFilter<"sys_menu"> | string | null
    permission?: StringNullableWithAggregatesFilter<"sys_menu"> | string | null
    sort_order?: IntWithAggregatesFilter<"sys_menu"> | number
    status?: IntWithAggregatesFilter<"sys_menu"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_menu"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_menu"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_menu"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_menu"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_menu"> | number
  }

  export type sys_permissionWhereInput = {
    AND?: sys_permissionWhereInput | sys_permissionWhereInput[]
    OR?: sys_permissionWhereInput[]
    NOT?: sys_permissionWhereInput | sys_permissionWhereInput[]
    perm_id?: UuidFilter<"sys_permission"> | string
    tenant_id?: UuidFilter<"sys_permission"> | string
    perm_code?: StringFilter<"sys_permission"> | string
    perm_name?: StringFilter<"sys_permission"> | string
    resource_type?: StringFilter<"sys_permission"> | string
    action?: StringFilter<"sys_permission"> | string
    description?: StringNullableFilter<"sys_permission"> | string | null
    status?: IntFilter<"sys_permission"> | number
    created_at?: DateTimeFilter<"sys_permission"> | Date | string
    updated_at?: DateTimeFilter<"sys_permission"> | Date | string
    created_by?: UuidNullableFilter<"sys_permission"> | string | null
    updated_by?: UuidNullableFilter<"sys_permission"> | string | null
    is_deleted?: IntFilter<"sys_permission"> | number
  }

  export type sys_permissionOrderByWithRelationInput = {
    perm_id?: SortOrder
    tenant_id?: SortOrder
    perm_code?: SortOrder
    perm_name?: SortOrder
    resource_type?: SortOrder
    action?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionWhereUniqueInput = Prisma.AtLeast<{
    perm_id?: string
    tenant_id_perm_code?: sys_permissionTenant_idPerm_codeCompoundUniqueInput
    AND?: sys_permissionWhereInput | sys_permissionWhereInput[]
    OR?: sys_permissionWhereInput[]
    NOT?: sys_permissionWhereInput | sys_permissionWhereInput[]
    tenant_id?: UuidFilter<"sys_permission"> | string
    perm_code?: StringFilter<"sys_permission"> | string
    perm_name?: StringFilter<"sys_permission"> | string
    resource_type?: StringFilter<"sys_permission"> | string
    action?: StringFilter<"sys_permission"> | string
    description?: StringNullableFilter<"sys_permission"> | string | null
    status?: IntFilter<"sys_permission"> | number
    created_at?: DateTimeFilter<"sys_permission"> | Date | string
    updated_at?: DateTimeFilter<"sys_permission"> | Date | string
    created_by?: UuidNullableFilter<"sys_permission"> | string | null
    updated_by?: UuidNullableFilter<"sys_permission"> | string | null
    is_deleted?: IntFilter<"sys_permission"> | number
  }, "perm_id" | "tenant_id_perm_code">

  export type sys_permissionOrderByWithAggregationInput = {
    perm_id?: SortOrder
    tenant_id?: SortOrder
    perm_code?: SortOrder
    perm_name?: SortOrder
    resource_type?: SortOrder
    action?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_permissionCountOrderByAggregateInput
    _avg?: sys_permissionAvgOrderByAggregateInput
    _max?: sys_permissionMaxOrderByAggregateInput
    _min?: sys_permissionMinOrderByAggregateInput
    _sum?: sys_permissionSumOrderByAggregateInput
  }

  export type sys_permissionScalarWhereWithAggregatesInput = {
    AND?: sys_permissionScalarWhereWithAggregatesInput | sys_permissionScalarWhereWithAggregatesInput[]
    OR?: sys_permissionScalarWhereWithAggregatesInput[]
    NOT?: sys_permissionScalarWhereWithAggregatesInput | sys_permissionScalarWhereWithAggregatesInput[]
    perm_id?: UuidWithAggregatesFilter<"sys_permission"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_permission"> | string
    perm_code?: StringWithAggregatesFilter<"sys_permission"> | string
    perm_name?: StringWithAggregatesFilter<"sys_permission"> | string
    resource_type?: StringWithAggregatesFilter<"sys_permission"> | string
    action?: StringWithAggregatesFilter<"sys_permission"> | string
    description?: StringNullableWithAggregatesFilter<"sys_permission"> | string | null
    status?: IntWithAggregatesFilter<"sys_permission"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_permission"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_permission"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_permission"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_permission"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_permission"> | number
  }

  export type sys_dict_typeWhereInput = {
    AND?: sys_dict_typeWhereInput | sys_dict_typeWhereInput[]
    OR?: sys_dict_typeWhereInput[]
    NOT?: sys_dict_typeWhereInput | sys_dict_typeWhereInput[]
    dict_type_id?: UuidFilter<"sys_dict_type"> | string
    tenant_id?: UuidFilter<"sys_dict_type"> | string
    dict_code?: StringFilter<"sys_dict_type"> | string
    dict_name?: StringFilter<"sys_dict_type"> | string
    description?: StringNullableFilter<"sys_dict_type"> | string | null
    status?: IntFilter<"sys_dict_type"> | number
    created_at?: DateTimeFilter<"sys_dict_type"> | Date | string
    updated_at?: DateTimeFilter<"sys_dict_type"> | Date | string
    created_by?: UuidNullableFilter<"sys_dict_type"> | string | null
    updated_by?: UuidNullableFilter<"sys_dict_type"> | string | null
    is_deleted?: IntFilter<"sys_dict_type"> | number
  }

  export type sys_dict_typeOrderByWithRelationInput = {
    dict_type_id?: SortOrder
    tenant_id?: SortOrder
    dict_code?: SortOrder
    dict_name?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeWhereUniqueInput = Prisma.AtLeast<{
    dict_type_id?: string
    tenant_id_dict_code?: sys_dict_typeTenant_idDict_codeCompoundUniqueInput
    AND?: sys_dict_typeWhereInput | sys_dict_typeWhereInput[]
    OR?: sys_dict_typeWhereInput[]
    NOT?: sys_dict_typeWhereInput | sys_dict_typeWhereInput[]
    tenant_id?: UuidFilter<"sys_dict_type"> | string
    dict_code?: StringFilter<"sys_dict_type"> | string
    dict_name?: StringFilter<"sys_dict_type"> | string
    description?: StringNullableFilter<"sys_dict_type"> | string | null
    status?: IntFilter<"sys_dict_type"> | number
    created_at?: DateTimeFilter<"sys_dict_type"> | Date | string
    updated_at?: DateTimeFilter<"sys_dict_type"> | Date | string
    created_by?: UuidNullableFilter<"sys_dict_type"> | string | null
    updated_by?: UuidNullableFilter<"sys_dict_type"> | string | null
    is_deleted?: IntFilter<"sys_dict_type"> | number
  }, "dict_type_id" | "tenant_id_dict_code">

  export type sys_dict_typeOrderByWithAggregationInput = {
    dict_type_id?: SortOrder
    tenant_id?: SortOrder
    dict_code?: SortOrder
    dict_name?: SortOrder
    description?: SortOrderInput | SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_dict_typeCountOrderByAggregateInput
    _avg?: sys_dict_typeAvgOrderByAggregateInput
    _max?: sys_dict_typeMaxOrderByAggregateInput
    _min?: sys_dict_typeMinOrderByAggregateInput
    _sum?: sys_dict_typeSumOrderByAggregateInput
  }

  export type sys_dict_typeScalarWhereWithAggregatesInput = {
    AND?: sys_dict_typeScalarWhereWithAggregatesInput | sys_dict_typeScalarWhereWithAggregatesInput[]
    OR?: sys_dict_typeScalarWhereWithAggregatesInput[]
    NOT?: sys_dict_typeScalarWhereWithAggregatesInput | sys_dict_typeScalarWhereWithAggregatesInput[]
    dict_type_id?: UuidWithAggregatesFilter<"sys_dict_type"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_dict_type"> | string
    dict_code?: StringWithAggregatesFilter<"sys_dict_type"> | string
    dict_name?: StringWithAggregatesFilter<"sys_dict_type"> | string
    description?: StringNullableWithAggregatesFilter<"sys_dict_type"> | string | null
    status?: IntWithAggregatesFilter<"sys_dict_type"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_dict_type"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_dict_type"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_dict_type"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_dict_type"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_dict_type"> | number
  }

  export type sys_dict_dataWhereInput = {
    AND?: sys_dict_dataWhereInput | sys_dict_dataWhereInput[]
    OR?: sys_dict_dataWhereInput[]
    NOT?: sys_dict_dataWhereInput | sys_dict_dataWhereInput[]
    dict_data_id?: UuidFilter<"sys_dict_data"> | string
    tenant_id?: UuidFilter<"sys_dict_data"> | string
    dict_type_id?: UuidFilter<"sys_dict_data"> | string
    dict_label?: StringFilter<"sys_dict_data"> | string
    dict_value?: StringFilter<"sys_dict_data"> | string
    sort_order?: IntFilter<"sys_dict_data"> | number
    status?: IntFilter<"sys_dict_data"> | number
    remark?: StringNullableFilter<"sys_dict_data"> | string | null
    created_at?: DateTimeFilter<"sys_dict_data"> | Date | string
    updated_at?: DateTimeFilter<"sys_dict_data"> | Date | string
    created_by?: UuidNullableFilter<"sys_dict_data"> | string | null
    updated_by?: UuidNullableFilter<"sys_dict_data"> | string | null
    is_deleted?: IntFilter<"sys_dict_data"> | number
  }

  export type sys_dict_dataOrderByWithRelationInput = {
    dict_data_id?: SortOrder
    tenant_id?: SortOrder
    dict_type_id?: SortOrder
    dict_label?: SortOrder
    dict_value?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    remark?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataWhereUniqueInput = Prisma.AtLeast<{
    dict_data_id?: string
    AND?: sys_dict_dataWhereInput | sys_dict_dataWhereInput[]
    OR?: sys_dict_dataWhereInput[]
    NOT?: sys_dict_dataWhereInput | sys_dict_dataWhereInput[]
    tenant_id?: UuidFilter<"sys_dict_data"> | string
    dict_type_id?: UuidFilter<"sys_dict_data"> | string
    dict_label?: StringFilter<"sys_dict_data"> | string
    dict_value?: StringFilter<"sys_dict_data"> | string
    sort_order?: IntFilter<"sys_dict_data"> | number
    status?: IntFilter<"sys_dict_data"> | number
    remark?: StringNullableFilter<"sys_dict_data"> | string | null
    created_at?: DateTimeFilter<"sys_dict_data"> | Date | string
    updated_at?: DateTimeFilter<"sys_dict_data"> | Date | string
    created_by?: UuidNullableFilter<"sys_dict_data"> | string | null
    updated_by?: UuidNullableFilter<"sys_dict_data"> | string | null
    is_deleted?: IntFilter<"sys_dict_data"> | number
  }, "dict_data_id">

  export type sys_dict_dataOrderByWithAggregationInput = {
    dict_data_id?: SortOrder
    tenant_id?: SortOrder
    dict_type_id?: SortOrder
    dict_label?: SortOrder
    dict_value?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    remark?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_dict_dataCountOrderByAggregateInput
    _avg?: sys_dict_dataAvgOrderByAggregateInput
    _max?: sys_dict_dataMaxOrderByAggregateInput
    _min?: sys_dict_dataMinOrderByAggregateInput
    _sum?: sys_dict_dataSumOrderByAggregateInput
  }

  export type sys_dict_dataScalarWhereWithAggregatesInput = {
    AND?: sys_dict_dataScalarWhereWithAggregatesInput | sys_dict_dataScalarWhereWithAggregatesInput[]
    OR?: sys_dict_dataScalarWhereWithAggregatesInput[]
    NOT?: sys_dict_dataScalarWhereWithAggregatesInput | sys_dict_dataScalarWhereWithAggregatesInput[]
    dict_data_id?: UuidWithAggregatesFilter<"sys_dict_data"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_dict_data"> | string
    dict_type_id?: UuidWithAggregatesFilter<"sys_dict_data"> | string
    dict_label?: StringWithAggregatesFilter<"sys_dict_data"> | string
    dict_value?: StringWithAggregatesFilter<"sys_dict_data"> | string
    sort_order?: IntWithAggregatesFilter<"sys_dict_data"> | number
    status?: IntWithAggregatesFilter<"sys_dict_data"> | number
    remark?: StringNullableWithAggregatesFilter<"sys_dict_data"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_dict_data"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_dict_data"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_dict_data"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_dict_data"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_dict_data"> | number
  }

  export type sys_noticeWhereInput = {
    AND?: sys_noticeWhereInput | sys_noticeWhereInput[]
    OR?: sys_noticeWhereInput[]
    NOT?: sys_noticeWhereInput | sys_noticeWhereInput[]
    notice_id?: UuidFilter<"sys_notice"> | string
    tenant_id?: UuidFilter<"sys_notice"> | string
    title?: StringFilter<"sys_notice"> | string
    content?: StringNullableFilter<"sys_notice"> | string | null
    notice_type?: IntFilter<"sys_notice"> | number
    status?: IntFilter<"sys_notice"> | number
    publish_time?: DateTimeNullableFilter<"sys_notice"> | Date | string | null
    created_at?: DateTimeFilter<"sys_notice"> | Date | string
    updated_at?: DateTimeFilter<"sys_notice"> | Date | string
    created_by?: UuidNullableFilter<"sys_notice"> | string | null
    updated_by?: UuidNullableFilter<"sys_notice"> | string | null
    is_deleted?: IntFilter<"sys_notice"> | number
  }

  export type sys_noticeOrderByWithRelationInput = {
    notice_id?: SortOrder
    tenant_id?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    notice_type?: SortOrder
    status?: SortOrder
    publish_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeWhereUniqueInput = Prisma.AtLeast<{
    notice_id?: string
    AND?: sys_noticeWhereInput | sys_noticeWhereInput[]
    OR?: sys_noticeWhereInput[]
    NOT?: sys_noticeWhereInput | sys_noticeWhereInput[]
    tenant_id?: UuidFilter<"sys_notice"> | string
    title?: StringFilter<"sys_notice"> | string
    content?: StringNullableFilter<"sys_notice"> | string | null
    notice_type?: IntFilter<"sys_notice"> | number
    status?: IntFilter<"sys_notice"> | number
    publish_time?: DateTimeNullableFilter<"sys_notice"> | Date | string | null
    created_at?: DateTimeFilter<"sys_notice"> | Date | string
    updated_at?: DateTimeFilter<"sys_notice"> | Date | string
    created_by?: UuidNullableFilter<"sys_notice"> | string | null
    updated_by?: UuidNullableFilter<"sys_notice"> | string | null
    is_deleted?: IntFilter<"sys_notice"> | number
  }, "notice_id">

  export type sys_noticeOrderByWithAggregationInput = {
    notice_id?: SortOrder
    tenant_id?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    notice_type?: SortOrder
    status?: SortOrder
    publish_time?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrderInput | SortOrder
    updated_by?: SortOrderInput | SortOrder
    is_deleted?: SortOrder
    _count?: sys_noticeCountOrderByAggregateInput
    _avg?: sys_noticeAvgOrderByAggregateInput
    _max?: sys_noticeMaxOrderByAggregateInput
    _min?: sys_noticeMinOrderByAggregateInput
    _sum?: sys_noticeSumOrderByAggregateInput
  }

  export type sys_noticeScalarWhereWithAggregatesInput = {
    AND?: sys_noticeScalarWhereWithAggregatesInput | sys_noticeScalarWhereWithAggregatesInput[]
    OR?: sys_noticeScalarWhereWithAggregatesInput[]
    NOT?: sys_noticeScalarWhereWithAggregatesInput | sys_noticeScalarWhereWithAggregatesInput[]
    notice_id?: UuidWithAggregatesFilter<"sys_notice"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_notice"> | string
    title?: StringWithAggregatesFilter<"sys_notice"> | string
    content?: StringNullableWithAggregatesFilter<"sys_notice"> | string | null
    notice_type?: IntWithAggregatesFilter<"sys_notice"> | number
    status?: IntWithAggregatesFilter<"sys_notice"> | number
    publish_time?: DateTimeNullableWithAggregatesFilter<"sys_notice"> | Date | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_notice"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_notice"> | Date | string
    created_by?: UuidNullableWithAggregatesFilter<"sys_notice"> | string | null
    updated_by?: UuidNullableWithAggregatesFilter<"sys_notice"> | string | null
    is_deleted?: IntWithAggregatesFilter<"sys_notice"> | number
  }

  export type sys_audit_logWhereInput = {
    AND?: sys_audit_logWhereInput | sys_audit_logWhereInput[]
    OR?: sys_audit_logWhereInput[]
    NOT?: sys_audit_logWhereInput | sys_audit_logWhereInput[]
    log_id?: UuidFilter<"sys_audit_log"> | string
    tenant_id?: UuidFilter<"sys_audit_log"> | string
    user_id?: UuidNullableFilter<"sys_audit_log"> | string | null
    username?: StringNullableFilter<"sys_audit_log"> | string | null
    operation?: StringFilter<"sys_audit_log"> | string
    method?: StringFilter<"sys_audit_log"> | string
    request_url?: StringFilter<"sys_audit_log"> | string
    request_params?: StringNullableFilter<"sys_audit_log"> | string | null
    response_data?: StringNullableFilter<"sys_audit_log"> | string | null
    ip_address?: StringFilter<"sys_audit_log"> | string
    user_agent?: StringNullableFilter<"sys_audit_log"> | string | null
    execute_time?: IntFilter<"sys_audit_log"> | number
    status?: IntFilter<"sys_audit_log"> | number
    error_msg?: StringNullableFilter<"sys_audit_log"> | string | null
    created_at?: DateTimeFilter<"sys_audit_log"> | Date | string
  }

  export type sys_audit_logOrderByWithRelationInput = {
    log_id?: SortOrder
    tenant_id?: SortOrder
    user_id?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    operation?: SortOrder
    method?: SortOrder
    request_url?: SortOrder
    request_params?: SortOrderInput | SortOrder
    response_data?: SortOrderInput | SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrderInput | SortOrder
    execute_time?: SortOrder
    status?: SortOrder
    error_msg?: SortOrderInput | SortOrder
    created_at?: SortOrder
  }

  export type sys_audit_logWhereUniqueInput = Prisma.AtLeast<{
    log_id?: string
    AND?: sys_audit_logWhereInput | sys_audit_logWhereInput[]
    OR?: sys_audit_logWhereInput[]
    NOT?: sys_audit_logWhereInput | sys_audit_logWhereInput[]
    tenant_id?: UuidFilter<"sys_audit_log"> | string
    user_id?: UuidNullableFilter<"sys_audit_log"> | string | null
    username?: StringNullableFilter<"sys_audit_log"> | string | null
    operation?: StringFilter<"sys_audit_log"> | string
    method?: StringFilter<"sys_audit_log"> | string
    request_url?: StringFilter<"sys_audit_log"> | string
    request_params?: StringNullableFilter<"sys_audit_log"> | string | null
    response_data?: StringNullableFilter<"sys_audit_log"> | string | null
    ip_address?: StringFilter<"sys_audit_log"> | string
    user_agent?: StringNullableFilter<"sys_audit_log"> | string | null
    execute_time?: IntFilter<"sys_audit_log"> | number
    status?: IntFilter<"sys_audit_log"> | number
    error_msg?: StringNullableFilter<"sys_audit_log"> | string | null
    created_at?: DateTimeFilter<"sys_audit_log"> | Date | string
  }, "log_id">

  export type sys_audit_logOrderByWithAggregationInput = {
    log_id?: SortOrder
    tenant_id?: SortOrder
    user_id?: SortOrderInput | SortOrder
    username?: SortOrderInput | SortOrder
    operation?: SortOrder
    method?: SortOrder
    request_url?: SortOrder
    request_params?: SortOrderInput | SortOrder
    response_data?: SortOrderInput | SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrderInput | SortOrder
    execute_time?: SortOrder
    status?: SortOrder
    error_msg?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: sys_audit_logCountOrderByAggregateInput
    _avg?: sys_audit_logAvgOrderByAggregateInput
    _max?: sys_audit_logMaxOrderByAggregateInput
    _min?: sys_audit_logMinOrderByAggregateInput
    _sum?: sys_audit_logSumOrderByAggregateInput
  }

  export type sys_audit_logScalarWhereWithAggregatesInput = {
    AND?: sys_audit_logScalarWhereWithAggregatesInput | sys_audit_logScalarWhereWithAggregatesInput[]
    OR?: sys_audit_logScalarWhereWithAggregatesInput[]
    NOT?: sys_audit_logScalarWhereWithAggregatesInput | sys_audit_logScalarWhereWithAggregatesInput[]
    log_id?: UuidWithAggregatesFilter<"sys_audit_log"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_audit_log"> | string
    user_id?: UuidNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    username?: StringNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    operation?: StringWithAggregatesFilter<"sys_audit_log"> | string
    method?: StringWithAggregatesFilter<"sys_audit_log"> | string
    request_url?: StringWithAggregatesFilter<"sys_audit_log"> | string
    request_params?: StringNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    response_data?: StringNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    ip_address?: StringWithAggregatesFilter<"sys_audit_log"> | string
    user_agent?: StringNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    execute_time?: IntWithAggregatesFilter<"sys_audit_log"> | number
    status?: IntWithAggregatesFilter<"sys_audit_log"> | number
    error_msg?: StringNullableWithAggregatesFilter<"sys_audit_log"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_audit_log"> | Date | string
  }

  export type sys_user_roleWhereInput = {
    AND?: sys_user_roleWhereInput | sys_user_roleWhereInput[]
    OR?: sys_user_roleWhereInput[]
    NOT?: sys_user_roleWhereInput | sys_user_roleWhereInput[]
    id?: UuidFilter<"sys_user_role"> | string
    user_id?: UuidFilter<"sys_user_role"> | string
    role_id?: UuidFilter<"sys_user_role"> | string
    tenant_id?: UuidFilter<"sys_user_role"> | string
    created_at?: DateTimeFilter<"sys_user_role"> | Date | string
  }

  export type sys_user_roleOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    role_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_roleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    user_id_role_id?: sys_user_roleUser_idRole_idCompoundUniqueInput
    AND?: sys_user_roleWhereInput | sys_user_roleWhereInput[]
    OR?: sys_user_roleWhereInput[]
    NOT?: sys_user_roleWhereInput | sys_user_roleWhereInput[]
    user_id?: UuidFilter<"sys_user_role"> | string
    role_id?: UuidFilter<"sys_user_role"> | string
    tenant_id?: UuidFilter<"sys_user_role"> | string
    created_at?: DateTimeFilter<"sys_user_role"> | Date | string
  }, "id" | "user_id_role_id">

  export type sys_user_roleOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    role_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
    _count?: sys_user_roleCountOrderByAggregateInput
    _max?: sys_user_roleMaxOrderByAggregateInput
    _min?: sys_user_roleMinOrderByAggregateInput
  }

  export type sys_user_roleScalarWhereWithAggregatesInput = {
    AND?: sys_user_roleScalarWhereWithAggregatesInput | sys_user_roleScalarWhereWithAggregatesInput[]
    OR?: sys_user_roleScalarWhereWithAggregatesInput[]
    NOT?: sys_user_roleScalarWhereWithAggregatesInput | sys_user_roleScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"sys_user_role"> | string
    user_id?: UuidWithAggregatesFilter<"sys_user_role"> | string
    role_id?: UuidWithAggregatesFilter<"sys_user_role"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_user_role"> | string
    created_at?: DateTimeWithAggregatesFilter<"sys_user_role"> | Date | string
  }

  export type sys_user_deptWhereInput = {
    AND?: sys_user_deptWhereInput | sys_user_deptWhereInput[]
    OR?: sys_user_deptWhereInput[]
    NOT?: sys_user_deptWhereInput | sys_user_deptWhereInput[]
    id?: UuidFilter<"sys_user_dept"> | string
    user_id?: UuidFilter<"sys_user_dept"> | string
    dept_id?: UuidFilter<"sys_user_dept"> | string
    tenant_id?: UuidFilter<"sys_user_dept"> | string
    is_primary?: IntFilter<"sys_user_dept"> | number
    created_at?: DateTimeFilter<"sys_user_dept"> | Date | string
  }

  export type sys_user_deptOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    dept_id?: SortOrder
    tenant_id?: SortOrder
    is_primary?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_deptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    user_id_dept_id?: sys_user_deptUser_idDept_idCompoundUniqueInput
    AND?: sys_user_deptWhereInput | sys_user_deptWhereInput[]
    OR?: sys_user_deptWhereInput[]
    NOT?: sys_user_deptWhereInput | sys_user_deptWhereInput[]
    user_id?: UuidFilter<"sys_user_dept"> | string
    dept_id?: UuidFilter<"sys_user_dept"> | string
    tenant_id?: UuidFilter<"sys_user_dept"> | string
    is_primary?: IntFilter<"sys_user_dept"> | number
    created_at?: DateTimeFilter<"sys_user_dept"> | Date | string
  }, "id" | "user_id_dept_id">

  export type sys_user_deptOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    dept_id?: SortOrder
    tenant_id?: SortOrder
    is_primary?: SortOrder
    created_at?: SortOrder
    _count?: sys_user_deptCountOrderByAggregateInput
    _avg?: sys_user_deptAvgOrderByAggregateInput
    _max?: sys_user_deptMaxOrderByAggregateInput
    _min?: sys_user_deptMinOrderByAggregateInput
    _sum?: sys_user_deptSumOrderByAggregateInput
  }

  export type sys_user_deptScalarWhereWithAggregatesInput = {
    AND?: sys_user_deptScalarWhereWithAggregatesInput | sys_user_deptScalarWhereWithAggregatesInput[]
    OR?: sys_user_deptScalarWhereWithAggregatesInput[]
    NOT?: sys_user_deptScalarWhereWithAggregatesInput | sys_user_deptScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"sys_user_dept"> | string
    user_id?: UuidWithAggregatesFilter<"sys_user_dept"> | string
    dept_id?: UuidWithAggregatesFilter<"sys_user_dept"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_user_dept"> | string
    is_primary?: IntWithAggregatesFilter<"sys_user_dept"> | number
    created_at?: DateTimeWithAggregatesFilter<"sys_user_dept"> | Date | string
  }

  export type sys_role_menuWhereInput = {
    AND?: sys_role_menuWhereInput | sys_role_menuWhereInput[]
    OR?: sys_role_menuWhereInput[]
    NOT?: sys_role_menuWhereInput | sys_role_menuWhereInput[]
    id?: UuidFilter<"sys_role_menu"> | string
    role_id?: UuidFilter<"sys_role_menu"> | string
    menu_id?: UuidFilter<"sys_role_menu"> | string
    tenant_id?: UuidFilter<"sys_role_menu"> | string
    created_at?: DateTimeFilter<"sys_role_menu"> | Date | string
  }

  export type sys_role_menuOrderByWithRelationInput = {
    id?: SortOrder
    role_id?: SortOrder
    menu_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_menuWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    role_id_menu_id?: sys_role_menuRole_idMenu_idCompoundUniqueInput
    AND?: sys_role_menuWhereInput | sys_role_menuWhereInput[]
    OR?: sys_role_menuWhereInput[]
    NOT?: sys_role_menuWhereInput | sys_role_menuWhereInput[]
    role_id?: UuidFilter<"sys_role_menu"> | string
    menu_id?: UuidFilter<"sys_role_menu"> | string
    tenant_id?: UuidFilter<"sys_role_menu"> | string
    created_at?: DateTimeFilter<"sys_role_menu"> | Date | string
  }, "id" | "role_id_menu_id">

  export type sys_role_menuOrderByWithAggregationInput = {
    id?: SortOrder
    role_id?: SortOrder
    menu_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
    _count?: sys_role_menuCountOrderByAggregateInput
    _max?: sys_role_menuMaxOrderByAggregateInput
    _min?: sys_role_menuMinOrderByAggregateInput
  }

  export type sys_role_menuScalarWhereWithAggregatesInput = {
    AND?: sys_role_menuScalarWhereWithAggregatesInput | sys_role_menuScalarWhereWithAggregatesInput[]
    OR?: sys_role_menuScalarWhereWithAggregatesInput[]
    NOT?: sys_role_menuScalarWhereWithAggregatesInput | sys_role_menuScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"sys_role_menu"> | string
    role_id?: UuidWithAggregatesFilter<"sys_role_menu"> | string
    menu_id?: UuidWithAggregatesFilter<"sys_role_menu"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_role_menu"> | string
    created_at?: DateTimeWithAggregatesFilter<"sys_role_menu"> | Date | string
  }

  export type sys_role_permissionWhereInput = {
    AND?: sys_role_permissionWhereInput | sys_role_permissionWhereInput[]
    OR?: sys_role_permissionWhereInput[]
    NOT?: sys_role_permissionWhereInput | sys_role_permissionWhereInput[]
    id?: UuidFilter<"sys_role_permission"> | string
    role_id?: UuidFilter<"sys_role_permission"> | string
    perm_id?: UuidFilter<"sys_role_permission"> | string
    tenant_id?: UuidFilter<"sys_role_permission"> | string
    created_at?: DateTimeFilter<"sys_role_permission"> | Date | string
  }

  export type sys_role_permissionOrderByWithRelationInput = {
    id?: SortOrder
    role_id?: SortOrder
    perm_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_permissionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    role_id_perm_id?: sys_role_permissionRole_idPerm_idCompoundUniqueInput
    AND?: sys_role_permissionWhereInput | sys_role_permissionWhereInput[]
    OR?: sys_role_permissionWhereInput[]
    NOT?: sys_role_permissionWhereInput | sys_role_permissionWhereInput[]
    role_id?: UuidFilter<"sys_role_permission"> | string
    perm_id?: UuidFilter<"sys_role_permission"> | string
    tenant_id?: UuidFilter<"sys_role_permission"> | string
    created_at?: DateTimeFilter<"sys_role_permission"> | Date | string
  }, "id" | "role_id_perm_id">

  export type sys_role_permissionOrderByWithAggregationInput = {
    id?: SortOrder
    role_id?: SortOrder
    perm_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
    _count?: sys_role_permissionCountOrderByAggregateInput
    _max?: sys_role_permissionMaxOrderByAggregateInput
    _min?: sys_role_permissionMinOrderByAggregateInput
  }

  export type sys_role_permissionScalarWhereWithAggregatesInput = {
    AND?: sys_role_permissionScalarWhereWithAggregatesInput | sys_role_permissionScalarWhereWithAggregatesInput[]
    OR?: sys_role_permissionScalarWhereWithAggregatesInput[]
    NOT?: sys_role_permissionScalarWhereWithAggregatesInput | sys_role_permissionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"sys_role_permission"> | string
    role_id?: UuidWithAggregatesFilter<"sys_role_permission"> | string
    perm_id?: UuidWithAggregatesFilter<"sys_role_permission"> | string
    tenant_id?: UuidWithAggregatesFilter<"sys_role_permission"> | string
    created_at?: DateTimeWithAggregatesFilter<"sys_role_permission"> | Date | string
  }

  export type sys_mfa_configWhereInput = {
    AND?: sys_mfa_configWhereInput | sys_mfa_configWhereInput[]
    OR?: sys_mfa_configWhereInput[]
    NOT?: sys_mfa_configWhereInput | sys_mfa_configWhereInput[]
    mfa_id?: UuidFilter<"sys_mfa_config"> | string
    user_id?: UuidFilter<"sys_mfa_config"> | string
    secret?: StringFilter<"sys_mfa_config"> | string
    enabled?: IntFilter<"sys_mfa_config"> | number
    backup_codes?: StringNullableFilter<"sys_mfa_config"> | string | null
    created_at?: DateTimeFilter<"sys_mfa_config"> | Date | string
    updated_at?: DateTimeFilter<"sys_mfa_config"> | Date | string
  }

  export type sys_mfa_configOrderByWithRelationInput = {
    mfa_id?: SortOrder
    user_id?: SortOrder
    secret?: SortOrder
    enabled?: SortOrder
    backup_codes?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type sys_mfa_configWhereUniqueInput = Prisma.AtLeast<{
    mfa_id?: string
    user_id?: string
    AND?: sys_mfa_configWhereInput | sys_mfa_configWhereInput[]
    OR?: sys_mfa_configWhereInput[]
    NOT?: sys_mfa_configWhereInput | sys_mfa_configWhereInput[]
    secret?: StringFilter<"sys_mfa_config"> | string
    enabled?: IntFilter<"sys_mfa_config"> | number
    backup_codes?: StringNullableFilter<"sys_mfa_config"> | string | null
    created_at?: DateTimeFilter<"sys_mfa_config"> | Date | string
    updated_at?: DateTimeFilter<"sys_mfa_config"> | Date | string
  }, "mfa_id" | "user_id">

  export type sys_mfa_configOrderByWithAggregationInput = {
    mfa_id?: SortOrder
    user_id?: SortOrder
    secret?: SortOrder
    enabled?: SortOrder
    backup_codes?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: sys_mfa_configCountOrderByAggregateInput
    _avg?: sys_mfa_configAvgOrderByAggregateInput
    _max?: sys_mfa_configMaxOrderByAggregateInput
    _min?: sys_mfa_configMinOrderByAggregateInput
    _sum?: sys_mfa_configSumOrderByAggregateInput
  }

  export type sys_mfa_configScalarWhereWithAggregatesInput = {
    AND?: sys_mfa_configScalarWhereWithAggregatesInput | sys_mfa_configScalarWhereWithAggregatesInput[]
    OR?: sys_mfa_configScalarWhereWithAggregatesInput[]
    NOT?: sys_mfa_configScalarWhereWithAggregatesInput | sys_mfa_configScalarWhereWithAggregatesInput[]
    mfa_id?: UuidWithAggregatesFilter<"sys_mfa_config"> | string
    user_id?: UuidWithAggregatesFilter<"sys_mfa_config"> | string
    secret?: StringWithAggregatesFilter<"sys_mfa_config"> | string
    enabled?: IntWithAggregatesFilter<"sys_mfa_config"> | number
    backup_codes?: StringNullableWithAggregatesFilter<"sys_mfa_config"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"sys_mfa_config"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"sys_mfa_config"> | Date | string
  }

  export type sys_tenantCreateInput = {
    tenant_id?: string
    tenant_code: string
    tenant_name: string
    contact_name?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    status?: number
    expire_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_tenantUncheckedCreateInput = {
    tenant_id?: string
    tenant_code: string
    tenant_name: string
    contact_name?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    status?: number
    expire_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_tenantUpdateInput = {
    tenant_id?: StringFieldUpdateOperationsInput | string
    tenant_code?: StringFieldUpdateOperationsInput | string
    tenant_name?: StringFieldUpdateOperationsInput | string
    contact_name?: NullableStringFieldUpdateOperationsInput | string | null
    contact_phone?: NullableStringFieldUpdateOperationsInput | string | null
    contact_email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    expire_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_tenantUncheckedUpdateInput = {
    tenant_id?: StringFieldUpdateOperationsInput | string
    tenant_code?: StringFieldUpdateOperationsInput | string
    tenant_name?: StringFieldUpdateOperationsInput | string
    contact_name?: NullableStringFieldUpdateOperationsInput | string | null
    contact_phone?: NullableStringFieldUpdateOperationsInput | string | null
    contact_email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    expire_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_tenantCreateManyInput = {
    tenant_id?: string
    tenant_code: string
    tenant_name: string
    contact_name?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    status?: number
    expire_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_tenantUpdateManyMutationInput = {
    tenant_id?: StringFieldUpdateOperationsInput | string
    tenant_code?: StringFieldUpdateOperationsInput | string
    tenant_name?: StringFieldUpdateOperationsInput | string
    contact_name?: NullableStringFieldUpdateOperationsInput | string | null
    contact_phone?: NullableStringFieldUpdateOperationsInput | string | null
    contact_email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    expire_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_tenantUncheckedUpdateManyInput = {
    tenant_id?: StringFieldUpdateOperationsInput | string
    tenant_code?: StringFieldUpdateOperationsInput | string
    tenant_name?: StringFieldUpdateOperationsInput | string
    contact_name?: NullableStringFieldUpdateOperationsInput | string | null
    contact_phone?: NullableStringFieldUpdateOperationsInput | string | null
    contact_email?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    expire_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_userCreateInput = {
    user_id?: string
    tenant_id: string
    username: string
    password: string
    real_name?: string | null
    phone?: string | null
    email?: string | null
    avatar?: string | null
    gender?: number | null
    status?: number
    last_login_ip?: string | null
    last_login_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_userUncheckedCreateInput = {
    user_id?: string
    tenant_id: string
    username: string
    password: string
    real_name?: string | null
    phone?: string | null
    email?: string | null
    avatar?: string | null
    gender?: number | null
    status?: number
    last_login_ip?: string | null
    last_login_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_userUpdateInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    real_name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableIntFieldUpdateOperationsInput | number | null
    status?: IntFieldUpdateOperationsInput | number
    last_login_ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_login_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_userUncheckedUpdateInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    real_name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableIntFieldUpdateOperationsInput | number | null
    status?: IntFieldUpdateOperationsInput | number
    last_login_ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_login_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_userCreateManyInput = {
    user_id?: string
    tenant_id: string
    username: string
    password: string
    real_name?: string | null
    phone?: string | null
    email?: string | null
    avatar?: string | null
    gender?: number | null
    status?: number
    last_login_ip?: string | null
    last_login_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_userUpdateManyMutationInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    real_name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableIntFieldUpdateOperationsInput | number | null
    status?: IntFieldUpdateOperationsInput | number
    last_login_ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_login_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_userUncheckedUpdateManyInput = {
    user_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    real_name?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableIntFieldUpdateOperationsInput | number | null
    status?: IntFieldUpdateOperationsInput | number
    last_login_ip?: NullableStringFieldUpdateOperationsInput | string | null
    last_login_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_roleCreateInput = {
    role_id?: string
    tenant_id: string
    role_code: string
    role_name: string
    description?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_roleUncheckedCreateInput = {
    role_id?: string
    tenant_id: string
    role_code: string
    role_name: string
    description?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_roleUpdateInput = {
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    role_code?: StringFieldUpdateOperationsInput | string
    role_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_roleUncheckedUpdateInput = {
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    role_code?: StringFieldUpdateOperationsInput | string
    role_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_roleCreateManyInput = {
    role_id?: string
    tenant_id: string
    role_code: string
    role_name: string
    description?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_roleUpdateManyMutationInput = {
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    role_code?: StringFieldUpdateOperationsInput | string
    role_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_roleUncheckedUpdateManyInput = {
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    role_code?: StringFieldUpdateOperationsInput | string
    role_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_deptCreateInput = {
    dept_id?: string
    tenant_id: string
    parent_id?: string
    dept_code: string
    dept_name: string
    leader?: string | null
    phone?: string | null
    email?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_deptUncheckedCreateInput = {
    dept_id?: string
    tenant_id: string
    parent_id?: string
    dept_code: string
    dept_name: string
    leader?: string | null
    phone?: string | null
    email?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_deptUpdateInput = {
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    dept_code?: StringFieldUpdateOperationsInput | string
    dept_name?: StringFieldUpdateOperationsInput | string
    leader?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_deptUncheckedUpdateInput = {
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    dept_code?: StringFieldUpdateOperationsInput | string
    dept_name?: StringFieldUpdateOperationsInput | string
    leader?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_deptCreateManyInput = {
    dept_id?: string
    tenant_id: string
    parent_id?: string
    dept_code: string
    dept_name: string
    leader?: string | null
    phone?: string | null
    email?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_deptUpdateManyMutationInput = {
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    dept_code?: StringFieldUpdateOperationsInput | string
    dept_name?: StringFieldUpdateOperationsInput | string
    leader?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_deptUncheckedUpdateManyInput = {
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    dept_code?: StringFieldUpdateOperationsInput | string
    dept_name?: StringFieldUpdateOperationsInput | string
    leader?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_menuCreateInput = {
    menu_id?: string
    tenant_id: string
    parent_id?: string
    menu_name: string
    menu_type: number
    icon?: string | null
    path?: string | null
    component?: string | null
    permission?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_menuUncheckedCreateInput = {
    menu_id?: string
    tenant_id: string
    parent_id?: string
    menu_name: string
    menu_type: number
    icon?: string | null
    path?: string | null
    component?: string | null
    permission?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_menuUpdateInput = {
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    menu_name?: StringFieldUpdateOperationsInput | string
    menu_type?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    component?: NullableStringFieldUpdateOperationsInput | string | null
    permission?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_menuUncheckedUpdateInput = {
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    menu_name?: StringFieldUpdateOperationsInput | string
    menu_type?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    component?: NullableStringFieldUpdateOperationsInput | string | null
    permission?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_menuCreateManyInput = {
    menu_id?: string
    tenant_id: string
    parent_id?: string
    menu_name: string
    menu_type: number
    icon?: string | null
    path?: string | null
    component?: string | null
    permission?: string | null
    sort_order?: number
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_menuUpdateManyMutationInput = {
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    menu_name?: StringFieldUpdateOperationsInput | string
    menu_type?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    component?: NullableStringFieldUpdateOperationsInput | string | null
    permission?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_menuUncheckedUpdateManyInput = {
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    parent_id?: StringFieldUpdateOperationsInput | string
    menu_name?: StringFieldUpdateOperationsInput | string
    menu_type?: IntFieldUpdateOperationsInput | number
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    path?: NullableStringFieldUpdateOperationsInput | string | null
    component?: NullableStringFieldUpdateOperationsInput | string | null
    permission?: NullableStringFieldUpdateOperationsInput | string | null
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_permissionCreateInput = {
    perm_id?: string
    tenant_id: string
    perm_code: string
    perm_name: string
    resource_type: string
    action: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_permissionUncheckedCreateInput = {
    perm_id?: string
    tenant_id: string
    perm_code: string
    perm_name: string
    resource_type: string
    action: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_permissionUpdateInput = {
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    perm_code?: StringFieldUpdateOperationsInput | string
    perm_name?: StringFieldUpdateOperationsInput | string
    resource_type?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_permissionUncheckedUpdateInput = {
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    perm_code?: StringFieldUpdateOperationsInput | string
    perm_name?: StringFieldUpdateOperationsInput | string
    resource_type?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_permissionCreateManyInput = {
    perm_id?: string
    tenant_id: string
    perm_code: string
    perm_name: string
    resource_type: string
    action: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_permissionUpdateManyMutationInput = {
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    perm_code?: StringFieldUpdateOperationsInput | string
    perm_name?: StringFieldUpdateOperationsInput | string
    resource_type?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_permissionUncheckedUpdateManyInput = {
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    perm_code?: StringFieldUpdateOperationsInput | string
    perm_name?: StringFieldUpdateOperationsInput | string
    resource_type?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_typeCreateInput = {
    dict_type_id?: string
    tenant_id: string
    dict_code: string
    dict_name: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_typeUncheckedCreateInput = {
    dict_type_id?: string
    tenant_id: string
    dict_code: string
    dict_name: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_typeUpdateInput = {
    dict_type_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_code?: StringFieldUpdateOperationsInput | string
    dict_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_typeUncheckedUpdateInput = {
    dict_type_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_code?: StringFieldUpdateOperationsInput | string
    dict_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_typeCreateManyInput = {
    dict_type_id?: string
    tenant_id: string
    dict_code: string
    dict_name: string
    description?: string | null
    status?: number
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_typeUpdateManyMutationInput = {
    dict_type_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_code?: StringFieldUpdateOperationsInput | string
    dict_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_typeUncheckedUpdateManyInput = {
    dict_type_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_code?: StringFieldUpdateOperationsInput | string
    dict_name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    status?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_dataCreateInput = {
    dict_data_id?: string
    tenant_id: string
    dict_type_id: string
    dict_label: string
    dict_value: string
    sort_order?: number
    status?: number
    remark?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_dataUncheckedCreateInput = {
    dict_data_id?: string
    tenant_id: string
    dict_type_id: string
    dict_label: string
    dict_value: string
    sort_order?: number
    status?: number
    remark?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_dataUpdateInput = {
    dict_data_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_type_id?: StringFieldUpdateOperationsInput | string
    dict_label?: StringFieldUpdateOperationsInput | string
    dict_value?: StringFieldUpdateOperationsInput | string
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    remark?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_dataUncheckedUpdateInput = {
    dict_data_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_type_id?: StringFieldUpdateOperationsInput | string
    dict_label?: StringFieldUpdateOperationsInput | string
    dict_value?: StringFieldUpdateOperationsInput | string
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    remark?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_dataCreateManyInput = {
    dict_data_id?: string
    tenant_id: string
    dict_type_id: string
    dict_label: string
    dict_value: string
    sort_order?: number
    status?: number
    remark?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_dict_dataUpdateManyMutationInput = {
    dict_data_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_type_id?: StringFieldUpdateOperationsInput | string
    dict_label?: StringFieldUpdateOperationsInput | string
    dict_value?: StringFieldUpdateOperationsInput | string
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    remark?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_dict_dataUncheckedUpdateManyInput = {
    dict_data_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    dict_type_id?: StringFieldUpdateOperationsInput | string
    dict_label?: StringFieldUpdateOperationsInput | string
    dict_value?: StringFieldUpdateOperationsInput | string
    sort_order?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    remark?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_noticeCreateInput = {
    notice_id?: string
    tenant_id: string
    title: string
    content?: string | null
    notice_type: number
    status?: number
    publish_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_noticeUncheckedCreateInput = {
    notice_id?: string
    tenant_id: string
    title: string
    content?: string | null
    notice_type: number
    status?: number
    publish_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_noticeUpdateInput = {
    notice_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    notice_type?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    publish_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_noticeUncheckedUpdateInput = {
    notice_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    notice_type?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    publish_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_noticeCreateManyInput = {
    notice_id?: string
    tenant_id: string
    title: string
    content?: string | null
    notice_type: number
    status?: number
    publish_time?: Date | string | null
    created_at?: Date | string
    updated_at?: Date | string
    created_by?: string | null
    updated_by?: string | null
    is_deleted?: number
  }

  export type sys_noticeUpdateManyMutationInput = {
    notice_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    notice_type?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    publish_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_noticeUncheckedUpdateManyInput = {
    notice_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    notice_type?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    publish_time?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    created_by?: NullableStringFieldUpdateOperationsInput | string | null
    updated_by?: NullableStringFieldUpdateOperationsInput | string | null
    is_deleted?: IntFieldUpdateOperationsInput | number
  }

  export type sys_audit_logCreateInput = {
    log_id?: string
    tenant_id: string
    user_id?: string | null
    username?: string | null
    operation: string
    method: string
    request_url: string
    request_params?: string | null
    response_data?: string | null
    ip_address: string
    user_agent?: string | null
    execute_time?: number
    status?: number
    error_msg?: string | null
    created_at?: Date | string
  }

  export type sys_audit_logUncheckedCreateInput = {
    log_id?: string
    tenant_id: string
    user_id?: string | null
    username?: string | null
    operation: string
    method: string
    request_url: string
    request_params?: string | null
    response_data?: string | null
    ip_address: string
    user_agent?: string | null
    execute_time?: number
    status?: number
    error_msg?: string | null
    created_at?: Date | string
  }

  export type sys_audit_logUpdateInput = {
    log_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    request_url?: StringFieldUpdateOperationsInput | string
    request_params?: NullableStringFieldUpdateOperationsInput | string | null
    response_data?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: StringFieldUpdateOperationsInput | string
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    execute_time?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    error_msg?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_audit_logUncheckedUpdateInput = {
    log_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    request_url?: StringFieldUpdateOperationsInput | string
    request_params?: NullableStringFieldUpdateOperationsInput | string | null
    response_data?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: StringFieldUpdateOperationsInput | string
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    execute_time?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    error_msg?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_audit_logCreateManyInput = {
    log_id?: string
    tenant_id: string
    user_id?: string | null
    username?: string | null
    operation: string
    method: string
    request_url: string
    request_params?: string | null
    response_data?: string | null
    ip_address: string
    user_agent?: string | null
    execute_time?: number
    status?: number
    error_msg?: string | null
    created_at?: Date | string
  }

  export type sys_audit_logUpdateManyMutationInput = {
    log_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    request_url?: StringFieldUpdateOperationsInput | string
    request_params?: NullableStringFieldUpdateOperationsInput | string | null
    response_data?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: StringFieldUpdateOperationsInput | string
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    execute_time?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    error_msg?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_audit_logUncheckedUpdateManyInput = {
    log_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    username?: NullableStringFieldUpdateOperationsInput | string | null
    operation?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    request_url?: StringFieldUpdateOperationsInput | string
    request_params?: NullableStringFieldUpdateOperationsInput | string | null
    response_data?: NullableStringFieldUpdateOperationsInput | string | null
    ip_address?: StringFieldUpdateOperationsInput | string
    user_agent?: NullableStringFieldUpdateOperationsInput | string | null
    execute_time?: IntFieldUpdateOperationsInput | number
    status?: IntFieldUpdateOperationsInput | number
    error_msg?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_roleCreateInput = {
    id?: string
    user_id: string
    role_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_user_roleUncheckedCreateInput = {
    id?: string
    user_id: string
    role_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_user_roleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_roleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_roleCreateManyInput = {
    id?: string
    user_id: string
    role_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_user_roleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_roleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_deptCreateInput = {
    id?: string
    user_id: string
    dept_id: string
    tenant_id: string
    is_primary?: number
    created_at?: Date | string
  }

  export type sys_user_deptUncheckedCreateInput = {
    id?: string
    user_id: string
    dept_id: string
    tenant_id: string
    is_primary?: number
    created_at?: Date | string
  }

  export type sys_user_deptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    is_primary?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_deptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    is_primary?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_deptCreateManyInput = {
    id?: string
    user_id: string
    dept_id: string
    tenant_id: string
    is_primary?: number
    created_at?: Date | string
  }

  export type sys_user_deptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    is_primary?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_user_deptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    dept_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    is_primary?: IntFieldUpdateOperationsInput | number
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_menuCreateInput = {
    id?: string
    role_id: string
    menu_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_menuUncheckedCreateInput = {
    id?: string
    role_id: string
    menu_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_menuUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_menuUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_menuCreateManyInput = {
    id?: string
    role_id: string
    menu_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_menuUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_menuUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    menu_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_permissionCreateInput = {
    id?: string
    role_id: string
    perm_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_permissionUncheckedCreateInput = {
    id?: string
    role_id: string
    perm_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_permissionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_permissionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_permissionCreateManyInput = {
    id?: string
    role_id: string
    perm_id: string
    tenant_id: string
    created_at?: Date | string
  }

  export type sys_role_permissionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_role_permissionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    role_id?: StringFieldUpdateOperationsInput | string
    perm_id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_mfa_configCreateInput = {
    mfa_id?: string
    user_id: string
    secret: string
    enabled?: number
    backup_codes?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type sys_mfa_configUncheckedCreateInput = {
    mfa_id?: string
    user_id: string
    secret: string
    enabled?: number
    backup_codes?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type sys_mfa_configUpdateInput = {
    mfa_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    enabled?: IntFieldUpdateOperationsInput | number
    backup_codes?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_mfa_configUncheckedUpdateInput = {
    mfa_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    enabled?: IntFieldUpdateOperationsInput | number
    backup_codes?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_mfa_configCreateManyInput = {
    mfa_id?: string
    user_id: string
    secret: string
    enabled?: number
    backup_codes?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type sys_mfa_configUpdateManyMutationInput = {
    mfa_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    enabled?: IntFieldUpdateOperationsInput | number
    backup_codes?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type sys_mfa_configUncheckedUpdateManyInput = {
    mfa_id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    secret?: StringFieldUpdateOperationsInput | string
    enabled?: IntFieldUpdateOperationsInput | number
    backup_codes?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type sys_tenantCountOrderByAggregateInput = {
    tenant_id?: SortOrder
    tenant_code?: SortOrder
    tenant_name?: SortOrder
    contact_name?: SortOrder
    contact_phone?: SortOrder
    contact_email?: SortOrder
    status?: SortOrder
    expire_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_tenantAvgOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_tenantMaxOrderByAggregateInput = {
    tenant_id?: SortOrder
    tenant_code?: SortOrder
    tenant_name?: SortOrder
    contact_name?: SortOrder
    contact_phone?: SortOrder
    contact_email?: SortOrder
    status?: SortOrder
    expire_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_tenantMinOrderByAggregateInput = {
    tenant_id?: SortOrder
    tenant_code?: SortOrder
    tenant_name?: SortOrder
    contact_name?: SortOrder
    contact_phone?: SortOrder
    contact_email?: SortOrder
    status?: SortOrder
    expire_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_tenantSumOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type sys_userTenant_idUsernameCompoundUniqueInput = {
    tenant_id: string
    username: string
  }

  export type sys_userCountOrderByAggregateInput = {
    user_id?: SortOrder
    tenant_id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    real_name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar?: SortOrder
    gender?: SortOrder
    status?: SortOrder
    last_login_ip?: SortOrder
    last_login_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_userAvgOrderByAggregateInput = {
    gender?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_userMaxOrderByAggregateInput = {
    user_id?: SortOrder
    tenant_id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    real_name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar?: SortOrder
    gender?: SortOrder
    status?: SortOrder
    last_login_ip?: SortOrder
    last_login_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_userMinOrderByAggregateInput = {
    user_id?: SortOrder
    tenant_id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    real_name?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    avatar?: SortOrder
    gender?: SortOrder
    status?: SortOrder
    last_login_ip?: SortOrder
    last_login_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_userSumOrderByAggregateInput = {
    gender?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type sys_roleTenant_idRole_codeCompoundUniqueInput = {
    tenant_id: string
    role_code: string
  }

  export type sys_roleCountOrderByAggregateInput = {
    role_id?: SortOrder
    tenant_id?: SortOrder
    role_code?: SortOrder
    role_name?: SortOrder
    description?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_roleAvgOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_roleMaxOrderByAggregateInput = {
    role_id?: SortOrder
    tenant_id?: SortOrder
    role_code?: SortOrder
    role_name?: SortOrder
    description?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_roleMinOrderByAggregateInput = {
    role_id?: SortOrder
    tenant_id?: SortOrder
    role_code?: SortOrder
    role_name?: SortOrder
    description?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_roleSumOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptTenant_idDept_codeCompoundUniqueInput = {
    tenant_id: string
    dept_code: string
  }

  export type sys_deptCountOrderByAggregateInput = {
    dept_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    dept_code?: SortOrder
    dept_name?: SortOrder
    leader?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptAvgOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptMaxOrderByAggregateInput = {
    dept_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    dept_code?: SortOrder
    dept_name?: SortOrder
    leader?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptMinOrderByAggregateInput = {
    dept_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    dept_code?: SortOrder
    dept_name?: SortOrder
    leader?: SortOrder
    phone?: SortOrder
    email?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_deptSumOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuCountOrderByAggregateInput = {
    menu_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    menu_name?: SortOrder
    menu_type?: SortOrder
    icon?: SortOrder
    path?: SortOrder
    component?: SortOrder
    permission?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuAvgOrderByAggregateInput = {
    menu_type?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuMaxOrderByAggregateInput = {
    menu_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    menu_name?: SortOrder
    menu_type?: SortOrder
    icon?: SortOrder
    path?: SortOrder
    component?: SortOrder
    permission?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuMinOrderByAggregateInput = {
    menu_id?: SortOrder
    tenant_id?: SortOrder
    parent_id?: SortOrder
    menu_name?: SortOrder
    menu_type?: SortOrder
    icon?: SortOrder
    path?: SortOrder
    component?: SortOrder
    permission?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_menuSumOrderByAggregateInput = {
    menu_type?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionTenant_idPerm_codeCompoundUniqueInput = {
    tenant_id: string
    perm_code: string
  }

  export type sys_permissionCountOrderByAggregateInput = {
    perm_id?: SortOrder
    tenant_id?: SortOrder
    perm_code?: SortOrder
    perm_name?: SortOrder
    resource_type?: SortOrder
    action?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionAvgOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionMaxOrderByAggregateInput = {
    perm_id?: SortOrder
    tenant_id?: SortOrder
    perm_code?: SortOrder
    perm_name?: SortOrder
    resource_type?: SortOrder
    action?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionMinOrderByAggregateInput = {
    perm_id?: SortOrder
    tenant_id?: SortOrder
    perm_code?: SortOrder
    perm_name?: SortOrder
    resource_type?: SortOrder
    action?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_permissionSumOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeTenant_idDict_codeCompoundUniqueInput = {
    tenant_id: string
    dict_code: string
  }

  export type sys_dict_typeCountOrderByAggregateInput = {
    dict_type_id?: SortOrder
    tenant_id?: SortOrder
    dict_code?: SortOrder
    dict_name?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeAvgOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeMaxOrderByAggregateInput = {
    dict_type_id?: SortOrder
    tenant_id?: SortOrder
    dict_code?: SortOrder
    dict_name?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeMinOrderByAggregateInput = {
    dict_type_id?: SortOrder
    tenant_id?: SortOrder
    dict_code?: SortOrder
    dict_name?: SortOrder
    description?: SortOrder
    status?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_typeSumOrderByAggregateInput = {
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataCountOrderByAggregateInput = {
    dict_data_id?: SortOrder
    tenant_id?: SortOrder
    dict_type_id?: SortOrder
    dict_label?: SortOrder
    dict_value?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    remark?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataAvgOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataMaxOrderByAggregateInput = {
    dict_data_id?: SortOrder
    tenant_id?: SortOrder
    dict_type_id?: SortOrder
    dict_label?: SortOrder
    dict_value?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    remark?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataMinOrderByAggregateInput = {
    dict_data_id?: SortOrder
    tenant_id?: SortOrder
    dict_type_id?: SortOrder
    dict_label?: SortOrder
    dict_value?: SortOrder
    sort_order?: SortOrder
    status?: SortOrder
    remark?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_dict_dataSumOrderByAggregateInput = {
    sort_order?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeCountOrderByAggregateInput = {
    notice_id?: SortOrder
    tenant_id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    notice_type?: SortOrder
    status?: SortOrder
    publish_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeAvgOrderByAggregateInput = {
    notice_type?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeMaxOrderByAggregateInput = {
    notice_id?: SortOrder
    tenant_id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    notice_type?: SortOrder
    status?: SortOrder
    publish_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeMinOrderByAggregateInput = {
    notice_id?: SortOrder
    tenant_id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    notice_type?: SortOrder
    status?: SortOrder
    publish_time?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    created_by?: SortOrder
    updated_by?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_noticeSumOrderByAggregateInput = {
    notice_type?: SortOrder
    status?: SortOrder
    is_deleted?: SortOrder
  }

  export type sys_audit_logCountOrderByAggregateInput = {
    log_id?: SortOrder
    tenant_id?: SortOrder
    user_id?: SortOrder
    username?: SortOrder
    operation?: SortOrder
    method?: SortOrder
    request_url?: SortOrder
    request_params?: SortOrder
    response_data?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    execute_time?: SortOrder
    status?: SortOrder
    error_msg?: SortOrder
    created_at?: SortOrder
  }

  export type sys_audit_logAvgOrderByAggregateInput = {
    execute_time?: SortOrder
    status?: SortOrder
  }

  export type sys_audit_logMaxOrderByAggregateInput = {
    log_id?: SortOrder
    tenant_id?: SortOrder
    user_id?: SortOrder
    username?: SortOrder
    operation?: SortOrder
    method?: SortOrder
    request_url?: SortOrder
    request_params?: SortOrder
    response_data?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    execute_time?: SortOrder
    status?: SortOrder
    error_msg?: SortOrder
    created_at?: SortOrder
  }

  export type sys_audit_logMinOrderByAggregateInput = {
    log_id?: SortOrder
    tenant_id?: SortOrder
    user_id?: SortOrder
    username?: SortOrder
    operation?: SortOrder
    method?: SortOrder
    request_url?: SortOrder
    request_params?: SortOrder
    response_data?: SortOrder
    ip_address?: SortOrder
    user_agent?: SortOrder
    execute_time?: SortOrder
    status?: SortOrder
    error_msg?: SortOrder
    created_at?: SortOrder
  }

  export type sys_audit_logSumOrderByAggregateInput = {
    execute_time?: SortOrder
    status?: SortOrder
  }

  export type sys_user_roleUser_idRole_idCompoundUniqueInput = {
    user_id: string
    role_id: string
  }

  export type sys_user_roleCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    role_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_roleMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    role_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_roleMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    role_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_deptUser_idDept_idCompoundUniqueInput = {
    user_id: string
    dept_id: string
  }

  export type sys_user_deptCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    dept_id?: SortOrder
    tenant_id?: SortOrder
    is_primary?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_deptAvgOrderByAggregateInput = {
    is_primary?: SortOrder
  }

  export type sys_user_deptMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    dept_id?: SortOrder
    tenant_id?: SortOrder
    is_primary?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_deptMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    dept_id?: SortOrder
    tenant_id?: SortOrder
    is_primary?: SortOrder
    created_at?: SortOrder
  }

  export type sys_user_deptSumOrderByAggregateInput = {
    is_primary?: SortOrder
  }

  export type sys_role_menuRole_idMenu_idCompoundUniqueInput = {
    role_id: string
    menu_id: string
  }

  export type sys_role_menuCountOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    menu_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_menuMaxOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    menu_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_menuMinOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    menu_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_permissionRole_idPerm_idCompoundUniqueInput = {
    role_id: string
    perm_id: string
  }

  export type sys_role_permissionCountOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    perm_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_permissionMaxOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    perm_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_role_permissionMinOrderByAggregateInput = {
    id?: SortOrder
    role_id?: SortOrder
    perm_id?: SortOrder
    tenant_id?: SortOrder
    created_at?: SortOrder
  }

  export type sys_mfa_configCountOrderByAggregateInput = {
    mfa_id?: SortOrder
    user_id?: SortOrder
    secret?: SortOrder
    enabled?: SortOrder
    backup_codes?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type sys_mfa_configAvgOrderByAggregateInput = {
    enabled?: SortOrder
  }

  export type sys_mfa_configMaxOrderByAggregateInput = {
    mfa_id?: SortOrder
    user_id?: SortOrder
    secret?: SortOrder
    enabled?: SortOrder
    backup_codes?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type sys_mfa_configMinOrderByAggregateInput = {
    mfa_id?: SortOrder
    user_id?: SortOrder
    secret?: SortOrder
    enabled?: SortOrder
    backup_codes?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type sys_mfa_configSumOrderByAggregateInput = {
    enabled?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}