-- Database schema for DPR Quality Assessment System

-- Documents table - stores document metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('PDF', 'DOCX', 'TXT')),
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100) NOT NULL,
    language VARCHAR(2) CHECK (language IN ('EN', 'HI', 'AS')),
    processing_status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED' 
        CHECK (processing_status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    processing_start_time TIMESTAMP WITH TIME ZONE,
    processing_end_time TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    checksum VARCHAR(64) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document content table - stores extracted content
CREATE TABLE IF NOT EXISTS document_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    ocr_confidence DECIMAL(5,2),
    extraction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extracted sections table
CREATE TABLE IF NOT EXISTS extracted_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL 
        CHECK (section_type IN ('EXECUTIVE_SUMMARY', 'COST_ESTIMATE', 'TIMELINE', 'RESOURCES', 'TECHNICAL_SPECS', 'OTHER')),
    title VARCHAR(255),
    content TEXT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extracted entities table
CREATE TABLE IF NOT EXISTS extracted_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL 
        CHECK (entity_type IN ('MONETARY_VALUE', 'DATE', 'LOCATION', 'PERSON', 'ORGANIZATION', 'RESOURCE', 'OTHER')),
    value TEXT NOT NULL,
    normalized_value TEXT,
    confidence DECIMAL(5,2) NOT NULL,
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document processing logs table
CREATE TABLE IF NOT EXISTS document_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    stage VARCHAR(20) NOT NULL 
        CHECK (stage IN ('UPLOAD', 'OCR', 'EXTRACTION', 'CLASSIFICATION', 'ANALYSIS', 'COMPLETION')),
    status VARCHAR(20) NOT NULL 
        CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    message TEXT,
    error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_timestamp ON documents(upload_timestamp);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_document_content_document_id ON document_content(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_sections_document_id ON extracted_sections(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_sections_type ON extracted_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_extracted_entities_document_id ON extracted_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_entities_type ON extracted_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_processing_logs_document_id ON document_processing_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_stage ON document_processing_logs(stage);

-- Full-text search index for document content
CREATE INDEX IF NOT EXISTS idx_document_content_text_search ON document_content USING GIN(to_tsvector('english', raw_text));
CREATE INDEX IF NOT EXISTS idx_extracted_sections_text_search ON extracted_sections USING GIN(to_tsvector('english', content));

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_content_updated_at BEFORE UPDATE ON document_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
--
 Historical projects table for price comparison
CREATE TABLE IF NOT EXISTS historical_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    location_state VARCHAR(50) NOT NULL,
    location_district VARCHAR(100),
    location_coordinates POINT,
    estimated_cost DECIMAL(15,2) NOT NULL,
    actual_cost DECIMAL(15,2),
    estimated_duration_months INTEGER NOT NULL,
    actual_duration_months INTEGER,
    completion_status VARCHAR(20) NOT NULL DEFAULT 'ONGOING'
        CHECK (completion_status IN ('COMPLETED', 'ONGOING', 'DELAYED', 'CANCELLED')),
    start_date DATE NOT NULL,
    completion_date DATE,
    ministry VARCHAR(100),
    implementing_agency VARCHAR(200),
    schemes_used TEXT[],
    risk_factors TEXT[],
    project_category VARCHAR(50) NOT NULL,
    inflation_year INTEGER NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Historical cost items table for detailed price comparison
CREATE TABLE IF NOT EXISTS historical_cost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES historical_projects(id) ON DELETE CASCADE,
    item_category VARCHAR(100) NOT NULL,
    item_description TEXT NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(12,2),
    unit_rate DECIMAL(12,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    normalized_unit_rate DECIMAL(12,2), -- Adjusted for inflation and regional factors
    normalized_total_cost DECIMAL(15,2), -- Adjusted for inflation and regional factors
    regional_factor DECIMAL(5,3) DEFAULT 1.0,
    inflation_factor DECIMAL(5,3) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Regional cost factors table for normalization
CREATE TABLE IF NOT EXISTS regional_cost_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(50) NOT NULL,
    district VARCHAR(100),
    category VARCHAR(100) NOT NULL, -- e.g., 'LABOR', 'MATERIALS', 'EQUIPMENT'
    factor DECIMAL(5,3) NOT NULL DEFAULT 1.0,
    base_year INTEGER NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state, district, category, base_year, effective_from)
);

-- Inflation adjustment factors table
CREATE TABLE IF NOT EXISTS inflation_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'CONSTRUCTION', 'LABOR', 'MATERIALS'
    inflation_rate DECIMAL(6,4) NOT NULL,
    cumulative_factor DECIMAL(8,4) NOT NULL, -- Cumulative factor from base year
    base_year INTEGER NOT NULL DEFAULT 2020,
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, category, base_year)
);

