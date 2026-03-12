import axios from "axios";

/**
 * AI Client for the Circular Economy Marketplace
 * Supports OpenAI API when OPENAI_API_KEY is provided
 * Falls back to intelligent mock responses otherwise
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  general: `You are an AI assistant for a Circular Economy Marketplace platform that connects businesses and individuals to exchange reusable materials. Your role is to:

1. Help users understand sustainability and circular economy concepts
2. Analyze material listings and suggest optimal reuse opportunities
3. Provide insights on environmental impact (CO2 savings, waste diversion)
4. Recommend material categories, pricing, and potential matches
5. Answer questions about recycling, upcycling, and material reuse

Always be helpful, accurate, and encourage sustainable practices. When discussing environmental impact, use concrete numbers when possible (e.g., "reusing 1 ton of steel saves approximately 1.8 tons of CO2").

Platform context:
- Materials include: construction materials, textiles, plastics, metals, electronics, packaging, etc.
- Impact metrics tracked: weight diverted from landfill (kg), CO2 saved (kg), reuse count
- Environmental equivalents: trees planted, cars off road, flights avoided`,

  material_analysis: `You are an expert material analyst for a Circular Economy Marketplace. When analyzing materials:

1. Identify reuse potential and alternative applications
2. Suggest appropriate categories and subcategories
3. Estimate environmental impact of reusing vs disposing
4. Recommend fair pricing based on condition and market value
5. Identify potential buyer personas (manufacturers, artists, DIYers, etc.)
6. Flag any hazardous material concerns

Provide structured, actionable insights that help sellers maximize the value and impact of their materials.`,

  reuse_suggestions: `You are a creative reuse consultant for a Circular Economy Marketplace. Your expertise is finding innovative ways to repurpose materials. Consider:

1. Traditional reuse (same purpose in different location)
2. Upcycling (transforming into higher-value products)
3. Downcycling (using for less demanding applications)
4. Creative repurposing (artistic or unconventional uses)
5. Component harvesting (extracting valuable parts)

Always consider safety, feasibility, and environmental benefit of suggestions.`,

  sustainability_qa: `You are a sustainability educator for a Circular Economy Marketplace. Help users understand:

1. Environmental benefits of material reuse
2. Carbon footprint calculations
3. Circular economy principles
4. Waste hierarchy (reduce, reuse, recycle)
5. Lifecycle assessment concepts
6. Regulatory considerations for material reuse

Provide accurate, science-based information while making it accessible and actionable.`,
};

// Material categories with impact factors for context
const CATEGORY_CONTEXT = {
  construction_materials: {
    co2PerKg: 2.5,
    examples: "bricks, lumber, pipes, fixtures",
    reuse_potential: "high",
  },
  textiles: {
    co2PerKg: 20,
    examples: "fabric rolls, clothing, upholstery",
    reuse_potential: "medium-high",
  },
  plastics: {
    co2PerKg: 3.5,
    examples: "containers, packaging, pipes",
    reuse_potential: "medium",
  },
  metals: {
    co2PerKg: 8,
    examples: "steel, aluminum, copper",
    reuse_potential: "very high",
  },
  electronics: {
    co2PerKg: 50,
    examples: "computers, phones, components",
    reuse_potential: "high (component level)",
  },
  packaging: {
    co2PerKg: 2,
    examples: "boxes, pallets, crates",
    reuse_potential: "high",
  },
  furniture: {
    co2PerKg: 5,
    examples: "desks, chairs, shelving",
    reuse_potential: "very high",
  },
  glass: {
    co2PerKg: 1.5,
    examples: "windows, bottles, containers",
    reuse_potential: "high",
  },
};

/**
 * Check if OpenAI API is configured
 */
export const isOpenAIConfigured = () => {
  return !!process.env.OPENAI_API_KEY;
};

/**
 * Get the appropriate system prompt based on context
 */
export const getSystemPrompt = (type = "general") => {
  return SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
};

/**
 * Call OpenAI API
 */
export const callOpenAI = async ({
  messages,
  model = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1000,
  systemPrompt = SYSTEM_PROMPTS.general,
}) => {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model,
        messages: fullMessages,
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
      finishReason: response.data.choices[0].finish_reason,
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw error;
  }
};

/**
 * Generate intelligent mock response when OpenAI is not configured
 */
