import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function detectSourceFromUrl(urlStr: string): string {

  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();

    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('naukri.com')) return 'Naukri';
    if (host.includes('indeed.com')) return 'Indeed';
    return 'Other';
  } catch {
    return 'Other';
  }
}

function extractFirstUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s"'<>\(\)]+)/i;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Phase 4: Fetch metadata (OG tags / JSON-LD)
async function fetchUrlMetadata(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) return '';

    const html = await response.text();
    const metadataParts: string[] = [];

    // OG Title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+name=["']title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<title>([^<]+)<\/title>/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      metadataParts.push(`Page Title: ${ogTitleMatch[1].trim()}`);
    }

    // OG Description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      metadataParts.push(`Description: ${ogDescMatch[1].trim()}`);
    }

    // JSON-LD JobPosting
    const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([^<]+)<\/script>/gi);
    if (jsonLdMatch) {
      for (const script of jsonLdMatch) {
        try {
          const content = script.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const parsed = JSON.parse(content);
          const jobObj = Array.isArray(parsed) ? parsed.find(item => item['@type'] === 'JobPosting') : (parsed['@type'] === 'JobPosting' ? parsed : null);
          if (jobObj) {
            if (jobObj.title) metadataParts.push(`Job Title: ${jobObj.title}`);
            if (jobObj.hiringOrganization?.name) metadataParts.push(`Company: ${jobObj.hiringOrganization.name}`);
            if (jobObj.jobLocation?.address?.addressLocality) {
              metadataParts.push(`Location: ${jobObj.jobLocation.address.addressLocality}, ${jobObj.jobLocation.address.addressCountry || ''}`);
            }
            if (jobObj.employmentType) metadataParts.push(`Employment Type: ${jobObj.employmentType}`);
            if (jobObj.description) {
              const cleanDesc = jobObj.description.replace(/<[^>]*>/g, ' ').slice(0, 500);
              metadataParts.push(`Job Details: ${cleanDesc}`);
            }
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }

    return metadataParts.join('\n');
  } catch (err) {
    console.warn('Phase 4 fetch metadata warning (continuing silently):', err);
    return '';
  }
}

// Fallback heuristic extraction when LLM API Key is unavailable or call fails
function heuristicExtract(text: string) {
  let workMode: "Remote" | "Hybrid" | "On-site" | null = null;
  const lowerText = text.toLowerCase();

  if (lowerText.includes('remote')) {
    workMode = 'Remote';
  } else if (lowerText.includes('hybrid')) {
    workMode = 'Hybrid';
  } else if (lowerText.includes('on-site') || lowerText.includes('onsite') || lowerText.includes('in-office')) {
    workMode = 'On-site';
  }

  // Salary range regex (e.g. ₹18L - ₹22L, $90k-$110k, 18,0 00 - 25,000)
  const salaryRegex = /(?:₹|\$|EUR|GBP|INR|\bRs\.?\b)\s*[\d,.]+(?:\s*[kKmLlL]\b)?(?:\s*[-–—to]\s*(?:₹|\$|EUR|GBP|INR|\bRs\.?\b)?\s*[\d,.]+(?:\s*[kKmLlL]\b)?)?(?:\s*\/(?:yr|year|hr|hour|mo|month))?/i;
  const salaryMatch = text.match(salaryRegex);
  const salary_range = salaryMatch ? salaryMatch[0].trim() : null;

  // Company Name heuristic (e.g. Acme Robotics — Embedded Firmware Engineer, or at XYZ)
  let company_name: string | null = null;
  const atCompanyMatch = text.match(/(?:at|company:?|hiring at)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?=\s+[-–—·\n,.]|$)/i);
  if (atCompanyMatch) {
    company_name = atCompanyMatch[1].trim();
  } else {
    const dashMatch = text.match(/^([A-Z][A-Za-z0-9\s&.,'-]+?)\s*[-–—·]\s*([A-Z][A-Za-z0-9\s&.,'-]+)/m);
    if (dashMatch) {
      company_name = dashMatch[1].trim();
    }
  }

  // Job Title heuristic
  let job_title: string | null = null;
  const titleKeywords = /(?:Engineer|Developer|Manager|Architect|Analyst|Designer|Lead|Specialist|Consultant|Scientist|Intern|Associate)/i;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (titleKeywords.test(line) && line.length < 80) {
      // If contains dash, take second part if first was company
      if (line.includes('—') || line.includes('-') || line.includes('·')) {
        const parts = line.split(/[-–—·]/);
        job_title = parts[parts.length - 1].trim();
      } else {
        job_title = line;
      }
      break;
    }
  }

  // Location heuristic
  let location_details: string | null = null;
  const locationMatch = text.match(/(?:Location|Based in|Office):?\s*([A-Za-z\s,.-]+?)(?=\s*[-–—·\n]|$)/i) ||
                        text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/);
  if (locationMatch) {
    location_details = locationMatch[1].trim();
  }

  // Summary Notes
  let notes: string | null = null;
  if (lines.length > 0) {
    const summaryLines = lines.slice(0, 3).join(' ');
    notes = summaryLines.slice(0, 250);
  }

  return {
    company_name,
    job_title,
    location_details,
    work_mode: workMode,
    salary_range,
    notes,
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rawInput: string = (body.input || body.url || body.text || '').trim();

    if (!rawInput) {
      return NextResponse.json({ error: 'Please provide a job posting URL or description text.' }, { status: 400 });
    }

    // Phase 3: Detect URL & Source
    const extractedUrl = extractFirstUrl(rawInput);
    const application_source = extractedUrl ? detectSourceFromUrl(extractedUrl) : 'Other';

    // Phase 4: Fetch Metadata if URL present
    let fetchedMetadataText = '';
    if (extractedUrl) {
      fetchedMetadataText = await fetchUrlMetadata(extractedUrl);
    }

    const combinedTextToParse = [rawInput, fetchedMetadataText].filter(Boolean).join('\n\n--- Metadata ---\n\n');

    let parsedFields: {
      company_name: string | null;
      job_title: string | null;
      location_details: string | null;
      work_mode: 'Remote' | 'Hybrid' | 'On-site' | null;
      salary_range: string | null;
      notes: string | null;
    };

    let warningMessage: string | null = null;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      // Phase 5: LLM Extraction via Anthropic Claude API
      try {
        const systemPrompt = `You are a job-posting field extractor. You will receive raw text from a job posting (from LinkedIn, Naukri, or Indeed) and must return ONLY a JSON object with these exact keys: company_name, job_title, location_details, work_mode, salary_range, notes.

Rules:
- work_mode must be exactly "Remote", "Hybrid", "On-site", or null.
- notes should be a 2-3 sentence summary of the role, not the full posting.
- If a field is not clearly present in the text, return null for it.
  Never guess or invent a value.
- Return valid JSON only. No other text, no markdown fences.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: `Extract job posting fields from this text:\n\n${combinedTextToParse.slice(0, 4000)}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn('Anthropic API request failed, falling back to heuristic parsing:', errBody);
          parsedFields = heuristicExtract(combinedTextToParse);
          warningMessage = "Couldn't auto-detect all fields via LLM — extracted best effort. Please review and fill in manually.";
        } else {
          const resJson = await response.json();
          const responseText = resJson.content?.[0]?.text || '';
          const cleanedJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

          const jsonObj = JSON.parse(cleanedJsonText);
          parsedFields = {
            company_name: jsonObj.company_name || null,
            job_title: jsonObj.job_title || null,
            location_details: jsonObj.location_details || null,
            work_mode: ['Remote', 'Hybrid', 'On-site'].includes(jsonObj.work_mode) ? jsonObj.work_mode : null,
            salary_range: jsonObj.salary_range || null,
            notes: jsonObj.notes || null,
          };
        }
      } catch (err: any) {
        console.warn('LLM parsing exception, falling back to heuristic:', err);
        parsedFields = heuristicExtract(combinedTextToParse);
        warningMessage = "Couldn't auto-detect all fields via LLM — extracted best effort. Please review and fill in manually.";
      }
    } else {
      // Heuristic parsing when ANTHROPIC_API_KEY is not configured
      parsedFields = heuristicExtract(combinedTextToParse);
      if (!parsedFields.company_name && !parsedFields.job_title) {
        warningMessage = "Couldn't auto-detect company or title — go ahead and fill them in manually.";
      }
    }

    // Phase 6 & 8: Validate & Trim
    const validWorkMode = ['Remote', 'Hybrid', 'On-site'].includes(parsedFields.work_mode as string)
      ? parsedFields.work_mode
      : null;

    let trimmedNotes = parsedFields.notes || null;
    if (trimmedNotes && trimmedNotes.length > 300) {
      trimmedNotes = trimmedNotes.slice(0, 300) + '…';
    }

    const auto_filled_fields: string[] = ['application_source'];
    if (extractedUrl) auto_filled_fields.push('job_posting_url');
    if (parsedFields.company_name) auto_filled_fields.push('company_name');
    if (parsedFields.job_title) auto_filled_fields.push('job_title');
    if (parsedFields.location_details) auto_filled_fields.push('location_details');
    if (validWorkMode) auto_filled_fields.push('work_mode');
    if (parsedFields.salary_range) auto_filled_fields.push('salary_range');
    if (trimmedNotes) auto_filled_fields.push('notes');

    return NextResponse.json({
      success: true,
      data: {
        company_name: parsedFields.company_name || '',
        job_title: parsedFields.job_title || '',
        location_details: parsedFields.location_details || '',
        work_mode: validWorkMode || 'Remote',
        salary_range: parsedFields.salary_range || '',
        notes: trimmedNotes || '',
        application_source: application_source,
        job_posting_url: extractedUrl || (rawInput.startsWith('http') ? rawInput : ''),
      },
      auto_filled_fields,
      warning: warningMessage,
    });
  } catch (error: any) {
    console.error('Error in /api/parse-job-posting:', error);
    return NextResponse.json(
      {
        error: 'Failed to process job posting.',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
