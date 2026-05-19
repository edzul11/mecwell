-- Añadir nuevos campos a la tabla workers
ALTER TABLE workers
ADD COLUMN shift TEXT,
ADD COLUMN birth_date DATE,
ADD COLUMN entry_date DATE,
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN clothing_size TEXT,
ADD COLUMN shoe_size TEXT,
ADD COLUMN glove_size TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN account_type TEXT,
ADD COLUMN account_number TEXT,
ADD COLUMN marital_status TEXT;