export const generateMockResponse = (message, context = {}) => {
  const lowerMessage = message.toLowerCase();
  
  // Material analysis patterns
  if (lowerMessage.includes("analyze") || lowerMessage.includes("material")) {
    if (context.material) {
      return generateMaterialAnalysis(context.material);
    }
    return `I'd be happy to analyze materials for you! Please share details about the material you'd like me to analyze, including:
    
1. **Type of material** (e.g., wood, metal, plastic, textile)
2. **Condition** (new, like new, good, fair, salvage)
3. **Quantity** and unit (e.g., 50 kg, 100 pieces)
4. **Current location** (city/region)

Once you provide these details, I can suggest:
- Potential reuse opportunities
- Estimated environmental impact
- Fair pricing recommendations
- Likely buyer profiles`;
  }

  // Reuse suggestions
  if (lowerMessage.includes("reuse") || lowerMessage.includes("repurpose") || lowerMessage.includes("upcycle")) {
    return generateReuseSuggestions(lowerMessage, context);
  }

  // Sustainability questions
  if (lowerMessage.includes("co2") || lowerMessage.includes("carbon") || lowerMessage.includes("environment") || lowerMessage.includes("impact")) {
    return generateSustainabilityInfo(lowerMessage);
  }

  // Pricing questions
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("value")) {
    return `Pricing reusable materials depends on several factors:

**Key Pricing Factors:**
1. **Condition** - New or like-new items command 60-80% of retail; good condition 40-60%; fair 20-40%
2. **Material type** - Metals typically retain more value than plastics
3. **Quantity** - Bulk quantities often get discounts (10-20% off per unit)
4. **Logistics** - Items requiring special handling may need price adjustment
5. **Market demand** - Check similar listings on our platform

**Recommended Approach:**
- Start with a fair price and be open to negotiation
- For free items, emphasize the "environmental karma" value
- Consider offering bulk discounts for larger quantities

Would you like me to suggest pricing for a specific material?`;
  }

  // Circular economy concepts
  if (lowerMessage.includes("circular economy") || lowerMessage.includes("what is")) {
    return generateCircularEconomyInfo();
  }

  // Category questions
  if (lowerMessage.includes("category") || lowerMessage.includes("categorize")) {
    return `Our platform organizes materials into these main categories:

**Available Categories:**
1. **Construction Materials** - Bricks, lumber, tiles, fixtures, pipes
2. **Textiles & Fabrics** - Fabric rolls, clothing, upholstery, carpets
3. **Plastics** - Containers, packaging materials, PVC pipes
4. **Metals** - Steel, aluminum, copper, alloys
5. **Electronics** - Computers, components, cables
6. **Packaging** - Boxes, pallets, crates, bubble wrap
7. **Furniture** - Office furniture, home furniture, fixtures
8. **Glass** - Windows, bottles, decorative glass
9. **Paper & Cardboard** - Office paper, cardboard boxes
10. **Organic Materials** - Compostable items, natural fibers

Each category has subcategories and specific impact factors for CO2 savings calculations. Which category interests you?`;
  }

  // Default helpful response
  return `Hello! I'm your Circular Economy Assistant. I can help you with:

🔄 **Material Analysis** - Evaluate reuse potential and value
♻️ **Reuse Suggestions** - Creative ways to repurpose materials
🌍 **Sustainability Info** - CO2 savings, environmental impact
💰 **Pricing Guidance** - Fair market value for materials
📦 **Categorization** - Properly classify your materials

**Try asking me:**
- "How can I reuse old wooden pallets?"
- "What's the environmental impact of reusing textiles?"
- "Analyze this material: 50 kg of steel pipes in good condition"
- "What category should I use for construction waste?"

How can I help you today?`;
};

/**
 * Generate material analysis response
 */
const generateMaterialAnalysis = (material) => {
  const { title, description, category, condition, quantity, unit } = material;
  
  return `## Material Analysis: ${title || "Unknown Material"}

**Overview:**
${description || "No description provided."}

**Condition Assessment:** ${condition || "Not specified"}
- ${condition === "new" ? "Excellent - commands premium pricing" : 
     condition === "like_new" ? "Very good - minor wear, high value" :
     condition === "good" ? "Good - functional, moderate value" :
     condition === "fair" ? "Fair - usable, budget-friendly" : "Salvage - best for parts/recycling"}

**Quantity:** ${quantity || "Not specified"} ${unit || "units"}

**Reuse Potential:** High
Based on the material type, here are potential reuse scenarios:
1. **Direct Reuse** - Transfer to another project with same purpose
2. **Upcycling** - Transform into higher-value products
3. **Parts Harvesting** - Extract components for repair/refurbishment

**Environmental Impact Estimate:**
- Weight diverted from landfill: ~${quantity || 0} ${unit || "units"}
- Estimated CO2 savings: ${(quantity || 0) * 2.5} kg
- Trees equivalent: ${((quantity || 0) * 2.5 / 21).toFixed(1)} trees/year

**Recommendations:**
1. Add clear photos showing condition
2. Include dimensions and specifications
3. Mention any defects or limitations
4. Set competitive pricing based on condition

Would you like specific suggestions for pricing or potential buyers?`;
};

/**
 * Generate reuse suggestions
 */
