#!/usr/bin/env node
/**
 * Apple Design System - MCP Server for Claude Desktop
 * Allows Claude to generate design systems programmatically
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server({
  name: 'apple-design-system',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'generate_design_system',
        description: 'Generate complete design system foundation',
        inputSchema: {
          type: 'object',
          properties: {
            brandName: { type: 'string', description: 'Brand/product name' },
            description: { type: 'string', description: 'Product/service description' },
            audience: { type: 'string', description: 'Target audience' }
          },
          required: ['brandName', 'description']
        }
      },
      {
        name: 'generate_color_system',
        description: 'Generate color palette and system',
        inputSchema: {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            primaryColor: { type: 'string', description: 'Primary brand color (HEX)' },
            mood: { type: 'string', description: 'Brand mood (professional, playful, luxury, etc.)' }
          },
          required: ['brandName', 'primaryColor']
        }
      },
      {
        name: 'generate_typography',
        description: 'Generate typography system',
        inputSchema: {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            style: { type: 'string', description: 'Typography style (modern, classic, tech, minimal)' }
          },
          required: ['brandName', 'style']
        }
      },
      {
        name: 'generate_components',
        description: 'Generate UI component library',
        inputSchema: {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            categories: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Component categories: buttons, inputs, cards, navigation, feedback'
            }
          },
          required: ['brandName']
        }
      },
      {
        name: 'generate_marketing_assets',
        description: 'Generate marketing asset specifications',
        inputSchema: {
          type: 'object',
          properties: {
            brandName: { type: 'string' },
            assetTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Types: social, ads, email, print, presentation'
            }
          },
          required: ['brandName', 'assetTypes']
        }
      }
    ]
  };
});

// Tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'generate_design_system':
      return {
        content: [{
          type: 'text',
          text: `Design System Foundation for ${args.brandName}\n\n` +
                `Use Prompt 1 from Apple Design System skill:\n` +
                `Brand: ${args.brandName}\n` +
                `Description: ${args.description}\n` +
                `Audience: ${args.audience || 'General'}\n\n` +
                `See: skills/apple-design-system/SKILL.md`
        }]
      };
      
    case 'generate_color_system':
      return {
        content: [{
          type: 'text',
          text: `Color System for ${args.brandName}\n\n` +
                `Use Prompt 2 from Apple Design System skill:\n` +
                `Primary: ${args.primaryColor}\n` +
                `Mood: ${args.mood || 'Professional'}\n\n` +
                `See: skills/apple-design-system/SKILL.md`
        }]
      };
      
    case 'generate_typography':
      return {
        content: [{
          type: 'text',
          text: `Typography System for ${args.brandName}\n\n` +
                `Use Prompt 3 from Apple Design System skill:\n` +
                `Style: ${args.style}\n\n` +
                `See: skills/apple-design-system/SKILL.md`
        }]
      };
      
    case 'generate_components':
      return {
        content: [{
          type: 'text',
          text: `Component Library for ${args.brandName}\n\n` +
                `Use Prompts 5-7 from Apple Design System skill:\n` +
                `Categories: ${(args.categories || ['all']).join(', ')}\n\n` +
                `See: skills/apple-design-system/SKILL.md`
        }]
      };
      
    case 'generate_marketing_assets':
      return {
        content: [{
          type: 'text',
          text: `Marketing Assets for ${args.brandName}\n\n` +
                `Use Prompts 9-10 from Apple Design System skill:\n` +
                `Types: ${args.assetTypes.join(', ')}\n\n` +
                `See: skills/apple-design-system/SKILL.md`
        }]
      };
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

console.error('Apple Design System MCP Server running...');
