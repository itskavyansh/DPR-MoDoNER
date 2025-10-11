import { DatabaseConnection } from '../database/connection.js';
import { GovernmentSchemesRepository } from '../repositories/governmentSchemesRepository.js';
import { GovernmentSchemesService } from '../services/governmentSchemesService.js';
import { GovernmentScheme } from '../../../shared/src/types/index.js';

// Sample government schemes data for Northeast India
const sampleSchemes: Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    schemeName: "North Eastern Strategic Road Investment Program (NESRIP)",
    schemeCode: "NESRIP-2024",
    ministry: "Ministry of Development of North Eastern Region",
    department: "Department of Development of North Eastern Region",
    description: "A comprehensive road infrastructure development program aimed at improving connectivity in Northeast India through construction and upgradation of strategic roads.",
    objectives: [
      "Improve road connectivity in remote areas of Northeast India",
      "Enhance economic development through better transportation",
      "Strengthen border area infrastructure",
      "Promote tourism and trade in the region"
    ],
    eligibilityCriteria: [
      "Projects must be located in Northeast India states",
      "Roads must have strategic importance for regional connectivity",
      "Minimum project cost of Rs. 10 crores",
      "Environmental clearance must be obtained",
      "Local community consent required"
    ],
    fundingRangeMin: 100000000, // 10 crores
    fundingRangeMax: 5000000000, // 500 crores
    applicableRegions: [
      "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", 
      "Mizoram", "Nagaland", "Sikkim", "Tripura"
    ],
    applicableSectors: [
      "Infrastructure", "Transportation", "Road Development", "Border Infrastructure"
    ],
    targetBeneficiaries: [
      "Rural Population", "Border Communities", "Tribal Communities", "Local Businesses"
    ],
    keywords: [
      "road", "infrastructure", "connectivity", "northeast", "strategic", "transportation",
      "border", "rural", "development", "highway", "bridge"
    ],
    schemeType: "CENTRALLY_SPONSORED",
    launchDate: new Date("2020-04-01"),
    status: "ACTIVE",
    websiteUrl: "https://mdoner.gov.in/schemes/nesrip",
    contactDetails: {
      email: "nesrip@mdoner.gov.in",
      phone: "+91-11-23093000",
      address: "Vigyan Bhawan Annexe, New Delhi - 110001"
    },
    guidelinesUrl: "https://mdoner.gov.in/sites/default/files/NESRIP_Guidelines.pdf",
    applicationProcess: "Applications must be submitted through state governments with detailed project reports, environmental clearances, and cost estimates.",
    requiredDocuments: [
      "Detailed Project Report (DPR)",
      "Environmental Impact Assessment",
      "Land Acquisition Certificate",
      "State Government Recommendation",
      "Cost Estimates and Technical Drawings",
      "Community Consent Certificate"
    ],
    processingTimeDays: 180,
    approvalAuthority: "Ministry of Development of North Eastern Region",
    monitoringMechanism: "Quarterly progress reports and on-site inspections by MDONER officials",
    successMetrics: [
      "Kilometers of roads constructed/upgraded",
      "Reduction in travel time",
      "Increase in economic activity",
      "Number of villages connected"
    ],
    budgetAllocation: 25000000000, // 2500 crores
    budgetYear: 2024,
    utilizationPercentage: 78.5,
    beneficiariesCount: 2500000,
    projectsFunded: 145,
    averageFundingAmount: 250000000, // 25 crores
    lastUpdated: new Date(),
    dataSource: "Ministry of Development of North Eastern Region Official Website",
    verificationStatus: "VERIFIED"
  },
  {
    schemeName: "North East Rural Livelihood Project (NERLP)",
    schemeCode: "NERLP-2024",
    ministry: "Ministry of Development of North Eastern Region",
    department: "Department of Development of North Eastern Region",
    description: "A World Bank assisted project focused on improving rural livelihoods and reducing poverty in Northeast India through community-driven development approaches.",
    objectives: [
      "Reduce rural poverty in Northeast India",
      "Strengthen community institutions",
      "Improve access to financial services",
      "Enhance agricultural productivity and market linkages"
    ],
    eligibilityCriteria: [
      "Projects must target rural communities in Northeast states",
      "Focus on Below Poverty Line (BPL) families",
      "Community participation and ownership required",
      "Sustainable livelihood approach mandatory",
      "Gender inclusion targets must be met"
    ],
    fundingRangeMin: 5000000, // 50 lakhs
    fundingRangeMax: 500000000, // 50 crores
    applicableRegions: [
      "Assam", "Manipur", "Meghalaya", "Tripura"
    ],
    applicableSectors: [
      "Rural Development", "Agriculture", "Livelihood", "Poverty Alleviation", "Community Development"
    ],
    targetBeneficiaries: [
      "Rural Poor", "Women", "Tribal Communities", "Small Farmers", "Landless Laborers"
    ],
    keywords: [
      "rural", "livelihood", "poverty", "community", "agriculture", "women",
      "tribal", "development", "income", "employment", "self-help"
    ],
    schemeType: "CENTRALLY_SPONSORED",
    launchDate: new Date("2012-07-01"),
    endDate: new Date("2025-06-30"),
    status: "ACTIVE",
    websiteUrl: "https://mdoner.gov.in/schemes/nerlp",
    contactDetails: {
      email: "nerlp@mdoner.gov.in",
      phone: "+91-11-23093001",
      address: "Vigyan Bhawan Annexe, New Delhi - 110001"
    },
    guidelinesUrl: "https://mdoner.gov.in/sites/default/files/NERLP_Guidelines.pdf",
    applicationProcess: "Applications through Community Resource Persons (CRPs) and Village Organizations (VOs) with support from implementing agencies.",
    requiredDocuments: [
      "Community Development Plan",
      "Beneficiary List with BPL Certificates",
      "Village Organization Registration",
      "Project Proposal with Budget",
      "Social and Environmental Screening",
      "Gender Action Plan"
    ],
    processingTimeDays: 90,
    approvalAuthority: "State Project Management Unit (SPMU)",
    monitoringMechanism: "Monthly progress reports, social audits, and third-party monitoring",
    successMetrics: [
      "Number of households lifted above poverty line",
      "Increase in household income",
      "Number of women in leadership roles",
      "Sustainability of community institutions"
    ],
    budgetAllocation: 15000000000, // 1500 crores
    budgetYear: 2024,
    utilizationPercentage: 85.2,
    beneficiariesCount: 1800000,
    projectsFunded: 2500,
    averageFundingAmount: 12000000, // 1.2 crores
    lastUpdated: new Date(),
    dataSource: "World Bank Project Documents and MDONER Reports",
    verificationStatus: "VERIFIED"
  },
  {
    schemeName: "North Eastern Region Power System Improvement Project (NERPSIP)",
    schemeCode: "NERPSIP-2024",
    ministry: "Ministry of Power",
    department: "Department of Power",
    description: "A comprehensive power sector development project aimed at improving electricity access, reliability, and quality in Northeast India.",
    objectives: [
      "Improve power supply reliability in Northeast India",
      "Expand electricity access to unelectrified areas",
      "Strengthen transmission and distribution infrastructure",
      "Promote renewable energy development"
    ],
    eligibilityCriteria: [
      "Power infrastructure projects in Northeast states",
      "Focus on rural and remote area electrification",
      "Technical feasibility and financial viability required",
      "Environmental and social safeguards compliance",
      "State electricity board participation mandatory"
    ],
    fundingRangeMin: 200000000, // 20 crores
    fundingRangeMax: 10000000000, // 1000 crores
    applicableRegions: [
      "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", 
      "Mizoram", "Nagaland", "Sikkim", "Tripura"
    ],
    applicableSectors: [
      "Power", "Energy", "Electricity", "Renewable Energy", "Infrastructure"
    ],
    targetBeneficiaries: [
      "Rural Households", "Industrial Units", "Commercial Establishments", "Public Institutions"
    ],
    keywords: [
      "power", "electricity", "energy", "transmission", "distribution", "grid",
      "renewable", "solar", "hydro", "rural electrification", "infrastructure"
    ],
    schemeType: "CENTRAL_SECTOR",
    launchDate: new Date("2014-03-01"),
    status: "ACTIVE",
    websiteUrl: "https://powermin.gov.in/schemes/nerpsip",
    contactDetails: {
      email: "nerpsip@powermin.gov.in",
      phone: "+91-11-23710271",
      address: "Shram Shakti Bhawan, New Delhi - 110001"
    },
    guidelinesUrl: "https://powermin.gov.in/sites/default/files/NERPSIP_Guidelines.pdf",
    applicationProcess: "Applications through State Electricity Boards with detailed technical and financial proposals.",
    requiredDocuments: [
      "Detailed Project Report with Technical Specifications",
      "Financial Viability Analysis",
      "Environmental Impact Assessment",
      "Land Acquisition and R&R Plan",
      "State Government Approval",
      "Grid Integration Study"
    ],
    processingTimeDays: 120,
    approvalAuthority: "Ministry of Power",
    monitoringMechanism: "Monthly progress monitoring through online portal and field inspections",
    successMetrics: [
      "Number of villages electrified",
      "Reduction in transmission and distribution losses",
      "Improvement in power supply hours",
      "Increase in renewable energy capacity"
    ],
    budgetAllocation: 35000000000, // 3500 crores
    budgetYear: 2024,
    utilizationPercentage: 72.8,
    beneficiariesCount: 3200000,
    projectsFunded: 89,
    averageFundingAmount: 450000000, // 45 crores
    lastUpdated: new Date(),
    dataSource: "Ministry of Power Official Records",
    verificationStatus: "VERIFIED"
  },
  {
    schemeName: "Bamboo Development Scheme for Northeast India",
    schemeCode: "BDS-NE-2024",
    ministry: "Ministry of Development of North Eastern Region",
    department: "Department of Development of North Eastern Region",
    description: "A specialized scheme to promote bamboo cultivation, processing, and value addition in Northeast India, leveraging the region's natural bamboo resources.",
    objectives: [
      "Promote sustainable bamboo cultivation and management",
      "Develop bamboo-based industries and value chains",
      "Generate employment opportunities in rural areas",
      "Support bamboo research and technology development"
    ],
    eligibilityCriteria: [
      "Bamboo cultivation or processing projects in Northeast states",
      "Minimum 5 hectares for cultivation projects",
      "Technical know-how and market linkage required",
      "Environmental sustainability measures mandatory",
      "Community participation in forest-based projects"
    ],
    fundingRangeMin: 2000000, // 20 lakhs
    fundingRangeMax: 200000000, // 20 crores
    applicableRegions: [
      "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", 
      "Mizoram", "Nagaland", "Sikkim", "Tripura"
    ],
    applicableSectors: [
      "Agriculture", "Forestry", "Rural Development", "MSME", "Handicrafts"
    ],
    targetBeneficiaries: [
      "Farmers", "Tribal Communities", "Rural Entrepreneurs", "Self Help Groups", "Cooperatives"
    ],
    keywords: [
      "bamboo", "cultivation", "processing", "handicrafts", "rural", "employment",
      "sustainable", "forest", "value-addition", "MSME", "tribal"
    ],
    schemeType: "CENTRALLY_SPONSORED",
    launchDate: new Date("2018-04-01"),
    status: "ACTIVE",
    websiteUrl: "https://mdoner.gov.in/schemes/bamboo-development",
    contactDetails: {
      email: "bamboo@mdoner.gov.in",
      phone: "+91-11-23093002",
      address: "Vigyan Bhawan Annexe, New Delhi - 110001"
    },
    guidelinesUrl: "https://mdoner.gov.in/sites/default/files/Bamboo_Development_Guidelines.pdf",
    applicationProcess: "Applications through State Bamboo Development Agencies with business plans and technical proposals.",
    requiredDocuments: [
      "Business Plan and Project Proposal",
      "Land Documents and Cultivation Plan",
      "Technical Feasibility Report",
      "Market Linkage Agreement",
      "Environmental Compliance Certificate",
      "Community Consent (for forest areas)"
    ],
    processingTimeDays: 60,
    approvalAuthority: "State Bamboo Development Agency",
    monitoringMechanism: "Quarterly field visits and progress reports through state agencies",
    successMetrics: [
      "Area under bamboo cultivation",
      "Number of processing units established",
      "Employment generated",
      "Value of bamboo products marketed"
    ],
    budgetAllocation: 5000000000, // 500 crores
    budgetYear: 2024,
    utilizationPercentage: 68.4,
    beneficiariesCount: 450000,
    projectsFunded: 1200,
    averageFundingAmount: 8500000, // 85 lakhs
    lastUpdated: new Date(),
    dataSource: "National Bamboo Mission and MDONER Records",
    verificationStatus: "VERIFIED"
  },
  {
    schemeName: "Northeast Tourism Development Scheme",
    schemeCode: "NETDS-2024",
    ministry: "Ministry of Tourism",
    department: "Department of Tourism",
    description: "A comprehensive tourism development scheme focused on promoting Northeast India as a premier tourist destination through infrastructure development and capacity building.",
    objectives: [
      "Develop tourism infrastructure in Northeast India",
      "Promote cultural and eco-tourism",
      "Generate employment in tourism sector",
      "Preserve and showcase regional heritage and culture"
    ],
    eligibilityCriteria: [
      "Tourism infrastructure projects in Northeast states",
      "Focus on sustainable and responsible tourism",
      "Local community involvement required",
      "Heritage and cultural preservation component",
      "Environmental impact assessment mandatory"
    ],
    fundingRangeMin: 10000000, // 1 crore
    fundingRangeMax: 1000000000, // 100 crores
    applicableRegions: [
      "Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", 
      "Mizoram", "Nagaland", "Sikkim", "Tripura"
    ],
    applicableSectors: [
      "Tourism", "Hospitality", "Culture", "Heritage", "Infrastructure"
    ],
    targetBeneficiaries: [
      "Local Communities", "Tourism Entrepreneurs", "Artisans", "Tour Operators", "Hospitality Workers"
    ],
    keywords: [
      "tourism", "heritage", "culture", "eco-tourism", "hospitality", "infrastructure",
      "destination", "promotion", "sustainable", "community", "employment"
    ],
    schemeType: "CENTRALLY_SPONSORED",
    launchDate: new Date("2016-01-01"),
    status: "ACTIVE",
    websiteUrl: "https://tourism.gov.in/schemes/netds",
    contactDetails: {
      email: "netds@tourism.gov.in",
      phone: "+91-11-23711296",
      address: "Transport Bhawan, New Delhi - 110001"
    },
    guidelinesUrl: "https://tourism.gov.in/sites/default/files/NETDS_Guidelines.pdf",
    applicationProcess: "Applications through State Tourism Departments with detailed project proposals and sustainability plans.",
    requiredDocuments: [
      "Tourism Development Plan",
      "Infrastructure Development Proposal",
      "Environmental Impact Assessment",
      "Community Participation Plan",
      "Heritage Conservation Plan",
      "Marketing and Promotion Strategy"
    ],
    processingTimeDays: 90,
    approvalAuthority: "Ministry of Tourism",
    monitoringMechanism: "Bi-annual review meetings and impact assessment studies",
    successMetrics: [
      "Number of tourists visiting the region",
      "Tourism infrastructure created",
      "Employment generated in tourism sector",
      "Revenue generated from tourism"
    ],
    budgetAllocation: 8000000000, // 800 crores
    budgetYear: 2024,
    utilizationPercentage: 75.6,
    beneficiariesCount: 650000,
    projectsFunded: 320,
    averageFundingAmount: 35000000, // 3.5 crores
    lastUpdated: new Date(),
    dataSource: "Ministry of Tourism Official Database",
    verificationStatus: "VERIFIED"
  }
];

