-- Drop existing constraint
ALTER TABLE visits
DROP CONSTRAINT valid_doctor_names;

-- Drop existing enum type
DROP TYPE doctor_enum;

-- Create updated enum type with new doctor list
CREATE TYPE doctor_enum AS ENUM (
    'Dr. P. Indrasen Reddy',
    'Dr. Chandana Reddy'
);

-- Add updated constraint
ALTER TABLE visits
ADD CONSTRAINT valid_doctor_names 
CHECK (doctor_name IN (
    'Dr. P. Indrasen Reddy',
    'Dr. Chandana Reddy'
));

-- Update any existing visits from Dr. Seetha Reddy to Dr. Chandana Reddy
UPDATE visits
SET doctor_name = 'Dr. Chandana Reddy'
WHERE doctor_name = 'Dr. Seetha Reddy';
