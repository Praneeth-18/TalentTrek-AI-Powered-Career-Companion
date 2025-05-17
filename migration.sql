-- Migration file to update database schema

-- First, create users table if it doesn't exist or update it
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL, 
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add trigger for users table to update timestamps
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at();

-- Update user_applications table
ALTER TABLE user_applications 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- Create references between tables if they don't exist
DO $$
BEGIN
    BEGIN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'user_applications_user_id_fkey'
            AND table_name = 'user_applications'
        ) THEN
            ALTER TABLE user_applications 
            ADD CONSTRAINT user_applications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE;
        END IF;
    EXCEPTION
        WHEN others THEN
            -- Handle error if needed
            RAISE NOTICE 'Error creating foreign key: %', SQLERRM;
    END;
END $$;

-- Add index on user_id in user_applications if it doesn't exist
DO $$
BEGIN
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE indexname = 'idx_user_applications_user_id'
        ) THEN
            CREATE INDEX idx_user_applications_user_id ON user_applications(user_id);
        END IF;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Error creating index: %', SQLERRM;
    END;
END $$;

-- Create a view to easily see user applications with status history
CREATE OR REPLACE VIEW user_applications_with_history AS
SELECT 
    ua.id AS application_id,
    u.id AS user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    jl.id AS job_listing_id,
    jl.position_title,
    jl.company,
    jl.location,
    jl.job_category,
    ua.current_status,
    ua.applied_at,
    ua.updated_at,
    ua.notes,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', ash.id,
            'status', ash.status,
            'changed_at', ash.changed_at,
            'notes', ash.notes
        ) ORDER BY ash.changed_at DESC)
        FROM application_status_history ash
        WHERE ash.user_application_id = ua.id),
        '[]'::json
    ) AS status_history
FROM 
    user_applications ua
JOIN 
    users u ON ua.user_id = u.id
JOIN 
    job_listings jl ON ua.job_listing_id = jl.id;

-- Create a function to record a new application
CREATE OR REPLACE FUNCTION record_application(
    p_job_listing_id INTEGER, 
    p_username VARCHAR(255), 
    p_status VARCHAR(50) DEFAULT 'Applied',
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id VARCHAR(255);
    v_application_id INTEGER;
BEGIN
    -- Get user_id from username
    SELECT id INTO v_user_id FROM users WHERE username = p_username;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with username % not found', p_username;
    END IF;
    
    -- Check if application already exists
    SELECT id INTO v_application_id 
    FROM user_applications 
    WHERE job_listing_id = p_job_listing_id AND user_id = v_user_id;
    
    IF v_application_id IS NOT NULL THEN
        RETURN v_application_id; -- Return existing application ID
    END IF;
    
    -- Insert new application
    INSERT INTO user_applications (
        job_listing_id, 
        user_id, 
        current_status, 
        notes,
        applied_at,
        updated_at
    ) VALUES (
        p_job_listing_id,
        v_user_id,
        p_status,
        p_notes,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_application_id;
    
    -- Add initial status history record
    INSERT INTO application_status_history (
        user_application_id,
        status,
        notes,
        changed_at
    ) VALUES (
        v_application_id,
        p_status,
        p_notes,
        CURRENT_TIMESTAMP
    );
    
    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql; 