-- Price benchmarks table for quick lookups
CREATE TABLE IF NOT EXISTS price_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_category VARCHAR(100) NOT NULL,
    item_description TEXT NOT NULL,
    unit VARCHAR(50),
    region VARCHAR(100) NOT NULL, -- State or region
    average_unit_rate DECIMAL(12,2) NOT NULL,
    median_unit_rate DECIMAL(12,2) NOT NULL,
    min_unit_rate DECIMAL(12,2) NOT NULL,
    max_unit_rate DECIMAL(12,2) NOT NULL,
    standard_deviation DECIMAL(12,2),
    sample_size INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    base_year INTEGER NOT NULL DEFAULT 2024,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_category, item_description, unit, region, base_year)
);

-- Indexes for historical data tables
CREATE INDEX IF NOT EXISTS idx_historical_projects_location_state ON historical_projects(location_state);
CREATE INDEX IF NOT EXISTS idx_historical_projects_project_type ON historical_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_historical_projects_completion_status ON historical_projects(completion_status);
CREATE INDEX IF NOT EXISTS idx_historical_projects_start_date ON historical_projects(start_date);
CREATE INDEX IF NOT EXISTS idx_historical_projects_project_category ON historical_projects(project_category);

CREATE INDEX IF NOT EXISTS idx_historical_cost_items_project_id ON historical_cost_items(project_id);
CREATE INDEX IF NOT EXISTS idx_historical_cost_items_category ON historical_cost_items(item_category);
CREATE INDEX IF NOT EXISTS idx_historical_cost_items_description ON historical_cost_items USING GIN(to_tsvector('english', item_description));

