const ADDRESS_INTSERT = `
  INSERT INTO address (cep, street, neighborhood, city, state, number, complement)
  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
`;

const USER_INSERT = `
  INSERT INTO users (name, surname, birth_date, cpf, address_id)
  VALUES ($1, $2, $3, $4, $5) RETURNING id
`

const ACCOUNT_INSERT = `
  INSERT INTO accounts (account_number, email, password, pin, phone, user_id)
  VALUES ($1, $2, $3, $4, $5, $6)
`

const VERIFY_EMAIL = `
  SELECT email FROM accounts
  WHERE email = $1
`

const VERIFY_CPF = `
  SELECT cpf FROM users
  WHERE cpf = $1
`;

const VERIFY_PHONE = `
  SELECT phone FROM accounts 
  WHERE phone = $1
`

const LOGIN_QUERY = `
  SELECT 
    a.user_id,
    a.email, 
    a.password, 
    a.pin,
    u.name  -- Agora buscamos o nome da tabela de usuários
  FROM accounts a
  INNER JOIN users u ON a.user_id = u.id -- Faz a ligação entre as tabelas
  WHERE a.email = $1
`

const GET_USER = `
  SELECT 
    u.name,
    u.surname,
    u.cpf,
    a.email
  FROM users u
  INNER JOIN accounts a ON u.id = a.user_id
  WHERE u.id = $1
`

const GET_USER_DATA = `
  SELECT 
    u.id,
    u.name,
    u.surname,
    u.cpf,
    a.email,
    a.password,
    a.pin,
    a.phone
  FROM users u
  INNER JOIN accounts a ON u.id = a.user_id
  WHERE u.id = $1
`
const GET_USER_ACCOUNT = `
    SELECT 
      u.id,
      u.name,
      u.surname,
      u.cpf,
      a.email,
      a.account_number,
      a.balance,
      a.phone
  FROM users u
  INNER JOIN accounts a ON u.id = a.user_id
  WHERE u.id = $1;
`

const UPDATE_USER_DATA = `
  UPDATE users
  SET name = $1,
    surname = $2,
    cpf = $3
WHERE id = $4
`

const UPDATE_ACCOUNT_DATA = `
  UPDATE accounts
  SET email = $1,
    password = $2,
    pin = $3,
    phone = $4
  WHERE user_id = $5
`

const DELETE_USER = `
  DELETE FROM users
  WHERE id = $1
  RETURNING address_id
`

const DELETE_ADDRESS = `
  DELETE FROM address
  WHERE id = $1
`

const UPDATE_SESSION_QUERY = `
  UPDATE accounts 
  SET refresh_token = $1, 
      token_expires_at = $2 
  WHERE id = $3
`;

const REMOVE_SESSION_QUERY = `
  UPDATE accounts 
  SET refresh_token = NULL, 
      token_expires_at = NULL 
  WHERE id = $1
`;

const UPSERT_VERIFICATION = `
INSERT INTO phone_verifications (phone, code, expires_at)
VALUES ($1, $2, $3)
ON CONFLICT (phone) 
DO UPDATE SET 
    code = EXCLUDED.code, 
    expires_at = EXCLUDED.expires_at,
    created_at = CURRENT_TIMESTAMP;
`

const VERIFY_CODE = `
  SELECT code FROM phone_verifications 
  WHERE phone = $1 
`

const DELETE_SMS_CODE = `
  DELETE FROM phone_verifications 
  WHERE phone = $1;
`

const DOES_PHONE_EXISTS = `
  SELECT id FROM accounts 
  WHERE phone = $1
`

const GET_DASHBOARD_DATA = `
  SELECT 
        TO_CHAR(created_at, 'DD/MM') as label, 
        SUM(amount) as value 
      FROM transactions 
      WHERE account_number = $1 
        AND type = 'expense' 
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY label 
      ORDER BY MIN(created_at) ASC;
`

const GET_BALANCE_EVOLUTION = `
  SELECT 
    to_char(created_at, 'DD/MM') AS label,
    SUM(SUM(amount)) OVER (ORDER BY date_trunc('day', created_at)) AS value
  FROM transactions
  WHERE account_number = $1
  GROUP BY date_trunc('day', created_at), to_char(created_at, 'DD/MM')
  ORDER BY date_trunc('day', created_at) ASC;
`

const GET_INCOME_EVOLUTION = `
  SELECT to_char(created_at, 'DD/MM') AS label, SUM(amount) AS value
    FROM transactions 
    WHERE account_number = $1 AND type = 'income'
    GROUP BY date_trunc('day', created_at), to_char(created_at, 'DD/MM')
    ORDER BY date_trunc('day', created_at) ASC;
`

const GET_EXPENSE_EVOLUTION = `
SELECT to_char(created_at, 'DD/MM') AS label, SUM(ABS(amount)) AS value
    FROM transactions 
    WHERE account_number = $1 AND type = 'expense'
    GROUP BY date_trunc('day', created_at), to_char(created_at, 'DD/MM')
    ORDER BY date_trunc('day', created_at) ASC;
`

const GET_SUMMARY_EVOLUTION = `
  SELECT 
      type, 
      SUM(ABS(amount)) as total 
    FROM transactions 
    WHERE account_number = $1
    GROUP BY type;
`

const CREATE_TRASACTION = `
  INSERT INTO transactions (
  account_number,
    description,
    amount,
    type,
    category,
    subcategory,
    category_id,
    subcategory_id,
    envelope_id,
    status
  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  RETURNING *;
`

const GET_DAILY_EXPENSES = `
  SELECT 
    TO_CHAR(created_at, 'Day') AS day,
    SUM(amount) AS total
  FROM transactions
  WHERE account_number = $1
    AND type = 'expense'
  GROUP BY day
  ORDER BY MIN(EXTRACT(DOW FROM created_at));
`

const GET_TRANSACTIONS_BY_ACCOUNT = `
  SELECT 
    t.*,
    CASE 
      WHEN COUNT(tr.id) > 0 THEN true
      ELSE false
    END AS has_receipt
  FROM transactions t
  LEFT JOIN transaction_receipts tr
    ON tr.transaction_id = t.id
  WHERE t.account_number = $1
  GROUP BY t.id
  ORDER BY t.created_at DESC;
`;

const GET_CONCLUDED_EXPENSES = `
  SELECT 
  id,
  description,
  amount,
  category,
  subcategory,
  created_at
FROM transactions
WHERE account_number = $1
AND type = 'expense'
AND status = 'completed'
ORDER BY created_at DESC;
`

export {
  ADDRESS_INTSERT,
  USER_INSERT,
  ACCOUNT_INSERT,
  VERIFY_EMAIL,
  VERIFY_CPF,
  VERIFY_PHONE,
  LOGIN_QUERY,
  GET_USER,
  GET_USER_DATA,
  GET_USER_ACCOUNT,
  UPDATE_USER_DATA,
  UPDATE_ACCOUNT_DATA,
  DELETE_USER,
  DELETE_ADDRESS,
  UPDATE_SESSION_QUERY,
  REMOVE_SESSION_QUERY,
  UPSERT_VERIFICATION,
  VERIFY_CODE,
  DELETE_SMS_CODE,
  DOES_PHONE_EXISTS,
  GET_DASHBOARD_DATA,
  GET_BALANCE_EVOLUTION,
  GET_INCOME_EVOLUTION,
  GET_EXPENSE_EVOLUTION,
  GET_SUMMARY_EVOLUTION,
  CREATE_TRASACTION,
  GET_DAILY_EXPENSES,
  GET_TRANSACTIONS_BY_ACCOUNT,
  GET_CONCLUDED_EXPENSES
};