-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  custom_fee NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_code TEXT UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  date_of_birth DATE NOT NULL,
  age_group TEXT NOT NULL DEFAULT 'U-12',
  position TEXT,
  age INTEGER NOT NULL,
  jersey_number INTEGER NOT NULL,
  nationality TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL,
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT '110',
  family_id UUID REFERENCES families(id),
  photo_url TEXT,
  id_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  specialty TEXT NOT NULL,
  monthly_salary NUMERIC(10, 2) NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL,
  photo_url TEXT,
  id_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Payments table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id),
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salary Payments table
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id),
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  player_id UUID NOT NULL REFERENCES players(id),
  present BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income Records table
CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions table for express-session
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_user_sessions_expire" ON "user_sessions" ("expire");

-- Enable Row Level Security (optional - can be disabled for now)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE families ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

SELECT 'Tables created successfully!' as message;
