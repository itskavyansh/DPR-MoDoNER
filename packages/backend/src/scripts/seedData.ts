#!/usr/bin/env node

import dotenv from 'dotenv';
import { DatabaseConnection } from '../database/connection.js';
import { HistoricalDataSeeder } from '../utils/seedHistoricalData.js';
import { seedGovernmentSchemes } from './seedGovernmentSchemes.js';

dotenv.config();

async function main() {
  console.log('Starting historical data seeding process...');
  
  const db = DatabaseConnection.getInstance();
  
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize schema if needed
    await db.initializeSchema();

    // Create seeder and run historical data
    const seeder = new HistoricalDataSeeder(db.getPool());
    await seeder.seedSampleData();

    // Seed government schemes data
    await seedGovernmentSchemes();

    console.log('All data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();