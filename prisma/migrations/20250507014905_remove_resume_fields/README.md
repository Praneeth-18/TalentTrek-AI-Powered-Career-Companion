# Migration `20250507014905_remove_resume_fields`

This migration removes all resume-related fields from the users table and updates the record_application function to use user_id directly instead of username.

## Changes

- Remove `resume_text` from users table
- Remove `resume_updated_at` from users table
- Remove `resume_embedding` from users table
- Update `record_application` function to accept user_id directly 