const generateReuseSuggestions = (message, context) => {
  // Check for specific materials mentioned
  const materials = {
    pallet: `## Wooden Pallet Reuse Ideas 🪵

**Furniture & Home:**
- Coffee tables, bed frames, garden furniture
- Wall shelving, shoe racks, wine racks
- Vertical gardens, planter boxes

**Business Use:**
- Retail displays, event staging
- Warehouse racking, shipping (refurbished)

**Creative Projects:**
- Art installations, photography backdrops
- Fencing, chicken coops, compost bins

**Environmental Impact:**
Each pallet reused saves ~15-20 kg of wood and prevents ~25 kg CO2 emissions.`,
    
    textile: `## Textile Reuse Ideas 🧵

**Upcycling:**
- Bags, accessories, quilts from fabric scraps
- Cleaning rags for industrial use
- Insulation material (for certain textiles)

**Direct Reuse:**
- Donate to clothing drives, shelters
- Sell to vintage/thrift retailers
- Theater/costume rental companies

**Industrial Applications:**
- Automotive industry (sound dampening)
- Construction (protective covers)
- Agricultural use (ground cover)

**Environmental Impact:**
Textiles have HIGH environmental footprint (~20 kg CO2/kg). Reuse prevents significant emissions.`,

    electronic: `## Electronics Reuse Ideas 💻

**Refurbishment:**
- Repair and resell working devices
- Donate to schools, nonprofits
- Sell to certified refurbishers

**Component Harvesting:**
- Extract valuable metals (gold, copper, rare earths)
- Reuse screens, batteries, keyboards
- Harvest chips and processors

**Creative Repurposing:**
- Art projects, sculptures
- Educational displays
- DIY electronics projects

**⚠️ Important:** E-waste contains hazardous materials. Ensure proper handling and disposal of non-reusable components.`,
  };

  for (const [key, response] of Object.entries(materials)) {
    if (message.includes(key)) {
      return response;
    }
  }

  // Generic reuse advice
  return `## Creative Reuse Suggestions ♻️

Every material has reuse potential! Here's how to maximize it:

**1. Assess the Material:**
- What is it made of? (primary material)
- What condition is it in?
- What was its original purpose?

**2. Consider the 5 R's:**
- **Refuse** - Do you really need to dispose of it?
- **Reduce** - Can it be broken into smaller useful parts?
- **Reuse** - Same purpose, different location
- **Repurpose** - Different purpose entirely
- **Recycle** - Last resort, recover raw materials

**3. Find the Right Match:**
- List on our marketplace with clear photos
- Highlight unique features or possibilities
- Price fairly or offer for free to ensure reuse

**Popular Reuse Destinations:**
- 🏗️ Construction companies (building materials)
- 🎨 Artists & makers (creative materials)
- 📚 Schools & nonprofits (educational materials)
- 🏭 Manufacturers (raw material recovery)

Tell me about your specific material and I'll provide tailored suggestions!`;
};

/**
 * Generate sustainability information
 */
const generateSustainabilityInfo = (message) => {
  if (message.includes("co2") || message.includes("carbon")) {
    return `## Understanding CO2 Savings in Material Reuse 🌍

**How We Calculate CO2 Savings:**

When materials are reused instead of manufactured new, we save:
1. **Manufacturing emissions** - Energy used to make new products
2. **Raw material extraction** - Mining, logging, drilling
3. **Transportation** - Moving raw materials and products
4. **Disposal emissions** - Landfill methane, incineration

**CO2 Savings by Material Type:**

| Material | Avg CO2 Saved (per kg) | Equivalent |
|----------|----------------------|------------|
| Textiles | 20 kg | 1 car km x 120 |
| Electronics | 50 kg | 1 car km x 300 |
| Metals | 8 kg | 1 car km x 48 |
| Plastics | 3.5 kg | 1 car km x 21 |
| Construction | 2.5 kg | 1 car km x 15 |
| Glass | 1.5 kg | 1 car km x 9 |

**Your Impact Matters:**
- Reusing just 10 kg of textiles = planting 10 trees
- Reusing 100 kg of metal = taking 1 car off road for a month

Check your personal impact on the Analytics Dashboard!`;
  }

  return `## Environmental Impact of Material Reuse 🌱

**The Problem:**
- 2 billion tons of waste generated globally each year
- Only 16% is recycled; most ends up in landfills
- Landfills produce methane (25x worse than CO2)
- Manufacturing new products uses immense energy

**The Solution - Circular Economy:**

Instead of: Extract → Make → Use → Dispose (Linear)
We do: Make → Use → Reuse → Remake → Reuse (Circular)

**Your Impact on Our Platform:**

Every transaction on our marketplace contributes to:
✅ **Waste Diversion** - Materials stay out of landfills
✅ **CO2 Reduction** - Less manufacturing, less emissions
✅ **Resource Conservation** - Less extraction of raw materials
✅ **Economic Value** - Materials retain value longer

**Track Your Impact:**
Visit your Analytics Dashboard to see:
- Total kg diverted from landfill
- CO2 emissions prevented
- Environmental equivalents (trees planted, cars off road)
- Your ranking on the sustainability leaderboard

Together, we're building a more sustainable future! 🌍`;
};

