-- Initialize PostgreSQL database for DPR Quality Assessment System

-- Create database if not exists (handled by Docker environment)
-- CREATE DATABASE IF NOT EXISTS dpr_system;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size INTEGER NOT NULL,
    language VARCHAR(5) DEFAULT 'EN',
    processing_status VARCHAR(20) DEFAULT 'UPLOADED',
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    metadata JSONB
);

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    analysis_type VARCHAR(50) NOT NULL,
    results JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create historical_projects table for benchmarking
CREATE TABLE IF NOT EXISTS historical_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    estimated_duration INTEGER, -- in days
    actual_duration INTEGER, -- in days
    completion_status VARCHAR(20),
    completion_date DATE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create government_schemes table
CREATE TABLE IF NOT EXISTS government_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_name VARCHAR(255) NOT NULL,
    ministry VARCHAR(255),
    description TEXT,
    eligibility_criteria TEXT[],
    funding_range_min DECIMAL(15,2),
    funding_range_max DECIMAL(15,2),
    applicable_regions TEXT[],
    keywords TEXT[],
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_document_id ON analysis_results(document_id);
CREATE INDEX IF NOT EXISTS idx_historical_projects_location ON historical_projects(location);
CREATE INDEX IF NOT EXISTS idx_government_schemes_status ON government_schemes(status);

-- Insert sample data
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@mdoner.gov.in', '$2a$10$example_hash', 'admin'),
('analyst', 'analyst@mdoner.gov.in', '$2a$10$example_hash', 'analyst')
ON CONFLICT (username) DO NOTHING;