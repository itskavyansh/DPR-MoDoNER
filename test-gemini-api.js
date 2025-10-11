#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🤖 Testing Gemini API Key...\n');

const apiKey = process.env.GEMINI_API_KEY;
console.log(`API Key found: ${apiKey ? 'Yes' : 'No'}`);
console.log(`API Key length: ${apiKey ? apiKey.length : 0} characters`);

if (apiKey) {
  try {
    console.log('\n🔍 Testing Gemini API connection...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list available models first
    try {
      console.log('\n📋 Listing available models...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      const data = await response.json();
      
      if (data.models) {
        console.log('✅ Available models:');
        data.models.forEach(model => {
          console.log(`   - ${model.name}`);
        });
        
        // Try the first available model
        if (data.models.length > 0) {
          const firstModel = data.models[0].name;
          console.log(`\n🧪 Testing with first available model: ${firstModel}`);
          
          const model = genAI.getGenerativeModel({ model: firstModel });
          const prompt = `Analyze this DPR project: "National Highway 44 Expansion Project - Delhi to Chandigarh". Respond with JSON: {"projectType": "Highway Infrastructure", "location": "Delhi to Chandigarh", "summary": "Brief description"}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          console.log(`✅ Model ${firstModel} works!`);
          console.log('🤖 Sample AI Response:');
          console.log(text);
        }
      } else {
        console.log('❌ No models found or API error');
        console.log('Response:', data);
      }
    } catch (listError) {
      console.log('❌ Failed to list models:', listError.message);
      
      // Fallback: try common model names
      const modelNames = ['gemini-pro', 'text-bison-001', 'chat-bison-001'];
      
      for (const modelName of modelNames) {
        try {
          console.log(`\n🧪 Trying fallback model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const prompt = `Analyze this DPR project: "National Highway 44 Expansion Project - Delhi to Chandigarh". Respond with JSON: {"projectType": "Highway Infrastructure", "location": "Delhi to Chandigarh", "summary": "Brief description"}`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          console.log(`✅ Model ${modelName} works!`);
          console.log('🤖 Sample AI Response:');
          console.log(text);
          break;
          
        } catch (modelError) {
          console.log(`❌ Model ${modelName} failed: ${modelError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
  }
} else {
  console.log('\n❌ GEMINI_API_KEY not found in environment variables');
  console.log('Please check your .env file');
}

console.log('\n🎯 Test completed!');