CREATE INDEX IF NOT EXISTS idx_regional_cost_factors_state_category ON regional_cost_factors(state, category);
CREATE INDEX IF NOT EXISTS idx_regional_cost_factors_effective_dates ON regional_cost_factors(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_inflation_factors_year_category ON inflation_factors(year, category);

CREATE INDEX IF NOT EXISTS idx_price_benchmarks_category_region ON price_benchmarks(item_category, region);
CREATE INDEX IF NOT EXISTS idx_price_benchmarks_description ON price_benchmarks USING GIN(to_tsvector('english', item_description));

-- Additional triggers for historical data tables
CREATE TRIGGER update_historical_projects_updated_at BEFORE UPDATE ON historical_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_benchmarks_updated_at BEFORE UPDATE ON price_benchmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Government schemes table for scheme identification
CREATE TABLE IF NOT EXISTS government_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_name VARCHAR(255) NOT NULL,
    scheme_code VARCHAR(50) UNIQUE,
    ministry VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    description TEXT NOT NULL,
    objectives TEXT[],
    eligibility_criteria TEXT[] NOT NULL,
    funding_range_min DECIMAL(15,2),
    funding_range_max DECIMAL(15,2),
    applicable_regions TEXT[] NOT NULL, -- States/UTs where scheme is applicable
    applicable_sectors TEXT[] NOT NULL, -- e.g., 'INFRASTRUCTURE', 'EDUCATION', 'HEALTH'
    target_beneficiaries TEXT[], -- e.g., 'RURAL_POPULATION', 'WOMEN', 'SC_ST'
    keywords TEXT[] NOT NULL, -- For semantic matching
    scheme_type VARCHAR(50) NOT NULL 
        CHECK (scheme_type IN ('CENTRALLY_SPONSORED', 'CENTRAL_SECTOR', 'STATE_SCHEME', 'JOINT_SCHEME')),
    launch_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED')),
    website_url VARCHAR(500),
    contact_details JSONB,
    guidelines_url VARCHAR(500),
    application_process TEXT,
    required_documents TEXT[],
    processing_time_days INTEGER,
    approval_authority VARCHAR(200),
    monitoring_mechanism TEXT,
    success_metrics TEXT[],
    budget_allocation DECIMAL(15,2),
    budget_year INTEGER,
    utilization_percentage DECIMAL(5,2),
    beneficiaries_count INTEGER,
    projects_funded INTEGER,
    average_funding_amount DECIMAL(15,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(100) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'NEEDS_UPDATE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheme categories table for better organization
CREATE TABLE IF NOT EXISTS scheme_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id UUID REFERENCES scheme_categories(id),
    description TEXT,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for scheme-category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS scheme_category_mappings (
    scheme_id UUID NOT NULL REFERENCES government_schemes(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES scheme_categories(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scheme_id, category_id)
);

-- Scheme matching history table to track DPR-scheme matches
CREATE TABLE IF NOT EXISTS scheme_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES government_schemes(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL 
        CHECK (match_type IN ('SEMANTIC', 'KEYWORD', 'CATEGORY', 'MANUAL')),
    relevance_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    confidence_score DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    matching_keywords TEXT[],
    matching_criteria TEXT[],
    gap_analysis JSONB, -- Analysis of missing criteria or requirements
    recommendation_reason TEXT,
    match_status VARCHAR(20) DEFAULT 'SUGGESTED'
        CHECK (match_status IN ('SUGGESTED', 'ACCEPTED', 'REJECTED', 'UNDER_REVIEW')),
    reviewed_by VARCHAR(100),
    review_timestamp TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheme verification and gap analysis results
CREATE TABLE IF NOT EXISTS scheme_gap_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    existing_schemes_mentioned TEXT[], -- Schemes already referenced in DPR
    verified_schemes UUID[], -- IDs of schemes that are correctly referenced
    missing_opportunities UUID[], -- IDs of schemes that could be applicable but not mentioned
    incorrect_references TEXT[], -- Schemes mentioned but not applicable
    optimization_suggestions TEXT[],
    completeness_score DECIMAL(5,2), -- Percentage of applicable schemes covered
    gap_severity VARCHAR(20) DEFAULT 'MEDIUM'
        CHECK (gap_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    analysis_version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for government schemes tables
CREATE INDEX IF NOT EXISTS idx_government_schemes_ministry ON government_schemes(ministry);
CREATE INDEX IF NOT EXISTS idx_government_schemes_status ON government_schemes(status);
CREATE INDEX IF NOT EXISTS idx_government_schemes_scheme_type ON government_schemes(scheme_type);
CREATE INDEX IF NOT EXISTS idx_government_schemes_applicable_regions ON government_schemes USING GIN(applicable_regions);
CREATE INDEX IF NOT EXISTS idx_government_schemes_applicable_sectors ON government_schemes USING GIN(applicable_sectors);
CREATE INDEX IF NOT EXISTS idx_government_schemes_keywords ON government_schemes USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_government_schemes_funding_range ON government_schemes(funding_range_min, funding_range_max);
CREATE INDEX IF NOT EXISTS idx_government_schemes_launch_date ON government_schemes(launch_date);
CREATE INDEX IF NOT EXISTS idx_government_schemes_end_date ON government_schemes(end_date);

CREATE INDEX IF NOT EXISTS idx_scheme_categories_parent ON scheme_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_scheme_categories_name ON scheme_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_scheme_matches_document_id ON scheme_matches(document_id);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_scheme_id ON scheme_matches(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_relevance_score ON scheme_matches(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_match_type ON scheme_matches(match_type);
CREATE INDEX IF NOT EXISTS idx_scheme_matches_match_status ON scheme_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_scheme_gap_analysis_document_id ON scheme_gap_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_scheme_gap_analysis_completeness_score ON scheme_gap_analysis(completeness_score);
CREATE INDEX IF NOT EXISTS idx_scheme_gap_analysis_gap_severity ON scheme_gap_analysis(gap_severity);

-- Full-text search indexes for scheme content
CREATE INDEX IF NOT EXISTS idx_government_schemes_text_search ON government_schemes 
    USING GIN(to_tsvector('english', scheme_name || ' ' || description || ' ' || COALESCE(array_to_string(keywords, ' '), '')));

CREATE INDEX IF NOT EXISTS idx_scheme_categories_text_search ON scheme_categories 
    USING GIN(to_tsvector('english', category_name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(keywords, ' '), '')));

-- Triggers for government schemes tables
CREATE TRIGGER update_government_schemes_updated_at BEFORE UPDATE ON government_schemes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheme_matches_updated_at BEFORE UPDATE ON scheme_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();