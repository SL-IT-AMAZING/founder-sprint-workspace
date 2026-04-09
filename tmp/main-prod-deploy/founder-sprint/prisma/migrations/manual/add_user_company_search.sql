-- User search vector: name, headline, bio, job_title, company
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(headline, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(job_title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(company, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS users_search_idx ON users USING gin(search_vector);

-- Company search vector: name, description, industry, tags
ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(industry, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS companies_search_idx ON companies USING gin(search_vector);
