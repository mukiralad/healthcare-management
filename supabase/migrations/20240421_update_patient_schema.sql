-- Make id_number column nullable
ALTER TABLE patients
ALTER COLUMN id_number DROP NOT NULL;

-- Add unique constraint on phone_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = 'patients' AND constraint_name = 'unique_phone_number') THEN
        ALTER TABLE patients
        ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
    END IF;
END
$$;

-- Convert gender column to enum type
DO $$ 
BEGIN
    -- Create the enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('Male', 'Female');
    END IF;

    -- Temporarily modify any 'Other' values to 'Male'
    UPDATE patients
    SET gender = 'Male'
    WHERE gender = 'Other';

    -- Convert the column to use the enum
    ALTER TABLE patients
    ALTER COLUMN gender TYPE gender_enum USING gender::gender_enum;
END
$$;