async function seedGovernmentSchemes() {
  console.log('Starting government schemes data seeding...');
  
  try {
    // Initialize database connection
    const db = DatabaseConnection.getInstance();
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize repository and service
    const repository = new GovernmentSchemesRepository(db.getPool());
    const service = new GovernmentSchemesService(repository);

    // Check if schemes already exist
    const existingSchemes = await service.searchSchemes({
      pagination: { page: 1, limit: 10 }
    });

    if (existingSchemes.totalCount > 0) {
      console.log(`Found ${existingSchemes.totalCount} existing schemes. Skipping seed data.`);
      return;
    }

    // Seed the sample schemes
    console.log(`Seeding ${sampleSchemes.length} government schemes...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const schemeData of sampleSchemes) {
      try {
        const createdScheme = await service.createScheme(schemeData);
        console.log(`✓ Created scheme: ${createdScheme.schemeName}`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to create scheme: ${schemeData.schemeName}`, error);
        errorCount++;
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Successfully created: ${successCount} schemes`);
    console.log(`Failed: ${errorCount} schemes`);
    console.log(`Total processed: ${sampleSchemes.length} schemes`);

    // Display statistics
    const stats = await service.getSchemeStatistics();
    console.log('\n=== Database Statistics ===');
    console.log(`Total schemes in database: ${stats.totalSchemes}`);
    console.log(`Active schemes: ${stats.activeSchemes}`);
    console.log('Schemes by ministry:', stats.schemesByMinistry);
    console.log('Schemes by type:', stats.schemesByType);

  } catch (error) {
    console.error('Error seeding government schemes:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGovernmentSchemes()
    .then(() => {
      console.log('Government schemes seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Government schemes seeding failed:', error);
      process.exit(1);
    });
}

export { seedGovernmentSchemes, sampleSchemes };