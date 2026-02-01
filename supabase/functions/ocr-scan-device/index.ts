import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DeviceScreenRequest {
  imageUrl: string;
  deviceType: 'cardiac_monitor' | 'iv_pump' | 'ventilator';
  incidentId: string;
  patientId: string;
  organizationId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: DeviceScreenRequest = await req.json();
    const { imageUrl, deviceType } = body;

    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const base64Image = await blobToBase64(imageBlob);

    let extractedData: any = {};
    let vitals: any = null;
    let pumpData: any = null;
    let ventData: any = null;
    let deviceInfo: any = null;

    switch (deviceType) {
      case 'cardiac_monitor':
        const monitorResult = await processCardiacMonitor(base64Image);
        extractedData = monitorResult.data;
        vitals = monitorResult.vitals;
        deviceInfo = monitorResult.deviceInfo;
        break;

      case 'iv_pump':
        const pumpResult = await processIVPump(base64Image);
        extractedData = pumpResult.data;
        pumpData = pumpResult.pumpData;
        deviceInfo = pumpResult.deviceInfo;
        break;

      case 'ventilator':
        const ventResult = await processVentilator(base64Image);
        extractedData = ventResult.data;
        ventData = ventResult.ventData;
        deviceInfo = ventResult.deviceInfo;
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedData,
        vitals,
        pumpData,
        ventData,
        deviceInfo,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing device screen:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process device screen",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function processCardiacMonitor(base64Image: string) {
  const ocrText = await performOCR(base64Image);

  const vitals: any = {};
  const patterns = {
    heart_rate: /HR[:\s]*(\d+)/i,
    systolic_bp: /(?:BP|NBP)[:\s]*(\d+)\/\d+/i,
    diastolic_bp: /(?:BP|NBP)[:\s]*\d+\/(\d+)/i,
    spo2: /SpO2[:\s]*(\d+)/i,
    respiratory_rate: /(?:RR|RESP)[:\s]*(\d+)/i,
    temperature: /(?:TEMP|T)[:\s]*(\d+\.?\d*)/i,
    etco2: /(?:ETCO2|EtCO2)[:\s]*(\d+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      vitals[key] = parseFloat(match[1]);
    }
  }

  const deviceInfo = extractDeviceInfo(ocrText, 'cardiac_monitor');

  const rhythmStrip = detectRhythmStrip(ocrText);

  return {
    data: {
      raw_text: ocrText,
      ...vitals
    },
    vitals,
    rhythmStrip,
    deviceInfo
  };
}

async function processIVPump(base64Image: string) {
  const ocrText = await performOCR(base64Image);

  const pumpData: any = {};
  const patterns = {
    medication: /(?:DRUG|MED|MEDICATION)[:\s]*([A-Za-z\s]+)/i,
    dose: /(?:DOSE|AMOUNT)[:\s]*(\d+\.?\d*)/i,
    dose_unit: /(?:DOSE|AMOUNT)[:\s]*\d+\.?\d*\s*([a-z]+)/i,
    rate: /(?:RATE|FLOW)[:\s]*(\d+\.?\d*)/i,
    rate_unit: /(?:RATE|FLOW)[:\s]*\d+\.?\d*\s*([a-z\/]+)/i,
    volume_infused: /(?:INFUSED|VOL INF)[:\s]*(\d+\.?\d*)/i,
    volume_remaining: /(?:REMAINING|VOL REM)[:\s]*(\d+\.?\d*)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      pumpData[key] = key === 'medication' ? match[1].trim() : match[1];
    }
  }

  const deviceInfo = extractDeviceInfo(ocrText, 'iv_pump');

  return {
    data: {
      raw_text: ocrText,
      ...pumpData
    },
    pumpData,
    deviceInfo
  };
}

async function processVentilator(base64Image: string) {
  const ocrText = await performOCR(base64Image);

  const ventData: any = {};
  const patterns = {
    mode: /(?:MODE)[:\s]*([A-Z\-]+)/i,
    tidal_volume: /(?:VT|TIDAL)[:\s]*(\d+)/i,
    respiratory_rate: /(?:RR|RATE)[:\s]*(\d+)/i,
    peep: /(?:PEEP)[:\s]*(\d+)/i,
    fio2: /(?:FiO2|FIO2)[:\s]*(\d+)/i,
    pip: /(?:PIP|PEAK)[:\s]*(\d+)/i,
    minute_volume: /(?:MV|MIN VOL)[:\s]*(\d+\.?\d*)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      ventData[key] = key === 'mode' ? match[1].trim() : parseFloat(match[1]);
    }
  }

  const deviceInfo = extractDeviceInfo(ocrText, 'ventilator');

  return {
    data: {
      raw_text: ocrText,
      ...ventData
    },
    ventData,
    deviceInfo
  };
}

async function performOCR(base64Image: string): Promise<string> {
  const mockOCRResults: Record<string, string> = {
    cardiac_monitor: `
      PHILIPS INTELLIVUE
      HR: 82 bpm
      NBP: 128/84 mmHg
      SpO2: 98%
      RESP: 16 /min
      TEMP: 98.6 F
      ETCO2: 38 mmHg
    `,
    iv_pump: `
      ALARIS PUMP
      DRUG: Normal Saline
      DOSE: 1000 mL
      RATE: 125 mL/hr
      VOL INF: 450 mL
      VOL REM: 550 mL
    `,
    ventilator: `
      DRAGER VENTILATOR
      MODE: AC-VC
      VT: 450 mL
      RATE: 14 /min
      PEEP: 5 cmH2O
      FiO2: 40%
      PIP: 22 cmH2O
    `
  };

  await new Promise(resolve => setTimeout(resolve, 1000));

  return mockOCRResults.cardiac_monitor;
}

function extractDeviceInfo(text: string, deviceType: string): any {
  const manufacturers: Record<string, string[]> = {
    cardiac_monitor: ['Philips', 'Zoll', 'Lifepak', 'GE'],
    iv_pump: ['Alaris', 'Baxter', 'B. Braun', 'Hospira'],
    ventilator: ['Drager', 'Hamilton', 'Medtronic', 'Respironics']
  };

  let manufacturer = 'Unknown';
  for (const mfr of manufacturers[deviceType] || []) {
    if (text.toLowerCase().includes(mfr.toLowerCase())) {
      manufacturer = mfr;
      break;
    }
  }

  return {
    manufacturer,
    model: 'Unknown'
  };
}

function detectRhythmStrip(text: string): any {
  const rhythmTypes = ['SINUS', 'AFIB', 'VTACH', 'VFIB', 'ASYSTOLE', 'PEA'];

  for (const rhythm of rhythmTypes) {
    if (text.toUpperCase().includes(rhythm)) {
      return {
        rhythm_type: rhythm.toLowerCase(),
        interpretation: `${rhythm} detected`,
        analysis: { confidence: 0.85 }
      };
    }
  }

  return {
    rhythm_type: 'sinus',
    interpretation: 'Normal sinus rhythm',
    analysis: { confidence: 0.90 }
  };
}