/**
 * Generate circular economy information
 */
const generateCircularEconomyInfo = () => {
  return `## What is the Circular Economy? ♻️

**The Traditional Linear Economy:**
\`Take → Make → Use → Dispose\`

This model is unsustainable - we extract resources, use them briefly, then throw them away. It creates massive waste and depletes natural resources.

**The Circular Economy:**
\`Make → Use → Reuse → Repair → Recycle → Remake\`

In a circular economy, materials stay in use as long as possible through:

**Core Principles:**
1. **Design out waste** - Products designed for reuse/recycling
2. **Keep materials in use** - Repair, reuse, remanufacture
3. **Regenerate natural systems** - Return nutrients to earth

**Benefits:**
- 🌍 **Environmental** - Less pollution, preserved ecosystems
- 💰 **Economic** - New business models, cost savings
- 👥 **Social** - Jobs in repair, refurbishment, recycling

**How Our Platform Helps:**
1. **Marketplace** - Connect material suppliers with seekers
2. **Impact Tracking** - Measure your environmental contribution
3. **Logistics** - Easy coordination for material exchange
4. **AI Assistance** - Identify reuse opportunities

**Your Role:**
- List materials you no longer need
- Find materials you can reuse
- Track and celebrate your impact

Every material reused is a step toward a sustainable future!`;
};

/**
 * Main chat function - uses OpenAI if configured, otherwise mock responses
 */
export const chat = async ({
  messages,
  context = {},
  type = "general",
  model = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1000,
}) => {
  const startTime = Date.now();
  
  // Get the latest user message
  const lastUserMessage = messages.filter(m => m.role === "user").pop();
  const userContent = lastUserMessage?.content || "";

  // Build context string
  let contextString = "";
  if (context.material) {
    contextString = `\n\nContext - Current Material:\nTitle: ${context.material.title}\nCategory: ${context.material.category}\nCondition: ${context.material.condition}\nQuantity: ${context.material.quantity} ${context.material.unit}\nDescription: ${context.material.description}`;
  }

  const systemPrompt = getSystemPrompt(type) + contextString;

  // Try OpenAI first if configured
  if (isOpenAIConfigured()) {
    try {
      const response = await callOpenAI({
        messages,
        model,
        temperature,
        maxTokens,
        systemPrompt,
      });

      return {
        success: true,
        content: response.content,
        usage: response.usage,
        model: response.model,
        responseTime: Date.now() - startTime,
        source: "openai",
      };
    } catch (error) {
      console.error("OpenAI API error, falling back to mock:", error.message);
      // Fall through to mock response
    }
  }

  // Generate mock response
  const mockContent = generateMockResponse(userContent, context);

  return {
    success: true,
    content: mockContent,
    usage: {
      prompt_tokens: userContent.length / 4,
      completion_tokens: mockContent.length / 4,
      total_tokens: (userContent.length + mockContent.length) / 4,
    },
    model: "mock-assistant",
    responseTime: Date.now() - startTime,
    source: "mock",
  };
};

/**
 * Analyze a material and provide structured suggestions
 */
export const analyzeMaterial = async (material) => {
  const messages = [
    {
      role: "user",
      content: `Please analyze this material listing and provide suggestions:
      
Title: ${material.title}
Description: ${material.description}
Category: ${material.category}
Condition: ${material.condition}
Quantity: ${material.quantity} ${material.unit}
Location: ${material.address?.city || "Not specified"}

Provide:
1. Reuse potential assessment (high/medium/low)
2. Top 3 reuse suggestions
3. Recommended price range (if selling)
4. Potential buyer types
5. Environmental impact estimate (CO2 saved)`,
    },
  ];

  return chat({
    messages,
    context: { material },
    type: "material_analysis",
  });
};

/**
 * Get reuse suggestions for a material type
 */
export const getReuseSuggestions = async (materialType, condition = "good") => {
  const messages = [
    {
      role: "user",
      content: `Suggest creative reuse ideas for ${materialType} in ${condition} condition. Include:
1. DIY projects
2. Commercial applications
3. Donation opportunities
4. Upcycling ideas`,
    },
  ];

  return chat({
    messages,
    type: "reuse_suggestions",
  });
};

export default {
  chat,
  analyzeMaterial,
  getReuseSuggestions,
  isOpenAIConfigured,
  getSystemPrompt,
};
