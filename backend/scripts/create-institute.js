#!/usr/bin/env node

/**
 * Script to create a test institute in Firebase
 * Run: node backend/scripts/create-institute.js
 */

require('dotenv').config();
const { db } = require('../config/firebase');
const Institute = require('../models/Institute');

async function createTestInstitute() {
  try {
    console.log('🏫 Creating test institute...\n');

    const instituteData = {
      name: 'Allen Career Institute',
      email: 'admin@allen.com',
      phone: '+91-9876543210',
      referralCode: 'ALLEN2024',
      
      // Branding
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Allen_Career_Institute_Logo.svg/1200px-Allen_Career_Institute_Logo.svg.png',
      primaryColor: '#FF5733',      // Orange-red
      secondaryColor: '#FFC300',    // Yellow
      accentColor: '#10B981',       // Green
      subdomain: 'allen',
      
      // Business
      commissionPercentage: 10,
      planType: 'premium',
      status: 'active'
    };

    const institute = await Institute.create(instituteData);

    console.log('✅ Institute created successfully!\n');
    console.log('Institute Details:');
    console.log('─────────────────────────────────────');
    console.log(`Name: ${institute.name}`);
    console.log(`Referral Code: ${institute.referralCode}`);
    console.log(`Email: ${institute.email}`);
    console.log(`Primary Color: ${institute.primaryColor}`);
    console.log(`Commission: ${institute.commissionPercentage}%`);
    console.log(`Status: ${institute.status}`);
    console.log('─────────────────────────────────────\n');
    
    console.log('📝 Test URLs:');
    console.log(`Signup: http://localhost:3000/signup?ref=${institute.referralCode}`);
    console.log(`Login: http://localhost:3000/login?ref=${institute.referralCode}\n`);
    
    console.log('🎨 Branding Colors:');
    console.log(`Primary: ${institute.primaryColor}`);
    console.log(`Secondary: ${institute.secondaryColor}`);
    console.log(`Accent: ${institute.accentColor}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating institute:', error.message);
    process.exit(1);
  }
}

createTestInstitute();
