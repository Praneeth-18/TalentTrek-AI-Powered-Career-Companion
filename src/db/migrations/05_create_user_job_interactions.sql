-- Create a table to track user interactions with job listings
CREATE TABLE IF NOT EXISTS user_job_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  job_listing_id INTEGER NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- 'viewed', 'applied', 'declined', etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraints
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_job_listing_id FOREIGN KEY (job_listing_id) REFERENCES job_listings (id) ON DELETE CASCADE,
  
  -- Add a unique constraint to prevent duplicate entries for the same interaction type
  CONSTRAINT unique_user_job_interaction UNIQUE (user_id, job_listing_id, interaction_type)
);

-- Create an index for faster lookups on common query patterns
CREATE INDEX idx_user_job_interactions_user_id ON user_job_interactions (user_id);
CREATE INDEX idx_user_job_interactions_job_listing_id ON user_job_interactions (job_listing_id);
CREATE INDEX idx_user_job_interactions_type ON user_job_interactions (interaction_type);

-- Create a function to track a job interaction
CREATE OR REPLACE FUNCTION track_job_interaction(
  p_user_id VARCHAR(255),
  p_job_listing_id INTEGER,
  p_interaction_type VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
  v_interaction_id INTEGER;
BEGIN
  -- Insert the interaction or update if it already exists
  INSERT INTO user_job_interactions (user_id, job_listing_id, interaction_type, updated_at)
  VALUES (p_user_id, p_job_listing_id, p_interaction_type, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, job_listing_id, interaction_type)
  DO UPDATE SET updated_at = CURRENT_TIMESTAMP
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql; 