-- Add doctor_name column to visits table
ALTER TABLE visits
ADD COLUMN doctor_name text;

-- Add a comment to the column
COMMENT ON COLUMN visits.doctor_name IS 'Name of the doctor who conducted the visit';

-- Create an enum type for doctors to ensure consistency
CREATE TYPE doctor_enum AS ENUM ('Dr. P. Indrasen Reddy', 'Dr. Seetha Reddy');

-- Add a constraint to ensure only valid doctor names are entered
ALTER TABLE visits
ADD CONSTRAINT valid_doctor_names 
CHECK (doctor_name IN ('Dr. P. Indrasen Reddy', 'Dr. Seetha Reddy'));

-- Update existing records to have a default value
UPDATE visits
SET doctor_name = 'Dr. P. Indrasen Reddy'
WHERE doctor_name IS NULL; 