export const usePatientStatement = () => {
  const supabase = useSupabaseClient()

  const generatePatientStatement = async (data: {
    invoiceId: string
    serviceDate: string
    serviceType: 'ambulance_transport' | 'telehealth'
    serviceDescription: string
    originAddress?: string
    destinationAddress?: string
    levelOfService: string
    totalCharge: number
    insurancePayment: number
    adjustments: number
    patientBalance: number
  }) => {
    const statementNumber = `STMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const { data: statement, error } = await supabase
      .from('patient_statements')
      .insert({
        invoice_id: data.invoiceId,
        statement_number: statementNumber,
        service_date: data.serviceDate,
        service_type: data.serviceType,
        service_description: data.serviceDescription,
        origin_address: data.originAddress || null,
        destination_address: data.destinationAddress || null,
        level_of_service: data.levelOfService,
        total_charge: data.totalCharge,
        insurance_payment: data.insurancePayment,
        adjustments: data.adjustments,
        patient_balance: data.patientBalance
      })
      .select()
      .single()

    if (error) throw error
    return statement
  }

  const generateAmbulanceStatement = async (
    invoiceId: string,
    encounterData: {
      serviceDate: string
      originAddress: string
      destinationAddress: string
      serviceLevel: string
      totalCharge: number
      insurancePayment: number
      adjustments: number
    }
  ) => {
    const levelOfServiceMap: Record<string, string> = {
      'BLS': 'Basic Life Support ambulance transport',
      'ALS1': 'Advanced Life Support Level 1 ambulance transport',
      'ALS2': 'Advanced Life Support Level 2 ambulance transport',
      'SCT': 'Specialty Care Transport ambulance service',
      'wheelchair': 'Wheelchair van transport',
      'air': 'Air ambulance transport'
    }

    const serviceDescription = levelOfServiceMap[encounterData.serviceLevel] || 'Ambulance transport service'
    const patientBalance = encounterData.totalCharge - encounterData.insurancePayment - encounterData.adjustments

    return await generatePatientStatement({
      invoiceId,
      serviceDate: encounterData.serviceDate,
      serviceType: 'ambulance_transport',
      serviceDescription,
      originAddress: encounterData.originAddress,
      destinationAddress: encounterData.destinationAddress,
      levelOfService: serviceDescription,
      totalCharge: encounterData.totalCharge,
      insurancePayment: encounterData.insurancePayment,
      adjustments: encounterData.adjustments,
      patientBalance
    })
  }

  const generateTelehealthStatement = async (
    invoiceId: string,
    encounterData: {
      serviceDate: string
      providerType: string
      serviceCategory: string
      durationMinutes: number
      totalCharge: number
      insurancePayment: number
      adjustments: number
    }
  ) => {
    const providerMap: Record<string, string> = {
      'physician': 'physician consultation',
      'nurse_practitioner': 'nurse practitioner consultation',
      'physician_assistant': 'physician assistant consultation',
      'nurse': 'nursing consultation',
      'paramedic': 'paramedic assessment',
      'emt': 'EMT assessment'
    }

    const categoryMap: Record<string, string> = {
      'consultation': 'telehealth consultation',
      'follow_up': 'telehealth follow-up visit',
      'triage': 'telehealth triage assessment',
      'assessment': 'telehealth medical assessment',
      'urgent_care': 'telehealth urgent care visit',
      'mental_health': 'telehealth mental health session'
    }

    const providerDesc = providerMap[encounterData.providerType] || 'telehealth provider consultation'
    const categoryDesc = categoryMap[encounterData.serviceCategory] || 'telehealth service'

    const serviceDescription = `${categoryDesc} with ${providerDesc} (${encounterData.durationMinutes} minutes)`
    const patientBalance = encounterData.totalCharge - encounterData.insurancePayment - encounterData.adjustments

    return await generatePatientStatement({
      invoiceId,
      serviceDate: encounterData.serviceDate,
      serviceType: 'telehealth',
      serviceDescription,
      levelOfService: serviceDescription,
      totalCharge: encounterData.totalCharge,
      insurancePayment: encounterData.insurancePayment,
      adjustments: encounterData.adjustments,
      patientBalance
    })
  }

  const getStatement = async (invoiceId: string) => {
    const { data, error } = await supabase
      .from('patient_statements')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  return {
    generatePatientStatement,
    generateAmbulanceStatement,
    generateTelehealthStatement,
    getStatement
  }
}
