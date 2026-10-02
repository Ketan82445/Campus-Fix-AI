import { GoogleGenerativeAI, Content, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError, UserPayload } from '../types';

export class ChatService {
  public static async analyzeImage(base64Image: string, mimeType: string): Promise<string[]> {
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) return [];
    
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = "Analyze this image from a campus maintenance perspective. Identify 2 to 4 very short tags (1-3 words max) describing the possible issue (e.g. 'Water leak', 'Broken furniture', 'Electrical damage'). Return ONLY a comma-separated list of tags, nothing else.";
      const imageParts = [{ inlineData: { data: base64Image.split(',')[1], mimeType } }];
      
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text().split(',').map(s => s.trim()).filter(Boolean);
    } catch (err) {
      console.error('Vision AI error:', err);
      return [];
    }
  }

  public static async generateTroubleshootingSteps(description: string, category: string): Promise<string[]> {
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) return ['Inspect the area.', 'Check for visible damage.', 'Verify power/water supply.', 'Escalate if unresolved.'];
    
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are a senior campus maintenance engineer. Based on the following complaint description and category, provide 3 to 5 clear, concise, actionable troubleshooting steps for a junior technician. \nCategory: ${category}\nDescription: ${description}\nReturn ONLY a JSON array of strings. Do not include markdown formatting or backticks.`;
      
      const result = await model.generateContent(prompt);
      const responseText = (await result.response).text().trim();
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const steps = JSON.parse(cleanedText);
        return Array.isArray(steps) ? steps : [];
      } catch (e) {
        // Fallback parsing
        return cleanedText.split('\n').map(s => s.replace(/^\d+\.\s*/, '').replace(/^- /, '').replace(/["]/g, '').trim()).filter(Boolean);
      }
    } catch (err) {
      console.error('Troubleshooting AI error:', err);
      return ['Inspect the area.', 'Check for visible damage.', 'Verify power/water supply.', 'Escalate if unresolved.'];
    }
  }

  public static async processChat(user: UserPayload, messages: any[]) {
    const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new AppError('Gemini API Key is missing from the server environment variables. Please add it to Vercel.', 500, 'SERVER_ERROR');
    }
    const genAI = new GoogleGenerativeAI(geminiKey);

    const systemPrompt = `You are the CampusFix AI Assistant. You are a helpful, professional, and concise campus operations assistant.
You are currently talking to a user named ${user.name} who has the role of ${user.role}.
If they are a STUDENT, help them with their complaints.
If they are a TECHNICIAN, help them with maintenance and inventory.
If they are an ADMIN, provide system overviews.
You have access to tools to look up real-time database information. ALWAYS use your tools when asked about specific complaints, inventory, or tasks. Do not guess.`;

    const getMyComplaintsTool: FunctionDeclaration = {
      name: 'get_my_complaints',
      description: 'Get a list of recent complaints created by the current user (mostly for students).',
    };

    const getComplaintStatusTool: FunctionDeclaration = {
      name: 'get_complaint_status',
      description: 'Get the exact status and details of a specific complaint by its complaintNumber (e.g. CMP-12345).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          complaintNumber: { type: SchemaType.STRING, description: 'The complaint number, e.g., CMP-12345' }
        },
        required: ['complaintNumber']
      }
    };

    const checkInventoryTool: FunctionDeclaration = {
      name: 'check_inventory',
      description: 'Check the stock level of spare parts or inventory items. Use this when a technician asks about stock.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          searchQuery: { type: SchemaType.STRING, description: 'The name or SKU of the part to search for (e.g. AC Filter)' }
        }
      }
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: [getMyComplaintsTool, getComplaintStatusTool, checkInventoryTool] }],
    });

    // Format messages for Gemini (roles must be 'user' or 'model')
    const contents: Content[] = messages.map((m: any) => ({
      role: m.role === 'ai' || m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Send to Gemini
    const result = await model.generateContent({ contents });
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const functionResponses: any[] = [];

      for (const call of functionCalls) {
        let functionResult: any = {};
        const args = call.args as any;

        try {
          if (call.name === 'get_my_complaints') {
            const complaints = await prisma.complaint.findMany({
              where: { createdById: user.id },
              select: { complaintNumber: true, title: true, status: true, priority: true, createdAt: true },
              take: 5,
              orderBy: { createdAt: 'desc' }
            });
            functionResult = { complaints };
          } 
          else if (call.name === 'get_complaint_status') {
            const complaint = await prisma.complaint.findUnique({
              where: { complaintNumber: args.complaintNumber },
              select: {
                createdById: true,
                status: true,
                title: true,
                priority: true,
                assignedTechnician: { select: { name: true } },
                resolvedAt: true
              }
            });

            if (!complaint) {
              functionResult = { error: 'Complaint not found.' };
            } else if (user.role === 'STUDENT' && complaint.createdById !== user.id) {
              functionResult = { error: 'Access denied: You can only check the status of your own complaints.' };
            } else {
              functionResult = {
                complaint: {
                  status: complaint.status,
                  title: complaint.title,
                  priority: complaint.priority,
                  assignedTechnician: complaint.assignedTechnician,
                  resolvedAt: complaint.resolvedAt
                }
              };
            }
          }
          else if (call.name === 'check_inventory') {
            if (user.role === 'STUDENT') {
              functionResult = { error: 'Access denied: Only technicians and administrators can inspect inventory records.' };
            } else {
              const query = args.searchQuery;
              const items = await prisma.inventoryItem.findMany({
                where: query ? {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { sku: { contains: query, mode: 'insensitive' } }
                  ]
                } : undefined,
                select: { sku: true, name: true, quantity: true }
              });
              functionResult = { items: items.length > 0 ? items : 'No items found matching that query.' };
            }
          }
        } catch (error: any) {
          functionResult = { error: `Error executing tool: ${error.message}` };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: functionResult
          }
        });
      }

      // Add the model's function call request to the history
      contents.push({
        role: 'model',
        parts: functionCalls.map(c => ({ functionCall: c }))
      });

      // Add the tool execution results to the history
      // Note: Gemini uses 'user' role for sending function responses back, or just 'function' depending on SDK version.
      // @google/generative-ai prefers role: 'function' or passing directly as user parts. 
      // We'll use role: 'function' per docs or a user message with functionResponse parts.
      contents.push({
        role: 'user', // Gemini expects the function response from the user side
        parts: functionResponses
      });

      // Get final response
      const finalResult = await model.generateContent({ contents });
      return finalResult.response.text();
    }

    return response.text();
  }
}
